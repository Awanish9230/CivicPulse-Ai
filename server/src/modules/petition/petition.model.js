import mongoose from 'mongoose';

const petitionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        default: null,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    status: {
        type: String,
        enum: ['Active', 'Rejected', 'Escalated'],
        default: 'Active',
    },
    targetSignatures: {
        type: Number,
        default: 1000,
    }
}, {
    timestamps: true,
});

// Indexing for faster queries on status and upvote count
petitionSchema.index({ status: 1 });
petitionSchema.index({ createdAt: -1 });

const Petition = mongoose.model('Petition', petitionSchema);
export default Petition;
