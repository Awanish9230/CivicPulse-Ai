import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
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

messageSchema.index({ location: '2dsphere' });

const Message = mongoose.model('Message', messageSchema);
export default Message;
