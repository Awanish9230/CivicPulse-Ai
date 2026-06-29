import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";

// Middleware-like check, can be extracted to auth.middleware.js if needed
const checkSuperOfficer = (req) => {
    if (req.user.email !== 'officer@city.gov') {
        throw new ApiError(403, "Access denied. Only the chief officer can perform this action.");
    }
};

export const createAuthorityMember = asyncHandler(async (req, res) => {
    checkSuperOfficer(req);

    const { email, password, name, authorityLevel, department } = req.body;

    if (!email || !password || !name || !authorityLevel || !department) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "Authority member with this email already exists");
    }

    // Generate an anonymous ID even for authorities just to satisfy the schema required constraint
    const anonymousId = User.generateAnonymousId();

    const user = await User.create({
        email,
        password,
        name,
        role: "Authority",
        authorityLevel,
        department,
        anonymousId
    });

    const createdUser = await User.findById(user._id).select("-password");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "Authority member created successfully")
    );
});

export const getAuthorityMembers = asyncHandler(async (req, res) => {
    // Only authorities can view members
    if (req.user.role !== 'Authority' && req.user.role !== 'Admin') {
        throw new ApiError(403, "Access denied");
    }

    const members = await User.find({ role: "Authority" }).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, members, "Authority members fetched successfully")
    );
});

export const getTasks = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Authority') {
        throw new ApiError(403, "Access denied");
    }

    // A junior only sees Junior tasks, Senior sees Senior, HOD sees HOD
    const level = req.user.authorityLevel || 'Junior';

    const complaints = await Complaint.find({
        escalationLevel: level,
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] } // Only active complaints
    }).sort({ createdAt: -1 }).populate('reportedBy', 'anonymousId');

    return res.status(200).json(
        new ApiResponse(200, complaints, "Tasks fetched successfully")
    );
});

export const escalateTask = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Authority') {
        throw new ApiError(403, "Access denied");
    }

    const { complaintId } = req.params;
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
        throw new ApiError(400, "Cannot escalate a resolved complaint");
    }

    const currentLevel = complaint.escalationLevel;
    let nextLevel = 'Junior';

    if (currentLevel === 'Junior') {
        nextLevel = 'Senior';
    } else if (currentLevel === 'Senior') {
        nextLevel = 'HOD';
    } else {
        throw new ApiError(400, "Complaint is already at the highest escalation level (HOD)");
    }

    complaint.escalationLevel = nextLevel;
    complaint.lastActivityAt = Date.now();
    
    // Add an official reply logging the manual escalation
    complaint.officialReplies.push({
        authorityName: req.user.name || "System",
        content: `Complaint manually escalated to ${nextLevel} level.`
    });

    await complaint.save();

    return res.status(200).json(
        new ApiResponse(200, complaint, `Complaint successfully escalated to ${nextLevel}`)
    );
});
