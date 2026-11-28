import { GoogleGenerativeAI } from '@google/generative-ai';
import Complaint, { ComplaintCategory, ComplaintDocument } from './complaint.model.js';
import User from '../user/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { getCategoriesForDepartment } from '../../utils/departmentMapping.js';
import uploadOnCloudinary, { deleteFromCloudinary } from '../../utils/cloudinary.js';
import notificationService from '../notification/notification.service.js';
import { apiKeyManager } from '../../utils/apiKeyManager.js';
import type { AuthenticatedUser } from '../../types/express.js';

export interface CreateComplaintInput {
    category?: ComplaintCategory;
    description?: string;
    coordinates?: unknown;
    address?: unknown;
    language?: string;
    files?: Express.Multer.File[];
}

export interface CreateComplaintResult {
    isDuplicate: boolean;
    complaint: ComplaintDocument;
    newlyEarnedBadges: string[];
}

const getUserIdentities = (user: AuthenticatedUser): string[] => [
    user.anonymousId,
    ...(user.pastAnonymousIds || [])
];

export const resolveComplaint = async (
    complaintId: string,
    actor: AuthenticatedUser
) => {
    if (actor.role !== 'Authority') {
        throw new ApiError(403, "Only authorities can resolve complaints");
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    if (complaint.status === "Resolved") {
        throw new ApiError(400, "Complaint is already resolved");
    }

    if (complaint.imageUrls && complaint.imageUrls.length > 1) {
        for (let i = 1; i < complaint.imageUrls.length; i++) {
            await deleteFromCloudinary(complaint.imageUrls[i]);
        }
        complaint.imageUrls = [complaint.imageUrls[0]];
    }

    complaint.status = "Resolved";
    await complaint.save();

    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().emit('complaint_status_update', complaint);
        getIo().to('admin_room').emit('stats_update', { type: 'complaint_resolved' });

        await notificationService.createNotification({
            recipient: complaint.reportedBy,
            sender: actor._id,
            title: 'Complaint Resolved',
            message: `Your complaint regarding ${complaint.category} has been marked as resolved by ${actor.name || "a City Official"}.`,
            type: 'Complaint Resolved',
            priority: 'Medium',
            complaint: complaint._id,
            actionUrl: `/complaints/${complaint._id}`
        });
    } catch (e) {
        console.error("Socket error on resolve complaint", e);
    }

    return complaint;
};

export const addOfficialReply = async (
    complaintId: string,
    content: string | undefined,
    actor: AuthenticatedUser
) => {
    if (!content) {
        throw new ApiError(400, "Reply content is required");
    }

    const authorityName = actor?.anonymousId || "City Official";

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    complaint.officialReplies.push({
        authorityName,
        content,
        createdAt: new Date()
    });

    await complaint.save();

    try {
        await notificationService.createNotification({
            recipient: complaint.reportedBy,
            sender: actor._id,
            title: 'Authority Commented',
            message: `An official replied: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            type: 'Authority Commented',
            priority: 'Medium',
            complaint: complaint._id,
            actionUrl: `/complaints/${complaint._id}`
        });
    } catch (error) {
        console.error("Notification error on official reply", error);
    }

    return complaint;
};

export const createComplaint = async (
    input: CreateComplaintInput,
    actor: AuthenticatedUser
): Promise<CreateComplaintResult> => {
    const { category, description, coordinates, address, language = 'en', files } = input;

    if (!category || !description || !coordinates) {
        throw new ApiError(400, "Category, description and coordinates are required");
    }

    let parsedCoordinates: unknown = coordinates;
    try {
        if (typeof parsedCoordinates === "string") {
            parsedCoordinates = JSON.parse(parsedCoordinates);
        }
    } catch {
        throw new ApiError(400, "Coordinates must be a valid JSON array");
    }

    if (!Array.isArray(parsedCoordinates) || parsedCoordinates.length !== 2) {
        throw new ApiError(400, "Coordinates must be [longitude, latitude]");
    }

    const validCoords = parsedCoordinates as [number, number];

    let parsedAddress: Record<string, unknown> | null = null;
    if (address) {
        try {
            parsedAddress = typeof address === "string"
                ? (JSON.parse(address) as Record<string, unknown>)
                : (address as Record<string, unknown>);
        } catch (error) {
            console.error("Failed to parse address", error);
        }
    }

    const existingIssue = await Complaint.findOne({
        category,
        status: { $in: ['Submitted', 'Verified', 'Assigned', 'In Progress'] },
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: validCoords
                },
                $maxDistance: 50
            }
        }
    });

    if (existingIssue) {
        if (
            existingIssue.reportedBy === actor.anonymousId &&
            Date.now() - existingIssue.createdAt.getTime() < 5 * 60 * 1000
        ) {
            throw new ApiError(409, "You have already submitted this exact complaint recently.");
        }

        existingIssue.supportCount += 1;
        if (!existingIssue.upvotedBy.includes(actor.anonymousId)) {
            existingIssue.upvotedBy.push(actor.anonymousId);
        }
        await existingIssue.save();

        return {
            isDuplicate: true,
            complaint: existingIssue,
            newlyEarnedBadges: []
        };
    }

    if (!files || files.length === 0) {
        throw new ApiError(400, "At least one complaint image is required");
    }

    if (files.length > 5) {
        throw new ApiError(400, "Maximum of 5 images allowed");
    }

    const uploadedImages: string[] = [];
    for (const file of files) {
        const uploaded = await uploadOnCloudinary(file.buffer);
        if (uploaded) {
            uploadedImages.push(uploaded.secure_url);
        }
    }

    if (uploadedImages.length === 0) {
        throw new ApiError(500, "Failed to upload complaint images to Cloudinary");
    }

    let finalDescription = description;
    const originalDescriptionText = description;

    try {
        const geminiKey = apiKeyManager.getGeminiKey();
        if (!geminiKey) throw new Error("No Gemini API Key available.");
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Translate to professional English. If already English, reply "ENGLISH". Reply ONLY with translated text. Text: "${description}"`;

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();

        if (translatedText.toUpperCase() !== "ENGLISH" && translatedText.length > 5) {
            finalDescription = translatedText;
        }
    } catch (e) {
        console.error("Auto-translation failed, falling back to original text:", e);
    }

    const complaint = await Complaint.create({
        reportedBy: actor.anonymousId,
        category,
        location: {
            type: "Point",
            coordinates: validCoords,
        },
        description: finalDescription,
        originalDescription: originalDescriptionText,
        originalLanguage: language,
        imageUrls: uploadedImages,
        imageUrl: uploadedImages[0],
        ...(parsedAddress && { address: parsedAddress }),
    });

    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().emit('new_complaint', complaint);
        getIo().to('admin_room').emit('stats_update', { type: 'new_complaint' });

        await notificationService.createNotification({
            recipient: actor._id.toString(),
            title: 'Complaint Submitted',
            message: `Your complaint regarding ${complaint.category} has been submitted successfully.`,
            type: 'Complaint Submitted',
            priority: 'Low',
            complaint: complaint._id,
            actionUrl: `/complaints/${complaint._id}`
        });

        const authorities = await User.find({ role: { $in: ['Admin', 'Authority'] } });
        for (const auth of authorities) {
            await notificationService.createNotification({
                recipient: auth._id.toString(),
                title: 'New Issue Reported',
                message: `A new ${complaint.category} issue has been reported in the city.`,
                type: 'System Notification',
                priority: 'High',
                complaint: complaint._id,
                actionUrl: `/authority/dashboard`
            });
        }
    } catch (e) {
        console.error("Socket error on create complaint", e);
    }

    const newlyEarnedBadges: string[] = [];
    try {
        const user = await User.findById(actor._id);
        if (user) {
            user.points = (user.points || 0) + 10;

            if (!user.badges.includes("First Step")) {
                user.badges.push("First Step");
                newlyEarnedBadges.push("First Step");
            }

            if (user.points >= 50 && !user.badges.includes("Rookie Watcher")) {
                user.badges.push("Rookie Watcher");
                newlyEarnedBadges.push("Rookie Watcher");
            }
            if (user.points >= 100 && !user.badges.includes("Neighborhood Hero")) {
                user.badges.push("Neighborhood Hero");
                newlyEarnedBadges.push("Neighborhood Hero");
            }

            await user.save();

            if (newlyEarnedBadges.length > 0) {
                for (const badge of newlyEarnedBadges) {
                    await notificationService.createNotification({
                        recipient: user._id.toString(),
                        title: 'Badge Earned! 🏆',
                        message: `Congratulations! You've earned the "${badge}" badge for your civic contributions.`,
                        type: 'System Notification',
                        priority: 'Low',
                        actionUrl: `/profile`
                    });
                }
            }
        }
    } catch (e) {
        console.error("Failed to award gamification points for complaint creation", e);
    }

    return {
        isDuplicate: false,
        complaint,
        newlyEarnedBadges
    };
};

export const getMyComplaints = async (actor: AuthenticatedUser) => {
    const allUserIdentities = getUserIdentities(actor);

    return Complaint.find({
        reportedBy: { $in: allUserIdentities },
    })
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name authorityLevel department');
};

export const deleteComplaint = async (complaintId: string, actor: AuthenticatedUser): Promise<void> => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    const allUserIdentities = getUserIdentities(actor);
    if (!allUserIdentities.includes(complaint.reportedBy)) {
        throw new ApiError(403, "You are not authorized to delete this complaint");
    }

    if (complaint.status === "Resolved" || complaint.status === "Closed") {
        throw new ApiError(400, "Complaint cannot be deleted once it is Resolved or Closed");
    }

    await Complaint.findByIdAndDelete(complaintId);
};

export const getAllComplaints = async (
    queryParams: { lat?: string; lng?: string; radius?: string },
    actor: AuthenticatedUser
) => {
    const { lat, lng, radius } = queryParams;
    let query: Record<string, unknown> = {};

    if (!lat || !lng) {
        const allUserIdentities = getUserIdentities(actor);
        query = { reportedBy: { $in: allUserIdentities } };
    } else if (radius && radius !== 'All') {
        const radiusInMeters = parseInt(radius, 10) * 1000;
        const radiusInRadians = radiusInMeters / 6378100;

        query = {
            location: {
                $geoWithin: {
                    $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
                }
            }
        };
    }

    if (actor && actor.role === 'Authority') {
        const allowedCategories = getCategoriesForDepartment(actor.department);
        if (Object.keys(query).length === 0) {
            query.category = { $in: allowedCategories };
        } else {
            query = { $and: [query, { category: { $in: allowedCategories } }] };
        }
    }

    return Complaint.find(query)
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name authorityLevel department');
};

export const upvoteComplaint = async (complaintId: string) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    complaint.supportCount = (complaint.supportCount || 0) + 1;
    await complaint.save();

    return complaint;
};

export const editComplaint = async (
    complaintId: string,
    updates: { category?: ComplaintCategory; description?: string },
    actor: AuthenticatedUser
) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    const allUserIdentities = getUserIdentities(actor);
    if (!allUserIdentities.includes(complaint.reportedBy)) {
        throw new ApiError(403, "You are not authorized to edit this complaint");
    }

    if (complaint.status === "Resolved" || complaint.status === "Closed") {
        throw new ApiError(400, "Complaint cannot be edited once it is Resolved or Closed");
    }

    if (updates.category) complaint.category = updates.category;
    if (updates.description) complaint.description = updates.description;

    await complaint.save();
    return complaint;
};

export const submitResolutionFeedback = async (
    complaintId: string,
    action: string,
    comment: string | undefined,
    actor: AuthenticatedUser
) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, 'Complaint not found');
    }

    const allUserIdentities = getUserIdentities(actor);
    if (!allUserIdentities.includes(complaint.reportedBy)) {
        throw new ApiError(403, 'Only the reporter can provide feedback');
    }

    if (complaint.status !== 'Resolved') {
        throw new ApiError(400, 'Complaint is not in Resolved status');
    }

    if (action === 'Accept') {
        complaint.resolutionFeedback = {
            status: 'Accepted',
            comment,
            updatedAt: new Date()
        };
        complaint.status = 'Closed';
        complaint.officialReplies.push({
            authorityName: actor.name || 'Citizen',
            content: 'Resolution Accepted by Citizen.' + (comment ? ' Comment: ' + comment : '')
        });

        try {
            const user = await User.findById(actor._id);
            if (user) {
                user.points = (user.points || 0) + 50;
                if (user.points >= 100 && !user.badges.includes("Neighborhood Hero")) {
                    user.badges.push("Neighborhood Hero");
                }
                if (user.points >= 50 && !user.badges.includes("Rookie Watcher")) {
                    user.badges.push("Rookie Watcher");
                }
                await user.save();
            }
        } catch (e) {
            console.error("Failed to award gamification points", e);
        }
    } else if (action === 'Reject') {
        complaint.resolutionFeedback = {
            status: 'Rejected',
            comment,
            updatedAt: new Date()
        };
        complaint.status = 'In Progress';

        const currentLevel = complaint.escalationLevel;
        let nextLevel: 'Junior' | 'Senior' | 'HOD' = 'Senior';
        if (currentLevel === 'Senior' || currentLevel === 'HOD') {
            nextLevel = 'HOD';
        }

        complaint.escalationLevel = nextLevel;

        complaint.officialReplies.push({
            authorityName: actor.name || 'Citizen',
            content: 'Resolution REJECTED by Citizen. Task re-opened and escalated to ' + nextLevel + '.' + (comment ? ' Reason: ' + comment : '')
        });
    } else {
        throw new ApiError(400, 'Invalid action');
    }

    complaint.lastActivityAt = new Date();
    await complaint.save();

    if (complaint.assignedTo) {
        try {
            await notificationService.createNotification({
                recipient: complaint.assignedTo.toString(),
                sender: actor._id,
                title: `Resolution ${action === 'Accept' ? 'Accepted' : 'Rejected'}`,
                message: `The citizen has ${action.toLowerCase()}ed your resolution for the ${complaint.category} issue.`,
                type: 'System Notification',
                priority: 'High',
                complaint: complaint._id,
                actionUrl: `/authority/dashboard`
            });
        } catch (error) {
            console.error("Notification error on resolution feedback", error);
        }
    }

    return complaint;
};

export const analyzeImage = async (imageBase64?: string) => {
    if (!imageBase64) {
        throw new ApiError(400, "Image data is required for analysis");
    }

    try {
        const geminiKey = apiKeyManager.getGeminiKey();
        if (!geminiKey) throw new ApiError(500, "No Gemini API Key available.");

        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `Analyze image of a civic issue. Return JSON: {"category": "Road|Electricity|Garbage|Water|Drainage|Traffic|Illegal Dumping|Street Light|Construction|Animal|Others", "description": "Short professional English desc"}`;

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        return JSON.parse(responseText.replace(/```json/gi, '').replace(/```/g, '').trim()) as {
            category: ComplaintCategory;
            description: string;
        };
    } catch (error) {
        console.error("AI Analysis Error:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Failed to analyze image using AI");
    }
};
