import Complaint from "../models/Complaint.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const createComplaint = asyncHandler(async (req, res) => {

    // 1. Get complaint details
    const {
        category,
        description,
        coordinates,
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

        throw new ApiError(
            400,
            "Coordinates must be a valid JSON array"
        );

    }

    if (
        !Array.isArray(parsedCoordinates) ||
        parsedCoordinates.length !== 2
    ) {
        throw new ApiError(
            400,
            "Coordinates must be [longitude, latitude]"
        );
    }

    // 4. Validate image
    const imageLocalPath = req.file?.path;

    if (!imageLocalPath) {
        throw new ApiError(
            400,
            "Complaint image is required"
        );
    }

    // 5. Upload image to Cloudinary
    const uploadedImage = await uploadOnCloudinary(imageLocalPath);

    if (!uploadedImage) {
        throw new ApiError(
            500,
            "Failed to upload complaint image on Cloudinary"
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

        imageUrl: uploadedImage.secure_url,

    });

    // Fetch complaint with populated data if necessary, or just emit it
    try {
        const { getIO } = await import('../config/socket.js');
        getIO().emit('new_complaint', complaint);
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

    // 4. Allow deletion only before processing starts
    if (complaint.status !== "Submitted") {
        throw new ApiError(
            400,
            "Complaint can only be deleted while it is in Submitted status"
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