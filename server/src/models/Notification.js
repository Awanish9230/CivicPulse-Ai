import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    icon: {
        type: String, // lucide-react icon name as a string (e.g., 'CheckCircle2', 'FileWarning')
        default: 'Bell',
    },
    color: {
        type: String, // text color class (e.g., 'text-secondary')
        default: 'text-primary',
    },
    bg: {
        type: String, // background color class (e.g., 'bg-secondary/10')
        default: 'bg-primary/10',
    },
    unread: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
