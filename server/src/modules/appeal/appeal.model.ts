import mongoose, { HydratedDocument } from 'mongoose';

export type AppealStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IAppeal {
    user: mongoose.Types.ObjectId;
    reason: string;
    status: AppealStatus;
    reviewedBy: mongoose.Types.ObjectId | null;
    resolutionNote: string;
    createdAt: Date;
    updatedAt: Date;
}

export type AppealDocument = HydratedDocument<IAppeal>;

const appealSchema = new mongoose.Schema<IAppeal>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolutionNote: {
        type: String,
        default: ""
    }
}, { timestamps: true });

export default mongoose.model<IAppeal>('Appeal', appealSchema);
