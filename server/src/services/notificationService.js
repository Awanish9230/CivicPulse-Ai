import Notification from '../models/Notification.js';
import { getIo } from '../config/socket.js';
import logger from '../utils/logger.js';

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

            return notification;
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }
}

export default new NotificationService();
