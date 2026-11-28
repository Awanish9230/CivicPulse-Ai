import mongoose from 'mongoose';
import Petition from "./petition.model.js";
import ApiError from "../../utils/ApiError.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import type { AuthenticatedUser } from "../../types/express.js";

export const getPetitions = async (actor?: AuthenticatedUser) => {
    const activePetitions = await Petition.find({ status: 'Active' });
    const now = new Date();

    for (const petition of activePetitions) {
        const ageInMs = now.getTime() - new Date(petition.createdAt).getTime();
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

        let shouldReject = false;

        if (ageInDays >= 30 && petition.upvotes.length < petition.targetSignatures) {
            shouldReject = true;
        }

        if (ageInDays >= 7 && petition.upvotes.length < 50) {
            shouldReject = true;
        }

        if (shouldReject) {
            petition.status = 'Rejected';
            await petition.save();
        }
    }

    const petitions = await Petition.find({ status: { $in: ['Active', 'Escalated'] } })
        .populate('creator', 'displayName anonymousId')
        .sort({ upvotes: -1, createdAt: -1 });

    const formattedPetitions = petitions.map((p) => ({
        ...p.toObject(),
        upvoteCount: p.upvotes.length,
        hasUpvoted: actor ? p.upvotes.some((uid) => uid.toString() === actor._id.toString()) : false
    }));

    formattedPetitions.sort((a, b) => b.upvoteCount - a.upvoteCount);
    return formattedPetitions;
};

export interface CreatePetitionInput {
    title?: string;
    description?: string;
    category?: string;
    file?: Express.Multer.File;
}

export const createPetition = async (
    input: CreatePetitionInput,
    actor: AuthenticatedUser
) => {
    const { title, description, category, file } = input;

    if (!title || !description || !category) {
        throw new ApiError(400, "All fields are required");
    }

    let imageUrl: string | null = null;
    if (file) {
        const uploadResult = await uploadOnCloudinary(file.buffer);
        if (uploadResult) {
            imageUrl = uploadResult.secure_url;
        }
    }

    return Petition.create({
        title,
        description,
        category,
        imageUrl,
        creator: actor._id,
        upvotes: [actor._id]
    });
};

export const toggleUpvote = async (
    petitionId: string,
    userId: mongoose.Types.ObjectId
) => {
    const petition = await Petition.findById(petitionId);
    if (!petition) {
        throw new ApiError(404, "Petition not found");
    }

    if (petition.status === 'Rejected') {
        throw new ApiError(400, "Cannot upvote a rejected petition");
    }

    const hasUpvoted = petition.upvotes.some((uid) => uid.toString() === userId.toString());
    let message = "";

    if (hasUpvoted) {
        petition.upvotes = petition.upvotes.filter((uid) => uid.toString() !== userId.toString());
        message = "Upvote removed";
    } else {
        petition.upvotes.push(userId);
        message = "Petition upvoted";

        if (petition.upvotes.length >= petition.targetSignatures && petition.status !== 'Escalated') {
            petition.status = 'Escalated';
        }
    }

    await petition.save();

    return {
        data: {
            upvoteCount: petition.upvotes.length,
            hasUpvoted: !hasUpvoted,
            status: petition.status
        },
        message
    };
};
