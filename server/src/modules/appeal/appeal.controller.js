import Appeal from './appeal.model.js';
import User from '../user/user.model.js';
import asyncHandler from '../../utils/asynchandler.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';

export const submitAppeal = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
        throw new ApiError(400, "Appeal reason is required.");
    }

    // Check if user already has a pending appeal
    const existingAppeal = await Appeal.findOne({ user: req.user._id, status: 'Pending' });
    if (existingAppeal) {
        throw new ApiError(400, "You already have a pending appeal.");
    }

    const appeal = await Appeal.create({
        user: req.user._id,
        reason: reason.trim()
    });

    return res.status(201).json(new ApiResponse(201, appeal, "Appeal submitted successfully."));
});

export const getAppeals = asyncHandler(async (req, res) => {
    const appeals = await Appeal.find().populate('user', 'anonymousId strikes role createdAt').sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, appeals, "Appeals fetched successfully."));
});

export const resolveAppeal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body; // status: 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
        throw new ApiError(400, "Invalid status.");
    }

    const appeal = await Appeal.findById(id);
    if (!appeal) {
        throw new ApiError(404, "Appeal not found.");
    }

    appeal.status = status;
    appeal.reviewedBy = req.user._id;
    appeal.resolutionNote = note || "";
    await appeal.save();

    if (status === 'Approved') {
        const user = await User.findById(appeal.user);
        if (user) {
            user.isBanned = false;
            user.banUntil = null;
            user.restrictedFeatures = [];
            user.strikes = 0; // Reset strikes on successful appeal
            await user.save({ validateBeforeSave: false });
        }
    }

    return res.status(200).json(new ApiResponse(200, appeal, `Appeal ${status.toLowerCase()} successfully.`));
});
