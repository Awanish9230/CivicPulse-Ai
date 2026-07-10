import Notification from './notification.model.js';
import { getIo } from '../../config/socket.js';
import logger from '../../utils/logger.js';
import User from '../user/user.model.js';
import { sendPushNotification } from '../../utils/webPush.js';

class NotificationService {
    /**
     * Create a new notification and emit it in real-time
     * @param {Object} data 
     * @param {ObjectId} data.recipient - User ID of the recipient
     * @param {ObjectId} [data.sender] - User ID of the sender/actor
     * @param {String} data.title - Notification title
     * @param {String} data.message - Notification message
     * @param {String} data.type - Notification type enum
     * @param {String} [data.priority='Low'] - Priority enum
     * @param {String} [data.actionUrl] - URL to navigate when clicked
     * @param {ObjectId} [data.complaint] - Optional related complaint
     * @param {ObjectId} [data.task] - Optional related task
     * @param {ObjectId} [data.chat] - Optional related chat message
     */
    async createNotification(data) {
        try {
            const notification = await Notification.create(data);

            try {
                const io = getIo();
                // Emit to the recipient's personal room
                io.to(data.recipient.toString()).emit('notification', notification);
            } catch (socketError) {
                logger.error('Socket.io error emitting notification:', socketError);
            }

            // Send Web Push Notification
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
                            if (error.statusCode === 410 || error.statusCode === 404) {
                                return sub.endpoint;
                            }
                            throw error; // Or swallow if you don't want it to fail Promise.allSettled completely for this sub, but web-push throws errors that we should log
                        }
                    });
                    
                    const results = await Promise.allSettled(sendPromises);
                    
                    // Collect endpoints to remove
                    const subsToRemove = results
                        .filter(res => res.status === 'fulfilled' && res.value !== null)
                        .map(res => res.value);
                        
                    if (subsToRemove.length > 0) {
                        user.pushSubscriptions = user.pushSubscriptions.filter(sub => !subsToRemove.includes(sub.endpoint));
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
}

export default new NotificationService();
