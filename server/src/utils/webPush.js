import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:test@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("VAPID keys are not set in environment variables. Web Push will not work.");
}

export const sendPushNotification = async (subscription, payload) => {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn("Cannot send push notification: VAPID keys are missing.");
        return;
    }
    
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
};

export default webpush;
