import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderName: {
        type: String, // Capture the display name at time of sending
        required: true,
    },
    channel: {
        type: String,
        enum: ['general', 'ask-authority'],
        required: true,
    },
    complaintId: {
        // Null if it's general community chat, populated if it's tied to a specific complaint discussion
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        default: null,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: false, // Make false since global chat might not have exact coordinates
        }
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Text', 'Image', 'Voice'],
        default: 'Text'
    },
    isToxic: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

messageSchema.index({ location: '2dsphere' }, { sparse: true });
// Automatically delete messages after 90 days
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
