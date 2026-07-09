import Notification from './notification.model.js';
import asynchandler from '../../utils/asynchandler.js';
import ApiResponse from '../../utils/ApiResponse.js';

const getRecipientIds = (user) => {
    const ids = [user._id.toString()];
    if (user.anonymousId) ids.push(user.anonymousId);
    if (user.pastAnonymousIds && user.pastAnonymousIds.length > 0) {
        ids.push(...user.pastAnonymousIds);
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
    await Notification.deleteMany({ recipient: { $in: getRecipientIds(req.user) } });
    return res.status(200).json(new ApiResponse(200, {}, 'All notifications deleted'));
});
