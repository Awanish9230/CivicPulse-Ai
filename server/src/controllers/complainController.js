import Complaint from "../models/Complaint.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import uploadOnCloudinary, { deleteFromCloudinary } from "../utils/cloudinary.js";
import notificationService from "../services/notificationService.js";

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
        const { getIo } = await import('../config/socket.js');
        getIo().emit('complaint_status_update', complaint);
        
        await notificationService.createNotification({
            recipient: complaint.reportedBy,
            sender: req.user._id,
            title: 'Complaint Resolved',
            message: `Your complaint regarding ${complaint.category} has been marked as resolved.`,
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
        address // stringified JSON
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

    // 6. Create complaint
    const complaint = await Complaint.create({
        reportedBy: req.user._id,
        category,
        location: {
            type: "Point",
            coordinates: parsedCoordinates,
        },
        description,
        imageUrls: uploadedImages,
        // For backwards compatibility, set the first image as imageUrl as well
        imageUrl: uploadedImages[0],
        ...(parsedAddress && { address: parsedAddress }),
    });

    // Fetch complaint with populated data if necessary, or just emit it
    try {
        const { getIo } = await import('../config/socket.js');
        getIo().emit('new_complaint', complaint);
        
        await notificationService.createNotification({
            recipient: req.user._id,
            title: 'Complaint Submitted',
            message: `Your complaint regarding ${complaint.category} has been submitted successfully.`,
            type: 'Complaint Submitted',
            priority: 'Low',
            complaint: complaint._id,
            actionUrl: `/complaints/${complaint._id}`
        });
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

    // Fetch all complaints created by the logged-in user
    const complaints = await Complaint.find({
        reportedBy: req.user._id,
    }).sort({
        createdAt: -1,                  //sort them in newset to oldest
    });

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
    if (
        complaint.reportedBy.toString() !==
        req.user._id.toString()
    ) {
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
    // Fetch all complaints
    const complaints = await Complaint.find().sort({
        createdAt: -1,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            complaints,
            "All complaints fetched successfully"
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

    if (complaint.reportedBy.toString() !== req.user._id.toString()) {
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