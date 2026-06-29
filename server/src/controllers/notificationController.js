import Notification from '../models/Notification.js';
import asynchandler from '../utils/asynchandler.js';
import ApiResponse from '../utils/ApiResponse.js';

export const getMyNotifications = asynchandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, notifications, 'Notifications fetched successfully')
    );
});

export const markAsRead = asynchandler(async (req, res) => {
    await Notification.updateMany(
        { user: req.user._id, unread: true },
        { $set: { unread: false } }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, 'Notifications marked as read')
    );
});
