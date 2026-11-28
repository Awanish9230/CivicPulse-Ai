import mongoose from 'mongoose';
import type { PushSubscription } from 'web-push';
import Notification, { NotificationPriority, NotificationType } from './notification.model.js';
import { getIo } from '../../config/socket.js';
import logger from '../../utils/logger.js';
import User from '../user/user.model.js';
import { sendPushNotification } from '../../utils/webPush.js';
import ApiError from '../../utils/ApiError.js';
import type { AuthenticatedUser } from '../../types/express.js';

export interface CreateNotificationInput {
    recipient: string;
    sender?: mongoose.Types.ObjectId | string;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    complaint?: mongoose.Types.ObjectId;
    task?: mongoose.Types.ObjectId;
    chat?: mongoose.Types.ObjectId;
    actionUrl?: string;
}

export interface NotificationQueryFilters {
    page: number;
    limit: number;
    type?: string;
    unread?: string;
    timeframe?: string;
}

export const getRecipientIds = (user: AuthenticatedUser): string[] => {
    const ids = [user._id.toString()];
    if (user.anonymousId) ids.push(user.anonymousId);
    if (user.pastAnonymousIds && user.pastAnonymousIds.length > 0) {
        ids.push(...user.pastAnonymousIds);
    }
    return ids;
};

class NotificationService {
    async createNotification(data: CreateNotificationInput) {
        try {
            const notification = await Notification.create(data);

            try {
                const io = getIo();
                io.to(data.recipient.toString()).emit('notification', notification);
            } catch (socketError) {
                logger.error('Socket.io error emitting notification:', socketError);
            }

            try {
                const user = await User.findById(data.recipient);
                if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                    const payload = {
                        title: data.title,
                        body: data.message,
                        url: data.actionUrl || '/'
                    };

                    const sendPromises = user.pushSubscriptions.map(async (sub) => {
                        try {
                            await sendPushNotification(sub, payload);
                            return null;
                        } catch (error) {
                            const err = error as { statusCode?: number };
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                return sub.endpoint;
                            }
                            throw error;
                        }
                    });

                    const results = await Promise.allSettled(sendPromises);

                    const subsToRemove = results
                        .filter((res): res is PromiseFulfilledResult<string> =>
                            res.status === 'fulfilled' && res.value !== null
                        )
                        .map((res) => res.value);

                    if (subsToRemove.length > 0) {
                        user.pushSubscriptions = user.pushSubscriptions.filter(
                            (sub) => !subsToRemove.includes(sub.endpoint)
                        );
                        await user.save();
                        logger.info(`Removed ${subsToRemove.length} expired push subscriptions for user ${user._id}`);
                    }
                }
            } catch (pushError) {
                logger.error('Web Push error:', pushError);
            }

            return notification;
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    async getMyNotifications(user: AuthenticatedUser, filters: NotificationQueryFilters) {
        const { page, limit, type, unread, timeframe } = filters;
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {
            recipient: { $in: getRecipientIds(user) }
        };

        if (type) filter.type = type;
        if (unread === 'true') filter.isRead = false;

        if (timeframe) {
            const now = new Date();
            if (timeframe === 'today') {
                filter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
            } else if (timeframe === 'week') {
                filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
            }
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'name avatar role');

        const total = await Notification.countDocuments(filter);

        return {
            notifications,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNotifications: total
        };
    }

    async getUnreadCount(user: AuthenticatedUser): Promise<number> {
        return Notification.countDocuments({
            recipient: { $in: getRecipientIds(user) },
            isRead: false
        });
    }

    async markAsRead(id: string, user: AuthenticatedUser) {
        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: { $in: getRecipientIds(user) } },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            throw new ApiError(404, 'Notification not found');
        }
        return notification;
    }

    async markAllAsRead(user: AuthenticatedUser): Promise<void> {
        await Notification.updateMany(
            { recipient: { $in: getRecipientIds(user) }, isRead: false },
            { $set: { isRead: true } }
        );
    }

    async deleteNotification(id: string, user: AuthenticatedUser): Promise<void> {
        await Notification.findOneAndDelete({
            _id: id,
            recipient: { $in: getRecipientIds(user) }
        });
    }

    async deleteAllNotifications(user: AuthenticatedUser): Promise<void> {
        const recipients = getRecipientIds(user);
        await Notification.deleteMany({ recipient: { $in: recipients } });
    }

    async subscribeToPush(user: AuthenticatedUser, subscription?: PushSubscription): Promise<void> {
        if (!subscription) {
            throw new ApiError(400, "Subscription object is required");
        }

        const exists = user.pushSubscriptions.some((sub) => sub.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }
    }

    async unsubscribeFromPush(user: AuthenticatedUser, endpoint?: string): Promise<void> {
        if (!endpoint) {
            throw new ApiError(400, "Endpoint is required");
        }

        user.pushSubscriptions = user.pushSubscriptions.filter((sub) => sub.endpoint !== endpoint);
        await user.save();
    }
}

export default new NotificationService();
