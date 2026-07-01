import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import notificationService from "../services/notificationService.js";

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
    if (req.user.role !== 'Authority' && req.user.role !== 'Admin') {
        throw new ApiError(403, "Access denied");
    }

    let filter = { status: { $nin: ['Resolved', 'Closed', 'Rejected'] } };

    // Admin sees all active tasks. Authorities only see tasks at their escalation level.
    if (req.user.role !== 'Admin') {
        const level = req.user.authorityLevel || 'Junior';
        filter.escalationLevel = level;
    }

    const complaints = await Complaint.find(filter)
        .sort({ createdAt: -1 })
        .populate('reportedBy', 'anonymousId')
        .populate('assignedTo', 'name authorityLevel department');

    return res.status(200).json(
        new ApiResponse(200, complaints, "Tasks fetched successfully")
    );
});

export const escalateTask = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Authority' && req.user.role !== 'Admin') {
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
    
    try {
        await notificationService.createNotification({
            recipient: complaint.reportedBy,
            sender: req.user._id,
            title: 'Complaint Escalated',
            message: `Your complaint has been escalated to ${nextLevel} level for faster resolution.`,
            type: 'Complaint Escalated',
            priority: 'Medium',
            complaint: complaint._id,
            actionUrl: `/complaints/${complaint._id}`
        });
    } catch (error) {
        console.error("Notification error on escalation", error);
    }

    return res.status(200).json(
        new ApiResponse(200, complaint, `Complaint successfully escalated to ${nextLevel}`)
    );
});

export const updateTask = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Authority' && req.user.role !== 'Admin') {
        throw new ApiError(403, "Access denied");
    }

    const { complaintId } = req.params;
    const { status, expectedCompletionDate } = req.body;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    let updates = [];

    if (status && complaint.status !== status) {
        complaint.status = status;
        updates.push(`Status updated to ${status}`);
    }

    if (expectedCompletionDate) {
        complaint.expectedCompletionDate = new Date(expectedCompletionDate);
        updates.push(`Expected completion date set to ${new Date(expectedCompletionDate).toLocaleDateString()}`);
    }

    if (updates.length > 0) {
        complaint.lastActivityAt = Date.now();
        complaint.officialReplies.push({
            authorityName: req.user.name || "System",
            content: updates.join('. ') + '.',
        });
        await complaint.save();
    }

    return res.status(200).json(
        new ApiResponse(200, complaint, "Task updated successfully")
    );
});

export const assignTask = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Authority' && req.user.role !== 'Admin') {
        throw new ApiError(403, "Access denied");
    }

    // Must be Senior or HOD
    if (req.user.role === 'Authority' && req.user.authorityLevel === 'Junior') {
        throw new ApiError(403, "Juniors cannot assign tasks");
    }

    const { complaintId } = req.params;
    const { assigneeId } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const assignee = await User.findById(assigneeId);
    if (!assignee || assignee.role !== 'Authority') {
        throw new ApiError(404, "Assignee not found or is not an authority member");
    }

    // Must be in the same department (unless Admin)
    if (req.user.role !== 'Admin' && req.user.department !== assignee.department) {
        throw new ApiError(403, "Cannot assign tasks outside your department");
    }

    // HOD can assign to Senior/Junior. Senior can assign to Junior (or another Senior maybe?).
    if (req.user.role !== 'Admin') {
        const levelMap = { 'Junior': 1, 'Senior': 2, 'HOD': 3 };
        if (levelMap[assignee.authorityLevel] > levelMap[req.user.authorityLevel]) {
             throw new ApiError(403, "Cannot assign tasks to a higher ranking official");
        }
    }

    complaint.assignedTo = assignee._id;
    if (complaint.status === 'Submitted' || complaint.status === 'Verified') {
        complaint.status = 'Assigned';
    }
    complaint.lastActivityAt = Date.now();
    complaint.officialReplies.push({
        authorityName: req.user.name || "System",
        content: `Task assigned to ${assignee.name} (${assignee.authorityLevel}).`
    });

    await complaint.save();

    return res.status(200).json(
        new ApiResponse(200, complaint, "Task assigned successfully")
    );
});

export const getDepartmentMembers = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Authority' && req.user.role !== 'Admin') {
        throw new ApiError(403, "Access denied");
    }

    let filter = { role: "Authority" };
    if (req.user.role !== 'Admin') {
        filter.department = req.user.department;
    }

    const members = await User.find(filter).select("-password -refreshToken");

    // Get stats for each
    const memberStats = await Promise.all(members.map(async (m) => {
        const activeCount = await Complaint.countDocuments({ 
            assignedTo: m._id, 
            status: { $nin: ['Resolved', 'Closed', 'Rejected'] } 
        });
        const completedCount = await Complaint.countDocuments({ 
            assignedTo: m._id, 
            status: { $in: ['Resolved', 'Closed'] } 
        });

        return {
            ...m.toObject(),
            activeTasks: activeCount,
            completedTasks: completedCount
        };
    }));

    return res.status(200).json(
        new ApiResponse(200, memberStats, "Department members fetched successfully")
    );
});

export const getEmployeeReport = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Authority' && req.user.role !== 'Admin') {
        throw new ApiError(403, "Access denied");
    }

    const { employeeId } = req.params;
    const employee = await User.findById(employeeId).select("-password -refreshToken");

    if (!employee || employee.role !== 'Authority') {
        throw new ApiError(404, "Employee not found");
    }

    if (req.user.role !== 'Admin' && req.user.department !== employee.department) {
        throw new ApiError(403, "Can only view reports for employees in your department");
    }

    const activeTasks = await Complaint.find({ 
        assignedTo: employeeId, 
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] } 
    }).sort({ priority: -1, createdAt: -1 });

    const completedTasks = await Complaint.find({ 
        assignedTo: employeeId, 
        status: { $in: ['Resolved', 'Closed'] } 
    }).sort({ updatedAt: -1 }).limit(50); // Get last 50 completed tasks

    return res.status(200).json(
        new ApiResponse(200, {
            employee,
            activeTasks,
            completedTasks,
            stats: {
                activeCount: activeTasks.length,
                completedCount: completedTasks.length
            }
        }, "Employee report generated")
    );
});
