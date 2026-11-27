import mongoose from 'mongoose';
import Appeal, { AppealStatus } from './appeal.model.js';
import User from '../user/user.model.js';
import ApiError from '../../utils/ApiError.js';

export const submitAppeal = async (
    userId: mongoose.Types.ObjectId | string,
    reason?: string
) => {
    if (!reason || reason.trim() === '') {
        throw new ApiError(400, "Appeal reason is required.");
    }

    const existingAppeal = await Appeal.findOne({ user: userId, status: 'Pending' });
    if (existingAppeal) {
        throw new ApiError(400, "You already have a pending appeal.");
    }

    return Appeal.create({
        user: userId,
        reason: reason.trim()
    });
};

export const getAppeals = async () => {
    return Appeal.find()
        .populate('user', 'anonymousId strikes role createdAt')
        .sort({ createdAt: -1 });
};

export const resolveAppeal = async (
    appealId: string,
    reviewerId: mongoose.Types.ObjectId | string,
    status: AppealStatus,
    note?: string
) => {
    if (!['Approved', 'Rejected'].includes(status)) {
        throw new ApiError(400, "Invalid status.");
    }

    const appeal = await Appeal.findById(appealId);
    if (!appeal) {
        throw new ApiError(404, "Appeal not found.");
    }

    appeal.status = status;
    appeal.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
    appeal.resolutionNote = note || "";
    await appeal.save();

    if (status === 'Approved') {
        const user = await User.findById(appeal.user);
        if (user) {
            user.isBanned = false;
            user.banUntil = null;
            user.restrictedFeatures = [];
            user.strikes = 0;
            await user.save({ validateBeforeSave: false });
        }
    }

    return appeal;
};
