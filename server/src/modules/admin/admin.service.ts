import { GoogleGenerativeAI } from '@google/generative-ai';
import User, { AuthorityLevel, Department, UserRole } from '../user/user.model.js';
import Complaint from '../complaint/complaint.model.js';
import ApiError from '../../utils/ApiError.js';

export const getDashboardStats = async () => {
    const totalComplaints = await Complaint.countDocuments();
    const activeAuthorities = await User.countDocuments({ role: 'Authority' });
    const registeredCitizens = await User.countDocuments({ role: 'Citizen' });

    return {
        totalComplaints,
        activeAuthorities,
        registeredCitizens,
        systemHealth: 99.9
    };
};

export const getAllCitizens = async (page: number, limit: number, search?: string) => {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { role: 'Citizen' };

    if (search) {
        query.email = { $regex: search, $options: 'i' };
    }

    const citizens = await User.find(query).skip(skip).limit(limit).select('-password');
    const total = await User.countDocuments(query);

    const citizensWithStats = await Promise.all(
        citizens.map(async (citizen) => {
            const complaintsCount = await Complaint.countDocuments({ reportedBy: citizen._id.toString() });
            return {
                ...citizen.toObject(),
                complaintsCount
            };
        })
    );

    return {
        users: citizensWithStats,
        totalPages: Math.ceil(total / limit),
        currentPage: page
    };
};

export const getAllAuthorities = async (page: number, limit: number, search?: string) => {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { role: 'Authority' };

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const authorities = await User.find(query).skip(skip).limit(limit).select('-password');
    const total = await User.countDocuments(query);

    const authoritiesWithStats = await Promise.all(
        authorities.map(async (auth) => {
            const tasksCount = await Complaint.countDocuments({ assignedTo: auth._id });
            return {
                ...auth.toObject(),
                tasksCount
            };
        })
    );

    return {
        authorities: authoritiesWithStats,
        totalPages: Math.ceil(total / limit),
        currentPage: page
    };
};

export const getAllComplaints = async (page: number, limit: number, search?: string) => {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const complaints = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'name department');

    const total = await Complaint.countDocuments(query);

    return {
        complaints,
        totalPages: Math.ceil(total / limit),
        currentPage: page
    };
};

export const generateAiInsights = async (): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new ApiError(400, "Gemini API key is missing from environment variables");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const recentComplaints = await Complaint.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title category status location');
    const totalPending = await Complaint.countDocuments({
        status: { $in: ['Pending', 'In Progress'] }
    } as Record<string, unknown>);

    const prompt = `
        You are CivicPulse AI, an advanced AI assistant for municipal administrators.
        Analyze the following recent platform data and provide:
        1. An overall health summary (1 short paragraph).
        2. Potential anomalies, fraud, or spam detection (if any).
        3. Recommended actions or hotspots to prioritize.

        Platform Data:
        Total Pending Complaints: ${totalPending}
        Recent 10 Complaints: ${JSON.stringify(recentComplaints)}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
};

export const getMemberDetails = async (memberId: string) => {
    const member = await User.findById(memberId).select('-password');
    if (!member) {
        throw new ApiError(404, "Member not found");
    }

    let activeTasks = [];
    let completedTasks = [];

    if (member.role === 'Authority' || member.role === 'Admin') {
        activeTasks = await Complaint.find({
            assignedTo: memberId,
            status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
        }).sort({ createdAt: -1 });

        completedTasks = await Complaint.find({
            assignedTo: memberId,
            status: { $in: ['Resolved', 'Closed'] }
        }).sort({ updatedAt: -1 }).limit(100);
    } else {
        activeTasks = await Complaint.find({
            reportedBy: memberId,
            status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
        }).sort({ createdAt: -1 });

        completedTasks = await Complaint.find({
            reportedBy: memberId,
            status: { $in: ['Resolved', 'Closed'] }
        }).sort({ updatedAt: -1 }).limit(100);
    }

    return {
        member,
        activeTasks,
        completedTasks,
        stats: {
            activeCount: activeTasks.length,
            completedCount: completedTasks.length
        }
    };
};

export interface UpdateUserInput {
    name?: string;
    email?: string;
    role?: UserRole;
    department?: Department;
    authorityLevel?: AuthorityLevel;
    isBanned?: boolean;
}

export const updateUser = async (memberId: string, updates: UpdateUserInput) => {
    const { name, email, role, department, authorityLevel, isBanned } = updates;

    const user = await User.findById(memberId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) {
        user.role = role;
        if (role === 'Citizen') {
            user.department = undefined;
            user.authorityLevel = undefined;
        }
    }
    if (department && user.role === 'Authority') user.department = department;
    if (authorityLevel && user.role === 'Authority') user.authorityLevel = authorityLevel;
    if (typeof isBanned !== 'undefined') user.isBanned = isBanned;

    await user.save();

    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().to('admin_room').emit('user_updated', user);
    } catch (e) {
        console.error("Socket error on user update", e);
    }

    return user;
};

export const deleteComplaintAdmin = async (complaintId: string): Promise<void> => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    await Complaint.findByIdAndDelete(complaintId);

    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().emit('complaint_deleted', { _id: complaintId });
        getIo().to('admin_room').emit('stats_update', { type: 'complaint_deleted' });
    } catch (e) {
        console.error("Socket error on admin complaint delete", e);
    }
};
