import mongoose, { HydratedDocument } from 'mongoose';

export type NotificationType =
    | 'Complaint Submitted'
    | 'Complaint Verified'
    | 'Complaint Assigned'
    | 'Complaint Rejected'
    | 'Complaint Resolved'
    | 'Complaint Escalated'
    | 'Task Assigned'
    | 'Task Completed'
    | 'Authority Commented'
    | 'Admin Announcement'
    | 'Community Chat Mention'
    | 'Community Chat Reply'
    | 'Like Received'
    | 'Complaint Upvoted'
    | 'Reminder'
    | 'System Notification'
    | 'Security Alert'
    | 'Account Update'
    | 'Profile Approved'
    | 'Profile Rejected'
    | 'Password Changed'
    | 'Login from New Device';

export type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface INotification {
    recipient: string;
    sender?: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    complaint?: mongoose.Types.ObjectId;
    task?: mongoose.Types.ObjectId;
    chat?: mongoose.Types.ObjectId;
    isRead: boolean;
    actionUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<INotification>;

const notificationSchema = new mongoose.Schema<INotification>({
    recipient: {
        type: String,
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: [
            'Complaint Submitted', 'Complaint Verified', 'Complaint Assigned', 'Complaint Rejected',
            'Complaint Resolved', 'Complaint Escalated', 'Task Assigned', 'Task Completed',
            'Authority Commented', 'Admin Announcement', 'Community Chat Mention', 'Community Chat Reply',
            'Like Received', 'Complaint Upvoted', 'Reminder', 'System Notification', 'Security Alert',
            'Account Update', 'Profile Approved', 'Profile Rejected', 'Password Changed', 'Login from New Device'
        ],
        index: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Low'
    },
    complaint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    actionUrl: {
        type: String
    }
}, {
    timestamps: true,
});

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
