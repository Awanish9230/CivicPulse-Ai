import mongoose, { HydratedDocument } from 'mongoose';

export type PetitionStatus = 'Active' | 'Rejected' | 'Escalated';

export interface IPetition {
    title: string;
    description: string;
    category: string;
    imageUrl: string | null;
    creator: mongoose.Types.ObjectId;
    upvotes: mongoose.Types.ObjectId[];
    status: PetitionStatus;
    targetSignatures: number;
    createdAt: Date;
    updatedAt: Date;
}

export type PetitionDocument = HydratedDocument<IPetition>;

const petitionSchema = new mongoose.Schema<IPetition>({
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

petitionSchema.index({ status: 1 });
petitionSchema.index({ createdAt: -1 });

const Petition = mongoose.model<IPetition>('Petition', petitionSchema);
export default Petition;
