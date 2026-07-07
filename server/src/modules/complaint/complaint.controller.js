import Complaint from "./complaint.model.js";
import User from "../user/user.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asynchandler.js";
import uploadOnCloudinary, { deleteFromCloudinary } from "../../utils/cloudinary.js";
import notificationService from "../notification/notification.service.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const resolveComplaint = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;

    // Check authority role (assuming `req.user.role === 'Authority'`)
    if (req.user.role !== 'Authority') {
        throw new ApiError(403, "Only authorities can resolve complaints");
    }

    const complaint = await Complaint.findById(complaintId);
    
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    if (complaint.status === "Resolved") {
        throw new ApiError(400, "Complaint is already resolved");
    }

    // Delete excess images from Cloudinary to free up storage limits
    if (complaint.imageUrls && complaint.imageUrls.length > 1) {
        // Keep the first image, destroy the rest
        for (let i = 1; i < complaint.imageUrls.length; i++) {
            await deleteFromCloudinary(complaint.imageUrls[i]);
        }
        
        // Update database array to only contain the first image
        complaint.imageUrls = [complaint.imageUrls[0]];
    }

    complaint.status = "Resolved";
    await complaint.save();

    // Broadcast to users that it's resolved
    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().emit('complaint_status_update', complaint);
        getIo().to('admin_room').emit('stats_update', { type: 'complaint_resolved' });
        
        await notificationService.createNotification({
            recipient: complaint.reportedBy,
            sender: req.user._id,
            title: 'Complaint Resolved',
            message: `Your complaint regarding ${complaint.category} has been marked as resolved by ${req.user.name || "a City Official"}.`,
            type: 'Complaint Resolved',
            priority: 'Medium',
            complaint: complaint._id,
            actionUrl: `/complaints/${complaint._id}`
        });
    } catch (e) {
        console.error("Socket error on resolve complaint", e);
    }

    return res.status(200).json(
        new ApiResponse(200, complaint, "Complaint resolved and media optimized.")
    );
});

export const addOfficialReply = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const { content } = req.body;
    
    if (!content) {
        throw new ApiError(400, "Reply content is required");
    }
    
    // Use the current user's anonymous ID or default to "City Official"
    const authorityName = req.user?.anonymousId || "City Official";
    
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
            sender: req.user._id,
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
    
    res.status(200).json(new ApiResponse(200, complaint, "Official reply added"));
});

export const createComplaint = asyncHandler(async (req, res) => {

    // 1. Get complaint details
    const {
        category,
        description,
        coordinates,
        address, // stringified JSON
        language = 'en' // Pass language from frontend if possible
    } = req.body;

    // 2. Validate required fields
    if (!category || !description || !coordinates) {
        throw new ApiError(
            400,
            "Category, description and coordinates are required"
        );
    }

    // 3. Parse and validate coordinates
    let parsedCoordinates = coordinates;
    try {
        if (typeof parsedCoordinates === "string") {
            parsedCoordinates = JSON.parse(parsedCoordinates);
        }
    } catch (error) {
        throw new ApiError(400, "Coordinates must be a valid JSON array");
    }

    if (!Array.isArray(parsedCoordinates) || parsedCoordinates.length !== 2) {
        throw new ApiError(400, "Coordinates must be [longitude, latitude]");
    }

    // Parse address if provided
    let parsedAddress = null;
    if (address) {
        try {
            parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
        } catch (error) {
            console.error("Failed to parse address", error);
        }
    }

    // 4. Validate images
    const imageFiles = req.files;

    if (!imageFiles || imageFiles.length === 0) {
        throw new ApiError(
            400,
            "At least one complaint image is required"
        );
    }

    if (imageFiles.length > 5) {
        throw new ApiError(400, "Maximum of 5 images allowed");
    }

    // 5. Upload images to Cloudinary
    const uploadedImages = [];
    for (const file of imageFiles) {
        const uploaded = await uploadOnCloudinary(file.path);
        if (uploaded) {
            uploadedImages.push(uploaded.secure_url);
        }
    }

    if (uploadedImages.length === 0) {
        throw new ApiError(
            500,
            "Failed to upload complaint images to Cloudinary"
        );
    }

    // 6. Translation handling (Auto-Translation if not English)
    let finalDescription = description;
    let originalDescriptionText = description;
    
    // Let's use Gemini to quickly check and translate if needed
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a civic translation AI. The user has submitted a complaint description: "${description}".
If this description is already in English, reply with exactly the word "ENGLISH".
If it is in another language, translate it fully and accurately to professional English. Reply ONLY with the translated English text, nothing else.`;
        
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();
        
        if (translatedText.toUpperCase() !== "ENGLISH" && translatedText.length > 5) {
            finalDescription = translatedText;
        }
    } catch (e) {
        console.error("Auto-translation failed, falling back to original text:", e);
    }

    // 7. Create complaint
    const complaint = await Complaint.create({
        reportedBy: req.user.anonymousId,
        category,
        location: {
            type: "Point",
            coordinates: parsedCoordinates,
        },
        description: finalDescription,
        originalDescription: originalDescriptionText,
        originalLanguage: language,
        imageUrls: uploadedImages,
        // For backwards compatibility, set the first image as imageUrl as well
        imageUrl: uploadedImages[0],
        ...(parsedAddress && { address: parsedAddress }),
    });

    // Fetch complaint with populated data if necessary, or just emit it
    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().emit('new_complaint', complaint);
        getIo().to('admin_room').emit('stats_update', { type: 'new_complaint' });
        
        await notificationService.createNotification({
            recipient: req.user._id,
            title: 'Complaint Submitted',
            message: `Your complaint regarding ${complaint.category} has been submitted successfully.`,
            type: 'Complaint Submitted',
            priority: 'Low',
            complaint: complaint._id,
            actionUrl: `/complaints/${complaint._id}`
        });

        // Notify Admins and Authorities
        const authorities = await User.find({ role: { $in: ['Admin', 'Authority'] } });
        for (const auth of authorities) {
            await notificationService.createNotification({
                recipient: auth._id,
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

    // 7. Send response
    return res.status(201).json(
        new ApiResponse(
            201,
            complaint,
            "Complaint submitted successfully"
        )
    );

});

export const getMyComplaints = asyncHandler(async (req, res) => {

    // Fetch all complaints created by the logged-in user (including past rotated identities)
    const allUserIdentities = [req.user.anonymousId, ...(req.user.pastAnonymousIds || [])];

    const complaints = await Complaint.find({
        reportedBy: { $in: allUserIdentities },
    }).sort({
        createdAt: -1,                  //sort them in newset to oldest
    }).populate('assignedTo', 'name authorityLevel department');

    return res.status(200).json(
        new ApiResponse(
            200,
            complaints,
            "Complaints fetched successfully"
        )
    );

});


export const deleteComplaint = asyncHandler(async (req, res) => {

    // 1. Get complaint id
    const { complaintId } = req.params;

    // 2. Find complaint
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    // 3. Check ownership
    const allUserIdentities = [req.user.anonymousId, ...(req.user.pastAnonymousIds || [])];
    if (!allUserIdentities.includes(complaint.reportedBy)) {
        throw new ApiError(
            403,
            "You are not authorized to delete this complaint"
        );
    }

    // 4. Allow deletion only before resolution
    if (complaint.status === "Resolved" || complaint.status === "Closed") {
        throw new ApiError(
            400,
            "Complaint cannot be deleted once it is Resolved or Closed"
        );
    }

    // 5. Delete complaint
    await Complaint.findByIdAndDelete(complaintId);

    // Later:
    // Delete image from Cloudinary using publicId

    // 6. Response
    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Complaint deleted successfully"
        )
    );

});

export const getAllComplaints = asyncHandler(async (req, res) => {
    const { lat, lng, radius } = req.query;
    
    let query = {};
    
    // If no location is provided, restrict to ONLY the user's own complaints
    if (!lat || !lng) {
        const allUserIdentities = [req.user.anonymousId, ...(req.user.pastAnonymousIds || [])];
        query = { reportedBy: { $in: allUserIdentities } };
    } 
    // If location is provided and a specific radius (not 'All') is selected
    else if (radius && radius !== 'All') {
        const radiusInMeters = parseInt(radius) * 1000;
        // Earth radius in radians: distance in meters / 6378100
        const radiusInRadians = radiusInMeters / 6378100;
        
        query = {
            location: {
                $geoWithin: {
                    $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
                }
            }
        };
    }

    const complaints = await Complaint.find(query).sort({
        createdAt: -1,
    }).populate('assignedTo', 'name authorityLevel department');

    return res.status(200).json(
        new ApiResponse(
            200,
            complaints,
            "Complaints fetched successfully"
        )
    );
});

export const upvoteComplaint = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    // Increment support count
    complaint.supportCount = (complaint.supportCount || 0) + 1;
    await complaint.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            complaint,
            "Complaint upvoted successfully"
        )
    );
});

export const editComplaint = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const { category, description } = req.body;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    const allUserIdentities = [req.user.anonymousId, ...(req.user.pastAnonymousIds || [])];
    if (!allUserIdentities.includes(complaint.reportedBy)) {
        throw new ApiError(403, "You are not authorized to edit this complaint");
    }

    if (complaint.status === "Resolved" || complaint.status === "Closed") {
        throw new ApiError(400, "Complaint cannot be edited once it is Resolved or Closed");
    }

    if (category) complaint.category = category;
    if (description) complaint.description = description;

    await complaint.save();

    return res.status(200).json(
        new ApiResponse(200, complaint, "Complaint updated successfully")
    );
});
export const submitResolutionFeedback = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const { action, comment } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, 'Complaint not found');
    }

    const allUserIdentities = [req.user.anonymousId, ...(req.user.pastAnonymousIds || [])];
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
            updatedAt: Date.now()
        };
        complaint.status = 'Closed'; // Permanently closed
        complaint.officialReplies.push({
            authorityName: req.user.name || 'Citizen',
            content: 'Resolution Accepted by Citizen.' + (comment ? ' Comment: ' + comment : '')
        });
        
        // Gamification: Award points and badges
        try {
            const user = await User.findById(req.user._id);
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
            updatedAt: Date.now()
        };
        complaint.status = 'In Progress'; // Reopen

        // Escalate
        const currentLevel = complaint.escalationLevel;
        let nextLevel = 'Senior'; // Default to Senior if Junior
        if (currentLevel === 'Senior') nextLevel = 'HOD';
        else if (currentLevel === 'HOD') nextLevel = 'HOD'; // Max level

        complaint.escalationLevel = nextLevel;

        complaint.officialReplies.push({
            authorityName: req.user.name || 'Citizen',
            content: 'Resolution REJECTED by Citizen. Task re-opened and escalated to ' + nextLevel + '.' + (comment ? ' Reason: ' + comment : '')
        });
    } else {
        throw new ApiError(400, 'Invalid action');
    }

    complaint.lastActivityAt = Date.now();
    await complaint.save();

    // Notify assigned authority if exists
    if (complaint.assignedTo) {
        try {
            await notificationService.createNotification({
                recipient: complaint.assignedTo,
                sender: req.user._id,
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

    return res.status(200).json(
        new ApiResponse(200, complaint, 'Feedback submitted successfully')
    );
});

export const analyzeImage = asyncHandler(async (req, res) => {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
        throw new ApiError(400, "Image data is required for analysis");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a civic issue analyzer. I will provide a photo of a local civic issue (like a pothole, garbage, broken light).
Your task is to identify the issue and return a JSON object with two fields:
1. "category": Must be exactly one of: 'Road', 'Electricity', 'Garbage', 'Water', 'Drainage', 'Traffic', 'Illegal Dumping', 'Street Light', 'Construction', 'Animal', 'Others'. Choose the most fitting.
2. "description": A concise, professional, one-sentence description of the issue shown in the image, in English.

Return ONLY the raw JSON object, no markdown blocks.`;

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        const parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
        
        return res.status(200).json(new ApiResponse(200, parsed, "Image analyzed successfully"));
    } catch (error) {
        console.error("AI Analysis Error:", error);
        throw new ApiError(500, "Failed to analyze image using AI");
    }
});

