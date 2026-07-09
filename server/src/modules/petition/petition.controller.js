import Petition from "./petition.model.js";
import asyncHandler from "../../utils/asynchandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

// Fetch and auto-expire petitions lazily
export const getPetitions = asyncHandler(async (req, res) => {
    // First, fetch all active petitions to evaluate expiration rules
    const activePetitions = await Petition.find({ status: 'Active' });
    
    const now = new Date();
    
    // Evaluate rules and update if necessary
    for (const petition of activePetitions) {
        const ageInMs = now - new Date(petition.createdAt);
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
        
        let shouldReject = false;
        
        // 30-Day Rule
        if (ageInDays >= 30 && petition.upvotes.length < petition.targetSignatures) {
            shouldReject = true;
        }
        
        // 7-Day Rule
        if (ageInDays >= 7 && petition.upvotes.length < 50) {
            shouldReject = true;
        }
        
        if (shouldReject) {
            petition.status = 'Rejected';
            await petition.save();
        }
    }

    // Now fetch petitions (Active or Escalated) and sort by top upvotes
    const petitions = await Petition.find({ status: { $in: ['Active', 'Escalated'] } })
        .populate('creator', 'displayName anonymousId')
        .sort({ upvotes: -1, createdAt: -1 }); // Sort by upvotes, then newest

    // Add virtual upvote count for easier frontend processing
    const formattedPetitions = petitions.map(p => ({
        ...p.toObject(),
        upvoteCount: p.upvotes.length,
        hasUpvoted: req.user ? p.upvotes.includes(req.user._id) : false
    }));

    // Sort heavily by upvote count to ensure highest is at the top
    formattedPetitions.sort((a, b) => b.upvoteCount - a.upvoteCount);

    res.status(200).json(new ApiResponse(200, formattedPetitions, "Petitions fetched successfully"));
});

// Create a new petition
export const createPetition = asyncHandler(async (req, res) => {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
        throw new ApiError(400, "All fields are required");
    }

    let imageUrl = null;
    if (req.file) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (uploadResult) {
            imageUrl = uploadResult.secure_url;
        }
    }

    const petition = await Petition.create({
        title,
        description,
        category,
        imageUrl,
        creator: req.user._id,
        upvotes: [req.user._id] // Creator automatically upvotes
    });

    res.status(201).json(new ApiResponse(201, petition, "Petition created successfully"));
});

// Toggle upvote on a petition
export const toggleUpvote = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const petition = await Petition.findById(id);

    if (!petition) {
        throw new ApiError(404, "Petition not found");
    }

    if (petition.status === 'Rejected') {
        throw new ApiError(400, "Cannot upvote a rejected petition");
    }

    const hasUpvoted = petition.upvotes.includes(userId);
    let message = "";

    if (hasUpvoted) {
        petition.upvotes.pull(userId);
        message = "Upvote removed";
    } else {
        petition.upvotes.push(userId);
        message = "Petition upvoted";
        
        // Check if target is met
        if (petition.upvotes.length >= petition.targetSignatures && petition.status !== 'Escalated') {
            petition.status = 'Escalated';
            // Here you could trigger a notification to the Admin via Socket.io or Email
        }
    }

    await petition.save();

    res.status(200).json(new ApiResponse(200, {
        upvoteCount: petition.upvotes.length,
        hasUpvoted: !hasUpvoted,
        status: petition.status
    }, message));
});
