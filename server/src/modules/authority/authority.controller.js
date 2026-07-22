import User from "../user/user.model.js";
import Complaint from "../complaint/complaint.model.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asynchandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import notificationService from "../notification/notification.service.js";
import uploadOnCloudinary from "../../utils/cloudinary.js";
import { calculateDistance } from '../../utils/geo.js';
import { getCategoriesForDepartment } from "../../utils/departmentMapping.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const createAuthorityMember = asyncHandler(async (req, res) => {
    // Only Chief Officer can create authority members for their department
    if (req.user.role !== 'Authority' || req.user.authorityLevel !== 'ChiefOfficer') {
        throw new ApiError(403, "Access denied. Only Chief Officers can perform this action.");
    }

    const { email, password, name, authorityLevel } = req.body;

    if (!email || !password || !name || !authorityLevel) {
        throw new ApiError(400, "All fields are required");
    }

    // Chief Officers cannot create other Chief Officers
    if (authorityLevel === 'ChiefOfficer') {
        throw new ApiError(403, "Chief Officers cannot create other Chief Officers.");
    }

    if (authorityLevel !== 'Junior' && authorityLevel !== 'Senior') {
        throw new ApiError(400, "Can only create Junior or Senior officers.");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "Authority member with this email already exists");
    }

    // Department must always be inherited from req.user.department
    const user = await User.create({
        email,
        password,
        name,
        role: "Authority",
        authorityLevel,
        department: req.user.department,
    });

    const createdUser = await User.findById(user._id).select("-password");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "Authority member created successfully")
    );
});

export const updateAuthorityMember = asyncHandler(async (req, res) => {
    // Only Chief Officer or Admin can update authority members
    if (req.user.role !== 'Admin' && (req.user.role !== 'Authority' || req.user.authorityLevel !== 'ChiefOfficer')) {
        throw new ApiError(403, "Access denied. Only Chief Officers or Admins can perform this action.");
    }

    const { memberId } = req.params;
    const { name, email, authorityLevel } = req.body;

    const targetUser = await User.findById(memberId);
    if (!targetUser) {
        throw new ApiError(404, "Authority member not found");
    }

    // Verify department isolation (skip for Admin)
    if (req.user.role !== 'Admin' && targetUser.department !== req.user.department) {
        throw new ApiError(403, "Access denied. Cannot manage members outside your department.");
    }

    // Admins or Chief Officers can only edit Junior/Senior officers
    if (targetUser.role !== 'Authority' || (targetUser.authorityLevel !== 'Junior' && targetUser.authorityLevel !== 'Senior')) {
        throw new ApiError(403, "Access denied. You can only manage Junior or Senior officers.");
    }

    if (authorityLevel && authorityLevel !== 'Junior' && authorityLevel !== 'Senior') {
        throw new ApiError(400, "Can only update officer level to Junior or Senior.");
    }

    if (name) targetUser.name = name;
    if (email) {
        const emailExists = await User.findOne({ email, _id: { $ne: targetUser._id } });
        if (emailExists) {
            throw new ApiError(409, "Email is already taken by another user.");
        }
        targetUser.email = email;
    }
    if (authorityLevel) targetUser.authorityLevel = authorityLevel;

    await targetUser.save();
    const updatedUser = await User.findById(targetUser._id).select("-password");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Authority member updated successfully")
    );
});

export const deleteAuthorityMember = asyncHandler(async (req, res) => {
    // Only Chief Officer or Admin can delete authority members
    if (req.user.role !== 'Admin' && (req.user.role !== 'Authority' || req.user.authorityLevel !== 'ChiefOfficer')) {
        throw new ApiError(403, "Access denied. Only Chief Officers or Admins can perform this action.");
    }

    const { memberId } = req.params;

    const targetUser = await User.findById(memberId);
    if (!targetUser) {
        throw new ApiError(404, "Authority member not found");
    }

    // Verify department isolation (skip for Admin)
    if (req.user.role !== 'Admin' && targetUser.department !== req.user.department) {
        throw new ApiError(403, "Access denied. Cannot manage members outside your department.");
    }

    // Admins or Chief Officers can only delete Junior/Senior officers
    if (targetUser.role !== 'Authority' || (targetUser.authorityLevel !== 'Junior' && targetUser.authorityLevel !== 'Senior')) {
        throw new ApiError(403, "Access denied. You can only manage Junior or Senior officers.");
    }

    await User.findByIdAndDelete(memberId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Authority member deleted successfully")
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

    // Admin sees all active tasks. Authorities see restricted views.
    if (req.user.role !== 'Admin') {
        // 1. Department Filtering
        const allowedCategories = getCategoriesForDepartment(req.user.department);
        filter.category = { $in: allowedCategories };

        // 2. Hierarchy Filtering
        const level = req.user.authorityLevel || 'Junior';
        
        if (level === 'Junior') {
            // Juniors can see all Junior level tasks in their department
            filter.escalationLevel = 'Junior';
        } else if (level === 'Senior') {
            // Seniors can see Junior and Senior level tasks in their department
            filter.escalationLevel = { $in: ['Junior', 'Senior'] };
        } else if (level === 'ChiefOfficer') {
            // Chief Officers can see ALL tasks in their department regardless of escalationLevel
            // No additional escalationLevel filter needed
        }
    }

    const complaints = await Complaint.find(filter)
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name department');

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
        nextLevel = 'ChiefOfficer';
    } else {
        throw new ApiError(400, "Complaint is already at the highest escalation level (ChiefOfficer)");
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
    const { status, expectedCompletionDate, gps, testModeBypass, replyMessage } = req.body;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    let updates = [];

    // Resolution enforcement
    if (status === 'Resolved' && complaint.status !== 'Resolved') {
        if (!testModeBypass) {
            // 1. Enforce GPS location
            if (!gps || !gps.lat || !gps.lng) {
                throw new ApiError(400, "Live GPS coordinates are required for task resolution.");
            }
            
            if (complaint.location && complaint.location.coordinates.length === 2) {
                // coordinates are [longitude, latitude]
                const issueLon = complaint.location.coordinates[0];
                const issueLat = complaint.location.coordinates[1];
                
                const distance = calculateDistance(gps.lat, gps.lng, issueLat, issueLon);
                
                if (distance > 200) {
                    throw new ApiError(400, `Resolution rejected: You are ${Math.round(distance)} meters away from the reported issue. You must be within 200 meters to resolve this task.`);
                }
            }
        }

        if (!req.files || req.files.length < 2) {
            throw new ApiError(400, "At least 2 live resolution images are required to mark a task as Resolved.");
        }

        const uploadedImages = [];
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.buffer);
            if (uploaded) {
                uploadedImages.push(uploaded.secure_url);
            }
        }

        if (uploadedImages.length < 2) {
            throw new ApiError(500, "Failed to upload resolution images to Cloudinary");
        }
        
        if (!testModeBypass) {
            // 2. Gemini AI Validation
            try {
                // Get the original issue image if available
                const originalImageUrl = complaint.imageUrls?.[0] || complaint.imageUrl;
                
                if (originalImageUrl) {
                    // Helper to fetch image and convert to base64 for Gemini
                    const fetchImageAsBase64 = async (url) => {
                        const response = await fetch(url);
                        const arrayBuffer = await response.arrayBuffer();
                        return Buffer.from(arrayBuffer).toString('base64');
                    };

                    const originalBase64 = await fetchImageAsBase64(originalImageUrl);
                    const resolutionBase64 = await fetchImageAsBase64(uploadedImages[0]);
                    
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    
                    const prompt = `You are a strict civic AI inspector.
I am providing two images. 
Image 1 (first) is the original complaint (e.g., a pothole, garbage, broken light).
Image 2 (second) is the resolution proof provided by the authority.
Your job is to determine if the core issue shown in Image 1 has genuinely been fixed in Image 2.
Respond ONLY with a JSON object in the following format:
{
  "isResolved": boolean,
  "reason": "a short explanation of your decision"
}
Do not use markdown blocks, just return the raw JSON text.`;
                    
                    const imageParts = [
                        { inlineData: { data: originalBase64, mimeType: "image/jpeg" } },
                        { inlineData: { data: resolutionBase64, mimeType: "image/jpeg" } }
                    ];

                    const result = await model.generateContent([prompt, ...imageParts]);
                    const responseText = result.response.text();
                    
                    try {
                        const aiDecision = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
                        
                        if (!aiDecision.isResolved) {
                            throw new ApiError(400, `AI Verification Failed: ${aiDecision.reason}`);
                        }
                    } catch (parseError) {
                        if (parseError instanceof ApiError) throw parseError; // Rethrow AI rejection
                        console.error("Failed to parse Gemini response:", responseText);
                        // If it fails to parse, we can either block or let it pass. Let's block if strict.
                        throw new ApiError(500, "Failed to automatically verify resolution images. Please try again.");
                    }
                }
            } catch (error) {
                if (error instanceof ApiError) throw error;
                console.error("Gemini AI Verification Error:", error);
                throw new ApiError(500, "AI Verification encountered an error. Try again.");
            }
        }

        complaint.resolutionImages = uploadedImages;
        complaint.resolutionFeedback.status = 'Pending';
        updates.push(`Uploaded ${uploadedImages.length} live resolution images from site`);
        if (!testModeBypass) updates.push(`AI successfully verified resolution`);
    }

    if (status && complaint.status !== status) {
        complaint.status = status;
        updates.push(`Status updated to ${status}`);
    }

    if (expectedCompletionDate) {
        complaint.expectedCompletionDate = new Date(expectedCompletionDate);
        updates.push(`Expected completion date set to ${new Date(expectedCompletionDate).toLocaleDateString()}`);
    }

    let madeChanges = false;

    if (updates.length > 0) {
        complaint.officialReplies.push({
            authorityName: req.user.name || "System",
            content: updates.join('. ') + '.',
        });
        madeChanges = true;
    }

    if (replyMessage && replyMessage.trim() !== '') {
        complaint.officialReplies.push({
            authorityName: req.user.name || "Authority",
            content: replyMessage.trim(),
        });
        madeChanges = true;
    }

    if (madeChanges) {
        complaint.lastActivityAt = Date.now();
        await complaint.save();

        try {
            await notificationService.createNotification({
                recipient: complaint.reportedBy,
                sender: req.user._id,
                title: 'Complaint Updated',
                message: `An authority updated your complaint: ${updates.join('. ')}.`,
                type: 'System Notification',
                priority: 'Low',
                complaint: complaint._id,
                actionUrl: `/complaints/${complaint._id}`
            });
        } catch (error) {
            console.error("Notification error on task update", error);
        }
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

    // Chief Officer can assign to Senior/Junior. Senior can assign to Junior (or another Senior maybe?).
    if (req.user.role !== 'Admin') {
        const levelMap = { 'Junior': 1, 'Senior': 2, 'ChiefOfficer': 3 };
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

    try {
        await notificationService.createNotification({
            recipient: assignee._id,
            sender: req.user._id,
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${complaint.category}.`,
            type: 'Task Assigned',
            priority: 'High',
            complaint: complaint._id,
            actionUrl: `/authority/dashboard`
        });
    } catch (error) {
        console.error("Notification error on task assignment", error);
    }

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

export const getAnalytics = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Authority' && req.user.role !== 'Admin') {
        throw new ApiError(403, 'Access denied');
    }

    let filter = {};

    if (req.user.role !== 'Admin') {
        // 1. Department Filtering
        const allowedCategories = getCategoriesForDepartment(req.user.department);
        filter.category = { $in: allowedCategories };

        // 2. Hierarchy Filtering
        const level = req.user.authorityLevel || 'Junior';
        
        if (level === 'Junior') {
            filter.escalationLevel = 'Junior';
        } else if (level === 'Senior') {
            filter.escalationLevel = { $in: ['Junior', 'Senior'] };
        } else if (level === 'ChiefOfficer') {
            // Chief Officers see all
        }
    }

    const complaints = await Complaint.find(filter)
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name authorityLevel department');

    return res.status(200).json(
        new ApiResponse(200, complaints, 'Analytics data fetched successfully')
    );
});
