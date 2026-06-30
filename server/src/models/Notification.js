import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        type: mongoose.Schema.Types.ObjectId, // Can refer to Complaint if tasks are complaints, or specific task model
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

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
