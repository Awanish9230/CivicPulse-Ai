import mongoose from 'mongoose';

function arrayLimit(val) {
    return val.length <= 5;
}

const complaintSchema = new mongoose.Schema({
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
            type: [Number], // [longitude, latitude]
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
    imageUrl: {
        type: String,
        required: false, // Make optional for backward compatibility
    },
    imageUrls: {
        type: [String], // Array of secure URLs from Cloudinary
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
    supportCount: {
        type: Number,
        default: 1, // Represents number of merged duplicate reports
    },
    mergedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        default: null,
    },
    assignedTo: {
        department: String,
        officer: String,
    },
    escalationLevel: {
        type: Number, // 0 = normal, 1 = 48h, 2 = 72h, 3 = 96h
        default: 0,
    },
    officialReplies: [{
        authorityName: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
});

// Geospatial index for duplicate detection & mapping
complaintSchema.index({ location: '2dsphere' });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
