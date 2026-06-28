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