import Complaint from "./complaint.model.js";
import User from "../user/user.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asynchandler.js";
import { getCategoriesForDepartment } from "../../utils/departmentMapping.js";
import uploadOnCloudinary, { deleteFromCloudinary } from "../../utils/cloudinary.js";
import notificationService from "../notification/notification.service.js";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKeyManager } from '../../utils/apiKeyManager.js';

export const resolveComplaint = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;

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

    const {
        category,
        description,
        coordinates,
        address, 
        language = 'en' 
    } = req.body;

    if (!category || !description || !coordinates) {
        throw new ApiError(
            400,
            "Category, description and coordinates are required"
        );
    }

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

    let parsedAddress = null;
    if (address) {
        try {
            parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
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
                    coordinates: parsedCoordinates
                },
                $maxDistance: 50 
            }
        }
    });

    if (existingIssue) {
        if (existingIssue.reportedBy === req.user.anonymousId && (Date.now() - existingIssue.createdAt.getTime() < 5 * 60 * 1000)) {
            throw new ApiError(409, "You have already submitted this exact complaint recently.");
        }

        existingIssue.supportCount += 1;
        if (!existingIssue.upvotedBy.includes(req.user.anonymousId)) {
            existingIssue.upvotedBy.push(req.user.anonymousId);
        }
        await existingIssue.save();

        return res.status(200).json(
            new ApiResponse(200, existingIssue, "Similar issue already reported in this exact location. We've added your report to boost its priority!")
        );
    }

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

    const uploadedImages = [];
    for (const file of imageFiles) {
        const uploaded = await uploadOnCloudinary(file.buffer);
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

    let finalDescription = description;
    let originalDescriptionText = description;
    
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
        imageUrl: uploadedImages[0],
        ...(parsedAddress && { address: parsedAddress }),
    });

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

    let newlyEarnedBadges = [];
    try {
        const user = await User.findById(req.user._id);
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

            if (newlyEarnedBadges.length > 0) {
                await user.save();
                for (const badge of newlyEarnedBadges) {
                    await notificationService.createNotification({
                        recipient: user._id,
                        title: 'Badge Earned! 🏆',
                        message: `Congratulations! You've earned the "${badge}" badge for your civic contributions.`,
                        type: 'System Notification',
                        priority: 'Low',
                        actionUrl: `/profile`
                    });
                }
            } else {
                await user.save();
            }
        }
    } catch (e) {
        console.error("Failed to award gamification points for complaint creation", e);
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            { complaint, newlyEarnedBadges },
            "Complaint submitted successfully"
        )
    );

});

export const getMyComplaints = asyncHandler(async (req, res) => {

    const allUserIdentities = [req.user.anonymousId, ...(req.user.pastAnonymousIds || [])];

    const complaints = await Complaint.find({
        reportedBy: { $in: allUserIdentities },
    }).sort({
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


export const deleteComplaint = asyncHandler(async (req, res) => {

    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    const allUserIdentities = [req.user.anonymousId, ...(req.user.pastAnonymousIds || [])];
    if (!allUserIdentities.includes(complaint.reportedBy)) {
        throw new ApiError(
            403,
            "You are not authorized to delete this complaint"
        );
    }

    if (complaint.status === "Resolved" || complaint.status === "Closed") {
        throw new ApiError(
            400,
            "Complaint cannot be deleted once it is Resolved or Closed"
        );
    }

    await Complaint.findByIdAndDelete(complaintId);


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
    
    if (!lat || !lng) {
        const allUserIdentities = [req.user.anonymousId, ...(req.user.pastAnonymousIds || [])];
        query = { reportedBy: { $in: allUserIdentities } };
    } 
    else if (radius && radius !== 'All') {
        const radiusInMeters = parseInt(radius) * 1000;
        const radiusInRadians = radiusInMeters / 6378100;
        
        query = {
            location: {
                $geoWithin: {
                    $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
                }
            }
        };
    }

    if (req.user && req.user.role === 'Authority') {
        const allowedCategories = getCategoriesForDepartment(req.user.department);
        if (Object.keys(query).length === 0) {
            query.category = { $in: allowedCategories };
        } else {
            query = { $and: [query, { category: { $in: allowedCategories } }] };
        }
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
        complaint.status = 'Closed'; 
        complaint.officialReplies.push({
            authorityName: req.user.name || 'Citizen',
            content: 'Resolution Accepted by Citizen.' + (comment ? ' Comment: ' + comment : '')
        });
        
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
        complaint.status = 'In Progress'; 

        const currentLevel = complaint.escalationLevel;
        let nextLevel = 'Senior'; 
        if (currentLevel === 'Senior') nextLevel = 'HOD';
        else if (currentLevel === 'HOD') nextLevel = 'HOD'; 

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
        const geminiKey = apiKeyManager.getGeminiKey();
        if (!geminiKey) throw new ApiError(500, "No Gemini API Key available.");
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Analyze image of a civic issue. Return JSON: {"category": "Road|Electricity|Garbage|Water|Drainage|Traffic|Illegal Dumping|Street Light|Construction|Animal|Others", "description": "Short professional English desc"}`;

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ], {
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
        const parsed = JSON.parse(responseText.replace(/```json/gi, '').replace(/```/g, '').trim());
        
        return res.status(200).json(new ApiResponse(200, parsed, "Image analyzed successfully"));
    } catch (error) {
        console.error("AI Analysis Error:", error);
        throw new ApiError(500, "Failed to analyze image using AI");
    }
});

