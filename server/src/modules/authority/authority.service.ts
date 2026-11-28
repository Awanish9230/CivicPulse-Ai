import { GoogleGenerativeAI } from '@google/generative-ai';
import User, { AuthorityLevel, Department, DutyStatus } from "../user/user.model.js";
import Complaint, { ComplaintStatus } from "../complaint/complaint.model.js";
import ApiError from "../../utils/ApiError.js";
import notificationService from "../notification/notification.service.js";
import uploadOnCloudinary from "../../utils/cloudinary.js";
import { calculateDistance } from '../../utils/geo.js';
import { getCategoriesForDepartment } from "../../utils/departmentMapping.js";
import { getDepartmentForCategory } from "./autoAssign.service.js";
import type { AuthenticatedUser } from "../../types/express.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ensureAuthorityOrAdmin = (actor: AuthenticatedUser): void => {
    if (actor.role !== 'Authority' && actor.role !== 'Admin') {
        throw new ApiError(403, "Access denied");
    }
};

export const isGlobalAuthorityManager = (actor: AuthenticatedUser): boolean => {
    return (
        actor.role === 'Admin' ||
        Boolean(actor.isAuthorityAdmin) ||
        (Array.isArray(actor.permissions) && actor.permissions.includes('manage_all_departments'))
    );
};

const buildAuthorityFilter = (
    actor: AuthenticatedUser,
    baseFilter: Record<string, unknown> = {}
): Record<string, unknown> => {
    const filter = { ...baseFilter };

    if (!isGlobalAuthorityManager(actor)) {
        const allowedCategories = getCategoriesForDepartment(actor.department);
        filter.category = { $in: allowedCategories };

        const level = actor.authorityLevel || 'Junior';
        if (level === 'Junior') {
            filter.escalationLevel = 'Junior';
        } else if (level === 'Senior') {
            filter.escalationLevel = { $in: ['Junior', 'Senior'] };
        }
    }

    return filter;
};

export interface CreateAuthorityInput {
    email?: string;
    password?: string;
    name?: string;
    authorityLevel?: AuthorityLevel;
    department?: Department;
    isAuthorityAdmin?: boolean;
    dutyStatus?: DutyStatus;
}

export const createAuthorityMember = async (
    input: CreateAuthorityInput,
    actor: AuthenticatedUser
) => {
    ensureAuthorityOrAdmin(actor);
    const globalManager = isGlobalAuthorityManager(actor);

    if (!globalManager && actor.authorityLevel !== 'HOD') {
        throw new ApiError(403, "Only Administrators or Heads of Department can create officials.");
    }

    const {
        email,
        password,
        name,
        authorityLevel = 'Junior',
        department,
        isAuthorityAdmin = false,
        dutyStatus = 'On Duty'
    } = input;

    const targetDepartment = globalManager ? department : actor.department;

    if (!email || !password || !name || !authorityLevel || !targetDepartment) {
        throw new ApiError(400, "All fields are required");
    }

    if (!globalManager && authorityLevel === 'HOD') {
        throw new ApiError(403, "Only Admin or Authority Admin can appoint an HOD.");
    }

    const existedUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existedUser) {
        throw new ApiError(409, "Authority member with this email already exists");
    }

    const anonymousId = User.generateAnonymousId();

    const user = await User.create({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        role: "Authority",
        authorityLevel,
        department: targetDepartment,
        dutyStatus,
        isActive: true,
        isAuthorityAdmin: globalManager ? Boolean(isAuthorityAdmin) : false,
        anonymousId
    });

    return User.findById(user._id).select("-password -refreshToken");
};

export const getAuthorityMembers = async (actor: AuthenticatedUser) => {
    ensureAuthorityOrAdmin(actor);
    return User.find({ role: "Authority" }).select("-password -refreshToken");
};

export const getTasks = async (actor: AuthenticatedUser) => {
    ensureAuthorityOrAdmin(actor);
    const filter = buildAuthorityFilter(actor, {
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
    });

    return Complaint.find(filter)
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name department');
};

export const escalateTask = async (complaintId: string, actor: AuthenticatedUser) => {
    ensureAuthorityOrAdmin(actor);

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
        throw new ApiError(400, "Cannot escalate a resolved complaint");
    }

    const currentLevel = complaint.escalationLevel;
    let nextLevel: AuthorityLevel = 'Junior';

    if (currentLevel === 'Junior') {
        nextLevel = 'Senior';
    } else if (currentLevel === 'Senior') {
        nextLevel = 'HOD';
    } else {
        throw new ApiError(400, "Complaint is already at the highest escalation level (HOD)");
    }

    complaint.escalationLevel = nextLevel;
    complaint.lastActivityAt = new Date();

    complaint.officialReplies.push({
        authorityName: actor.name || "System",
        content: `Complaint manually escalated to ${nextLevel} level.`
    });

    await complaint.save();

    try {
        await notificationService.createNotification({
            recipient: complaint.reportedBy,
            sender: actor._id,
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

    return { complaint, nextLevel };
};

export interface UpdateTaskInput {
    status?: ComplaintStatus;
    expectedCompletionDate?: string;
    gps?: { lat?: number; lng?: number };
    testModeBypass?: boolean | string;
    replyMessage?: string;
    files?: Express.Multer.File[];
}

export const updateTask = async (
    complaintId: string,
    input: UpdateTaskInput,
    actor: AuthenticatedUser
) => {
    ensureAuthorityOrAdmin(actor);

    const { status, expectedCompletionDate, gps, testModeBypass, replyMessage, files } = input;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    const updates: string[] = [];

    if (status === 'Resolved' && complaint.status !== 'Resolved') {
        if (!testModeBypass) {
            if (!gps || !gps.lat || !gps.lng) {
                throw new ApiError(400, "Live GPS coordinates are required for task resolution.");
            }

            if (complaint.location && complaint.location.coordinates.length === 2) {
                const issueLon = complaint.location.coordinates[0];
                const issueLat = complaint.location.coordinates[1];
                const distance = calculateDistance(gps.lat, gps.lng, issueLat, issueLon);

                if (distance > 200) {
                    throw new ApiError(
                        400,
                        `Resolution rejected: You are ${Math.round(distance)} meters away from the reported issue. You must be within 200 meters to resolve this task.`
                    );
                }
            }
        }

        if (!files || files.length < 2) {
            throw new ApiError(400, "At least 2 live resolution images are required to mark a task as Resolved.");
        }

        const uploadedImages: string[] = [];
        for (const file of files) {
            const uploaded = await uploadOnCloudinary(file.buffer);
            if (uploaded) {
                uploadedImages.push(uploaded.secure_url);
            }
        }

        if (uploadedImages.length < 2) {
            throw new ApiError(500, "Failed to upload resolution images to Cloudinary");
        }

        if (!testModeBypass) {
            try {
                const originalImageUrl = complaint.imageUrls?.[0] || complaint.imageUrl;

                if (originalImageUrl) {
                    const fetchImageAsBase64 = async (url: string): Promise<string> => {
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
                        const aiDecision = JSON.parse(
                            responseText.replace(/```json/g, '').replace(/```/g, '').trim()
                        ) as { isResolved: boolean; reason: string };

                        if (!aiDecision.isResolved) {
                            throw new ApiError(400, `AI Verification Failed: ${aiDecision.reason}`);
                        }
                    } catch (parseError) {
                        if (parseError instanceof ApiError) throw parseError;
                        console.error("Failed to parse Gemini response:", responseText);
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
            authorityName: actor.name || "System",
            content: updates.join('. ') + '.',
        });
        madeChanges = true;
    }

    if (replyMessage && replyMessage.trim() !== '') {
        complaint.officialReplies.push({
            authorityName: actor.name || "Authority",
            content: replyMessage.trim(),
        });
        madeChanges = true;
    }

    if (madeChanges) {
        complaint.lastActivityAt = new Date();
        await complaint.save();

        try {
            await notificationService.createNotification({
                recipient: complaint.reportedBy,
                sender: actor._id,
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

    return complaint;
};

export const assignTask = async (
    complaintId: string,
    assigneeId: string,
    actor: AuthenticatedUser
) => {
    ensureAuthorityOrAdmin(actor);
    const globalManager = isGlobalAuthorityManager(actor);

    if (!globalManager && actor.authorityLevel === 'Junior') {
        throw new ApiError(403, "Juniors cannot assign tasks");
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const assignee = await User.findById(assigneeId);
    if (!assignee || assignee.role !== 'Authority') {
        throw new ApiError(404, "Assignee not found or is not an authority member");
    }

    if (assignee.isActive === false || assignee.isBanned) {
        throw new ApiError(400, "Cannot assign task to a disabled or blocked official");
    }

    if (complaint.category && complaint.category !== 'Others') {
        const expectedDepartment = getDepartmentForCategory(complaint.category);
        if (assignee.department !== expectedDepartment) {
            throw new ApiError(
                400,
                `${complaint.category} issues can only be assigned to ${expectedDepartment} officials`
            );
        }
    }

    if (!globalManager && actor.department !== assignee.department) {
        throw new ApiError(403, "Cannot assign tasks outside your department");
    }

    if (!globalManager) {
        const levelMap: Record<AuthorityLevel, number> = { Junior: 1, Senior: 2, HOD: 3 };
        const assigneeRank = assignee.authorityLevel ? levelMap[assignee.authorityLevel] : 0;
        const actorRank = actor.authorityLevel ? levelMap[actor.authorityLevel] : 0;
        if (assigneeRank > actorRank) {
            throw new ApiError(403, "Cannot assign tasks to a higher ranking official");
        }
    }

    complaint.assignedTo = assignee._id;
    if (complaint.status === 'Submitted' || complaint.status === 'Verified') {
        complaint.status = 'Assigned';
    }
    complaint.lastActivityAt = new Date();
    complaint.officialReplies.push({
        authorityName: actor.name || "System",
        content: `Task assigned to ${assignee.name} (${assignee.authorityLevel}).`
    });

    await complaint.save();

    try {
        await notificationService.createNotification({
            recipient: assignee._id.toString(),
            sender: actor._id,
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

    return complaint;
};

export const updateDutyStatus = async (
    dutyStatus: DutyStatus | undefined,
    actor: AuthenticatedUser
) => {
    ensureAuthorityOrAdmin(actor);
    const validStatuses: DutyStatus[] = ['On Duty', 'Off Duty', 'On Leave', 'Busy'];
    if (!dutyStatus || !validStatuses.includes(dutyStatus)) {
        throw new ApiError(400, "Invalid duty status");
    }

    const updated = await User.findByIdAndUpdate(
        actor._id,
        { dutyStatus, lastSeenAt: new Date() },
        { new: true }
    ).select("-password -refreshToken");

    if (!updated) {
        throw new ApiError(404, "Official not found");
    }

    return updated;
};

export const getDepartmentMembers = async (actor: AuthenticatedUser) => {
    ensureAuthorityOrAdmin(actor);
    const globalManager = isGlobalAuthorityManager(actor);

    const filter: Record<string, unknown> = { role: "Authority" };
    if (!globalManager) {
        filter.department = actor.department;
    }

    const members = await User.find(filter).select("-password -refreshToken");

    return Promise.all(
        members.map(async (m) => {
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
        })
    );
};

export const getEmployeeReport = async (employeeId: string, actor: AuthenticatedUser) => {
    ensureAuthorityOrAdmin(actor);
    const globalManager = isGlobalAuthorityManager(actor);

    const employee = await User.findById(employeeId).select("-password -refreshToken");
    if (!employee || employee.role !== 'Authority') {
        throw new ApiError(404, "Employee not found");
    }

    if (!globalManager && actor.department !== employee.department) {
        throw new ApiError(403, "Can only view reports for employees in your department");
    }

    const activeTasks = await Complaint.find({
        assignedTo: employeeId,
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
    }).sort({ priority: -1, createdAt: -1 });

    const completedTasks = await Complaint.find({
        assignedTo: employeeId,
        status: { $in: ['Resolved', 'Closed'] }
    }).sort({ updatedAt: -1 }).limit(50);

    return {
        employee,
        activeTasks,
        completedTasks,
        stats: {
            activeCount: activeTasks.length,
            completedCount: completedTasks.length
        }
    };
};

export const getAnalytics = async (actor: AuthenticatedUser) => {
    ensureAuthorityOrAdmin(actor);
    const filter = buildAuthorityFilter(actor);

    return Complaint.find(filter)
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name authorityLevel department');
};
