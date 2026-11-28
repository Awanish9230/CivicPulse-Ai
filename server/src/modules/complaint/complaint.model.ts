import mongoose, { HydratedDocument } from 'mongoose';
import type { AuthorityLevel } from '../user/user.model.js';

export type ComplaintCategory =
    | 'Road'
    | 'Electricity'
    | 'Garbage'
    | 'Water'
    | 'Drainage'
    | 'Traffic'
    | 'Illegal Dumping'
    | 'Street Light'
    | 'Construction'
    | 'Animal'
    | 'Others';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplaintStatus =
    | 'Submitted'
    | 'Verified'
    | 'Assigned'
    | 'In Progress'
    | 'Resolved'
    | 'Closed'
    | 'Rejected';

export interface IOfficialReply {
    authorityName: string;
    content: string;
    createdAt?: Date;
}

export interface IMergedReportEntry {
    reportedBy: string;
    description: string;
    imageUrls: string[];
    distanceMeters: number;
    similarityScore: number;
    mergedAt: Date;
}

export interface IComplaint {
    reportedBy: string;
    category: ComplaintCategory;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    address?: {
        ward?: string;
        district?: string;
        pinCode?: string;
        fullAddress?: string;
    };
    description: string;
    originalDescription?: string;
    originalLanguage: string;
    imageUrl?: string;
    imageUrls: string[];
    voiceNoteUrl?: string;
    priority: ComplaintPriority;
    status: ComplaintStatus;
    expectedCompletionDate?: Date;
    upvotedBy: string[];
    supportCount: number;
    reportCount: number;
    coReporters: string[];
    mergedReports: IMergedReportEntry[];
    mergedWith: mongoose.Types.ObjectId | null;
    assignedTo: mongoose.Types.ObjectId | null;
    escalationLevel: AuthorityLevel;
    lastActivityAt: Date;
    officialReplies: IOfficialReply[];
    resolutionImages: string[];
    resolutionFeedback: {
        status: 'Pending' | 'Accepted' | 'Rejected';
        comment?: string;
        updatedAt?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

export type ComplaintDocument = HydratedDocument<IComplaint>;

function arrayLimit(val: string[]): boolean {
    return val.length <= 5;
}

const complaintSchema = new mongoose.Schema<IComplaint>({
    reportedBy: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Road', 'Electricity', 'Garbage', 'Water', 'Drainage', 'Traffic', 'Illegal Dumping', 'Street Light', 'Construction', 'Animal', 'Others'],
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
        }
    },
    address: {
        ward: String,
        district: String,
        pinCode: String,
        fullAddress: String,
    },
    description: {
        type: String,
        required: true,
    },
    originalDescription: {
        type: String,
    },
    originalLanguage: {
        type: String,
        default: 'en',
    },
    imageUrl: {
        type: String,
        required: false,
    },
    imageUrls: {
        type: [String],
        default: [],
        validate: [arrayLimit, 'Exceeds the limit of 5 photos']
    },
    voiceNoteUrl: {
        type: String,
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    status: {
        type: String,
        enum: ['Submitted', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
        default: 'Submitted',
    },
    expectedCompletionDate: {
        type: Date,
    },
    upvotedBy: {
        type: [String],
        default: [],
    },
    supportCount: {
        type: Number,
        default: 1,
    },
    reportCount: {
        type: Number,
        default: 1,
    },
    coReporters: {
        type: [String],
        default: [],
    },
    mergedReports: [{
        reportedBy: { type: String, required: true },
        description: { type: String, required: true },
        imageUrls: { type: [String], default: [] },
        distanceMeters: { type: Number, default: 0 },
        similarityScore: { type: Number, default: 0 },
        mergedAt: { type: Date, default: Date.now }
    }],
    mergedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        default: null,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    escalationLevel: {
        type: String,
        enum: ['Junior', 'Senior', 'HOD'],
        default: 'Junior',
    },
    lastActivityAt: {
        type: Date,
        default: Date.now,
    },
    officialReplies: [{
        authorityName: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    resolutionImages: {
        type: [String],
        default: [],
        validate: [arrayLimit, 'Exceeds the limit of 5 photos']
    },
    resolutionFeedback: {
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected'],
            default: 'Pending',
        },
        comment: {
            type: String,
        },
        updatedAt: {
            type: Date,
        }
    }
}, {
    timestamps: true,
});

complaintSchema.index({ location: '2dsphere' });

const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);
export default Complaint;
