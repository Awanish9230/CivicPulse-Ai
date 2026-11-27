import mongoose from 'mongoose';

function arrayLimit(val) {
    return val.length <= 5;
}

const complaintSchema = new mongoose.Schema({
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

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
