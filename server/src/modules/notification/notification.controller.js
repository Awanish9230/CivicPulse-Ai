import Notification from './notification.model.js';
import asynchandler from '../../utils/asynchandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { getDecryptedAnonymousId, getDecryptedPastAnonymousIds } from '../user/user.model.js';

const getRecipientIds = (user) => {
    const ids = [user._id.toString()];
    if (user.role === 'Citizen') {
        const plainAnonId = getDecryptedAnonymousId(user);
        if (plainAnonId) ids.push(plainAnonId);
        const plainPastIds = getDecryptedPastAnonymousIds(user);
        if (plainPastIds && plainPastIds.length > 0) {
            ids.push(...plainPastIds);
        }
    }
    return ids;
};

export const getMyNotifications = asynchandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { recipient: { $in: getRecipientIds(req.user) } };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.unread === 'true') filter.isRead = false;
    
    // Date grouping filters (Today, This Week, etc.)
    if (req.query.timeframe) {
        const now = new Date();
        if (req.query.timeframe === 'today') {
            filter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        } else if (req.query.timeframe === 'week') {
            filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        }
    }

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name avatar role');

    const total = await Notification.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            notifications,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNotifications: total
        }, 'Notifications fetched successfully')
    );
});

export const getUnreadCount = asynchandler(async (req, res) => {
    const count = await Notification.countDocuments({ recipient: { $in: getRecipientIds(req.user) }, isRead: false });
    return res.status(200).json(new ApiResponse(200, { count }, 'Unread count fetched'));
});

export const markAsRead = asynchandler(async (req, res) => {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipient: { $in: getRecipientIds(req.user) } },
        { isRead: true },
        { new: true }
    );
    if (!notification) throw new Error('Notification not found');
    return res.status(200).json(new ApiResponse(200, notification, 'Marked as read'));
});

export const markAllAsRead = asynchandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: { $in: getRecipientIds(req.user) }, isRead: false },
        { $set: { isRead: true } }
    );
    return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

export const deleteNotification = asynchandler(async (req, res) => {
    const { id } = req.params;
    await Notification.findOneAndDelete({ _id: id, recipient: { $in: getRecipientIds(req.user) } });
    return res.status(200).json(new ApiResponse(200, {}, 'Notification deleted'));
});

export const deleteAllNotifications = asynchandler(async (req, res) => {
    const recipients = getRecipientIds(req.user);
    await Notification.deleteMany({ recipient: { $in: recipients } });

    res.status(200).json(new ApiResponse(200, null, "All notifications deleted successfully"));
});

export const subscribeToPush = asynchandler(async (req, res) => {
    const { subscription } = req.body;
    if (!subscription) {
        return res.status(400).json(new ApiResponse(400, null, "Subscription object is required"));
    }

    const user = req.user;
    
    // Check if subscription already exists
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
        user.pushSubscriptions.push(subscription);
        await user.save();
    }

    res.status(200).json(new ApiResponse(200, null, "Subscribed to push notifications"));
});

export const unsubscribeFromPush = asynchandler(async (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json(new ApiResponse(400, null, "Endpoint is required"));
    }

    const user = req.user;
    user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
    await user.save();

    res.status(200).json(new ApiResponse(200, null, "Unsubscribed from push notifications"));
});
