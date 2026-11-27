import Notification from './notification.model.js';
import { getIo } from '../../config/socket.js';
import logger from '../../utils/logger.js';
import User from '../user/user.model.js';
import { sendPushNotification } from '../../utils/webPush.js';

class NotificationService {
    async createNotification(data) {
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
                            if (error.statusCode === 410 || error.statusCode === 404) {
                                return sub.endpoint;
                            }
                            throw error; 
                        }
                    });
                    
                    const results = await Promise.allSettled(sendPromises);
                    
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
