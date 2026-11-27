import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderName: {
        type: String, 
        required: true,
    },
    channel: {
        type: String,
        enum: ['general', 'ask-authority', 'announcements'],
        required: true,
    },
    complaintId: {
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
            type: [Number], 
            required: false, 
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
    senderRole: {
        type: String,
        enum: ['Citizen', 'Authority', 'Admin'],
        default: 'Citizen'
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    isToxic: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

messageSchema.index({ location: '2dsphere' }, { sparse: true });
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
