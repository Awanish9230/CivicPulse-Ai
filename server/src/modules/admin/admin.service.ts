import crypto from 'crypto';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import User, { AuthorityLevel, Department, DutyStatus, UserRole } from '../user/user.model.js';
import Complaint from '../complaint/complaint.model.js';
import Role, { RoleScope, SYSTEM_PERMISSIONS } from '../role/role.model.js';
import DepartmentModel from '../department/department.model.js';
import { getGlobalSystemSettings } from '../settings/systemSettings.model.js';
import { DEPARTMENT_CATEGORY_MAP, getCategoriesForDepartment } from '../../utils/departmentMapping.js';
import { getDepartmentForCategory } from '../authority/autoAssign.service.js';
import { runEscalationSweep } from '../../utils/escalationCron.js';
import notificationService from '../notification/notification.service.js';
import ApiError from '../../utils/ApiError.js';
import type { AuthenticatedUser } from '../../types/express.js';

const DEFAULT_DEPARTMENTS: Array<{ name: string; code: string; categories: string[]; description: string }> = [
    { name: 'Public Works', code: 'PWD', categories: DEPARTMENT_CATEGORY_MAP['Public Works'], description: 'Roads, bridges, potholes, and construction infrastructure.' },
    { name: 'Water & Sanitation', code: 'WSN', categories: DEPARTMENT_CATEGORY_MAP['Water & Sanitation'], description: 'Water supply, drainage, garbage, and illegal dumping.' },
    { name: 'Power', code: 'PWR', categories: DEPARTMENT_CATEGORY_MAP['Power'], description: 'Electrical grid, transformers, and street lighting.' },
    { name: 'Traffic & Safety', code: 'TRF', categories: DEPARTMENT_CATEGORY_MAP['Traffic & Safety'], description: 'Traffic signals, bottlenecks, and road safety.' },
    { name: 'Animal Control', code: 'ANM', categories: DEPARTMENT_CATEGORY_MAP['Animal Control'], description: 'Stray animal welfare and public safety.' },
    { name: 'General Administration', code: 'GEN', categories: DEPARTMENT_CATEGORY_MAP['General Administration'], description: 'Miscellaneous municipal services and coordination.' }
];

const ensureDefaultDepartments = async () => {
    const count = await DepartmentModel.countDocuments();
    if (count === 0) {
        await DepartmentModel.insertMany(DEFAULT_DEPARTMENTS);
    }
};

export const getDashboardStats = async () => {
    const [totalComplaints, activeAuthorities, presentAuthorities, registeredCitizens] = await Promise.all([
        Complaint.countDocuments(),
        User.countDocuments({ role: 'Authority', isActive: { $ne: false }, isBanned: { $ne: true } }),
        User.countDocuments({
            role: 'Authority',
            isActive: { $ne: false },
            isBanned: { $ne: true },
            dutyStatus: 'On Duty'
        }),
        User.countDocuments({ role: 'Citizen' })
    ]);

    return {
        totalComplaints,
        activeAuthorities,
        presentAuthorities,
        registeredCitizens,
        systemHealth: 99.9
    };
};

export const getAllCitizens = async (
    page: number,
    limit: number,
    search?: string,
    statusFilter?: string
) => {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { role: 'Citizen' };

    if (search && search.trim()) {
        query.$or = [
            { email: { $regex: search.trim(), $options: 'i' } },
            { name: { $regex: search.trim(), $options: 'i' } }
        ];
    }

    if (statusFilter === 'disabled') {
        query.isActive = false;
    } else if (statusFilter === 'blocked') {
        query.isBanned = true;
    } else if (statusFilter === 'active') {
        query.isActive = { $ne: false };
        query.isBanned = { $ne: true };
    }

    const citizens = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customRole', 'name slug scope permissions')
        .select('-password -refreshToken');
    const total = await User.countDocuments(query);

    const citizensWithStats = await Promise.all(
        citizens.map(async (citizen) => {
            const plainCurrent = User.decryptIdentity(citizen.anonymousId) || citizen.anonymousId;
            const plainPast = (citizen.pastAnonymousIds || [])
                .map((id) => User.decryptIdentity(id))
                .filter((id): id is string => Boolean(id));
            const allIds = [plainCurrent, ...plainPast, citizen._id.toString()];

            const complaintsCount = await Complaint.countDocuments({
                $or: [
                    { reportedBy: { $in: allIds } },
                    { coReporters: { $in: allIds } }
                ]
            });

            const obj = citizen.toObject();
            return {
                ...obj,
                anonymousId: plainCurrent,
                isActive: obj.isActive !== false,
                complaintsCount
            };
        })
    );

    return {
        users: citizensWithStats,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        currentPage: page
    };
};

export const getAllAuthorities = async (
    page: number,
    limit: number,
    search?: string,
    filters?: { department?: string; dutyStatus?: string; status?: string }
) => {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {
        role: { $in: ['Authority', 'Admin'] }
    };

    if (search && search.trim()) {
        query.$or = [
            { name: { $regex: search.trim(), $options: 'i' } },
            { email: { $regex: search.trim(), $options: 'i' } },
            { department: { $regex: search.trim(), $options: 'i' } }
        ];
    }

    if (filters?.department && filters.department !== 'All') {
        query.department = filters.department;
    }
    if (filters?.dutyStatus && filters.dutyStatus !== 'All') {
        query.dutyStatus = filters.dutyStatus;
    }
    if (filters?.status === 'disabled') {
        query.isActive = false;
    } else if (filters?.status === 'blocked') {
        query.isBanned = true;
    } else if (filters?.status === 'active') {
        query.isActive = { $ne: false };
        query.isBanned = { $ne: true };
    }

    const [authorities, total, presentCount, disabledCount, blockedCount] = await Promise.all([
        User.find(query)
            .sort({ role: 1, isAuthorityAdmin: -1, department: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .populate('customRole', 'name slug scope permissions')
            .select('-password -refreshToken'),
        User.countDocuments(query),
        User.countDocuments({
            role: 'Authority',
            isActive: { $ne: false },
            isBanned: { $ne: true },
            dutyStatus: 'On Duty'
        }),
        User.countDocuments({ role: { $in: ['Authority', 'Admin'] }, isActive: false }),
        User.countDocuments({ role: { $in: ['Authority', 'Admin'] }, isBanned: true })
    ]);

    const authoritiesWithStats = await Promise.all(
        authorities.map(async (auth) => {
            const [activeTasksCount, completedTasksCount] = await Promise.all([
                Complaint.countDocuments({
                    assignedTo: auth._id,
                    status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
                }),
                Complaint.countDocuments({
                    assignedTo: auth._id,
                    status: { $in: ['Resolved', 'Closed'] }
                })
            ]);

            const obj = auth.toObject();
            return {
                ...obj,
                isActive: obj.isActive !== false,
                dutyStatus: obj.dutyStatus || 'On Duty',
                activeTasksCount,
                completedTasksCount,
                tasksCount: activeTasksCount + completedTasksCount
            };
        })
    );

    return {
        authorities: authoritiesWithStats,
        summary: {
            total,
            presentCount,
            disabledCount,
            blockedCount
        },
        totalPages: Math.max(1, Math.ceil(total / limit)),
        currentPage: page
    };
};

export interface CreateOfficialAdminInput {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    department?: Department;
    authorityLevel?: AuthorityLevel;
    dutyStatus?: DutyStatus;
    isAuthorityAdmin?: boolean;
    customRoleId?: string;
}

export const createAuthorityOrAdmin = async (input: CreateOfficialAdminInput) => {
    const {
        name,
        email,
        password,
        role = 'Authority',
        department = 'General Administration',
        authorityLevel = 'Junior',
        dutyStatus = 'On Duty',
        isAuthorityAdmin = false,
        customRoleId
    } = input;

    if (!name || !email || !password) {
        throw new ApiError(400, 'Name, email, and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
        throw new ApiError(409, 'An account with this email already exists');
    }

    let resolvedPermissions: string[] = [];
    let resolvedCustomRole: mongoose.Types.ObjectId | null = null;
    if (customRoleId) {
        const roleDoc = await Role.findById(customRoleId);
        if (!roleDoc) {
            throw new ApiError(404, 'Selected role not found');
        }
        resolvedCustomRole = roleDoc._id;
        resolvedPermissions = [...roleDoc.permissions];
    } else if (isAuthorityAdmin) {
        resolvedPermissions = ['manage_all_departments', 'manage_members', 'assign_tasks', 'resolve_tasks', 'escalate_tasks', 'view_analytics'];
    }

    const created = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        department: role === 'Admin' ? 'Master Admin' : department,
        authorityLevel: role === 'Admin' ? 'HOD' : authorityLevel,
        dutyStatus,
        isActive: true,
        isBanned: false,
        isAuthorityAdmin: role === 'Admin' || Boolean(isAuthorityAdmin),
        customRole: resolvedCustomRole,
        permissions: resolvedPermissions,
        anonymousId: User.generateAnonymousId()
    });

    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().to('admin_room').emit('stats_update', { type: 'new_user', role: created.role });
    } catch (e) {
        console.error('Socket error on admin create user', e);
    }

    return User.findById(created._id)
        .populate('customRole', 'name slug scope permissions')
        .select('-password -refreshToken');
};

export const toggleMemberStatus = async (
    memberId: string,
    payload: { isActive?: boolean; isBanned?: boolean },
    actorId: string
) => {
    if (memberId === actorId) {
        throw new ApiError(400, 'You cannot disable or block your own active administrator account');
    }

    const user = await User.findById(memberId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (typeof payload.isActive === 'boolean') {
        user.isActive = payload.isActive;
    }
    if (typeof payload.isBanned === 'boolean') {
        user.isBanned = payload.isBanned;
        if (!payload.isBanned) {
            user.banUntil = null;
        }
    }

    if (user.isActive === false || user.isBanned) {
        user.refreshToken = undefined;
    }

    await user.save({ validateBeforeSave: false });

    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().to('admin_room').emit('user_updated', { _id: user._id, isActive: user.isActive, isBanned: user.isBanned });
    } catch (e) {
        console.error('Socket error on status toggle', e);
    }

    return User.findById(user._id)
        .populate('customRole', 'name slug scope permissions')
        .select('-password -refreshToken');
};

export const generateTemporaryPassword = (): string => {
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `Civic@${token}`;
};

export const resetMemberPasswordOneClick = async (memberId: string) => {
    const user = await User.findById(memberId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const temporaryPassword = generateTemporaryPassword();
    user.password = temporaryPassword;
    user.refreshToken = undefined;
    await user.save();

    return {
        memberId: user._id.toString(),
        name: user.name || user.email,
        email: user.email,
        anonymousId: User.decryptIdentity(user.anonymousId) || user.anonymousId,
        temporaryPassword
    };
};

export const getRoles = async () => {
    const roles = await Role.find().sort({ isSystem: -1, scope: 1, name: 1 });
    const roleIds = roles.map((r) => r._id);
    const usageCounts = await User.aggregate<{ _id: unknown; count: number }>([
        { $match: { customRole: { $in: roleIds } } },
        { $group: { _id: '$customRole', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(usageCounts.map((u) => [String(u._id), u.count]));

    return {
        roles: roles.map((r) => ({
            ...r.toObject(),
            assignedCount: countMap.get(r._id.toString()) || 0
        })),
        availablePermissions: [...SYSTEM_PERMISSIONS]
    };
};

export const createRole = async (input: {
    name?: string;
    scope?: RoleScope;
    description?: string;
    permissions?: string[];
}) => {
    const { name, scope = 'Authority', description = '', permissions = [] } = input;
    if (!name || !name.trim()) {
        throw new ApiError(400, 'Role name is required');
    }

    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const existing = await Role.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
        throw new ApiError(409, 'A role with this name already exists');
    }

    return Role.create({
        name: name.trim(),
        slug,
        scope,
        description,
        permissions,
        isSystem: false,
        isActive: true
    });
};

export const updateRole = async (
    roleId: string,
    updates: { name?: string; scope?: RoleScope; description?: string; permissions?: string[]; isActive?: boolean }
) => {
    const role = await Role.findById(roleId);
    if (!role) {
        throw new ApiError(404, 'Role not found');
    }

    if (updates.name && updates.name.trim()) {
        role.name = updates.name.trim();
        role.slug = updates.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (updates.scope) role.scope = updates.scope;
    if (typeof updates.description === 'string') role.description = updates.description;
    if (Array.isArray(updates.permissions)) role.permissions = updates.permissions;
    if (typeof updates.isActive === 'boolean') role.isActive = updates.isActive;

    await role.save();

    if (Array.isArray(updates.permissions)) {
        await User.updateMany(
            { customRole: role._id },
            {
                $set: {
                    permissions: role.permissions,
                    isAuthorityAdmin: role.permissions.includes('manage_all_departments')
                }
            }
        );
    }

    return role;
};

export const deleteRole = async (roleId: string) => {
    const role = await Role.findById(roleId);
    if (!role) {
        throw new ApiError(404, 'Role not found');
    }
    if (role.isSystem) {
        throw new ApiError(400, 'System built-in roles cannot be deleted');
    }

    await User.updateMany({ customRole: role._id }, { $set: { customRole: null } });
    await Role.findByIdAndDelete(roleId);
};

export const assignMemberRole = async (
    memberId: string,
    input: { customRoleId?: string | null; permissions?: string[]; isAuthorityAdmin?: boolean }
) => {
    const user = await User.findById(memberId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (input.customRoleId) {
        const role = await Role.findById(input.customRoleId);
        if (!role) {
            throw new ApiError(404, 'Role not found');
        }
        user.customRole = role._id;
        user.permissions = input.permissions ?? role.permissions;
        if (role.scope === 'Admin') {
            user.role = 'Admin';
        } else if (role.scope === 'Authority') {
            user.role = 'Authority';
        }
        user.isAuthorityAdmin = user.permissions.includes('manage_all_departments');
    } else if (input.customRoleId === null) {
        user.customRole = null;
        if (Array.isArray(input.permissions)) {
            user.permissions = input.permissions;
        }
    }

    if (typeof input.isAuthorityAdmin === 'boolean') {
        user.isAuthorityAdmin = input.isAuthorityAdmin;
        if (input.isAuthorityAdmin && !user.permissions.includes('manage_all_departments')) {
            user.permissions.push('manage_all_departments');
        }
    }

    await user.save({ validateBeforeSave: false });
    return User.findById(user._id)
        .populate('customRole', 'name slug scope permissions')
        .select('-password -refreshToken');
};

export const getDepartmentsOverview = async () => {
    await ensureDefaultDepartments();
    const departments = await DepartmentModel.find().sort({ name: 1 }).lean();

    const [allOfficials, openComplaints, resolvedByCat] = await Promise.all([
        User.find({ role: 'Authority' })
            .select('_id name email authorityLevel department dutyStatus isActive isBanned isAuthorityAdmin lastSeenAt')
            .lean(),
        Complaint.find({ status: { $nin: ['Resolved', 'Closed', 'Rejected'] } })
            .select('_id category status priority assignedTo escalationLevel createdAt')
            .lean(),
        Complaint.aggregate<{ _id: string; count: number }>([
            { $match: { status: { $in: ['Resolved', 'Closed'] } } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ])
    ]);

    const resolvedMap = new Map(resolvedByCat.map((r) => [r._id, r.count]));
    const activeByOfficial = new Map<string, number>();
    for (const c of openComplaints) {
        if (c.assignedTo) {
            const key = String(c.assignedTo);
            activeByOfficial.set(key, (activeByOfficial.get(key) || 0) + 1);
        }
    }

    const enriched = departments.map((dept) => {
        const categories = dept.categories?.length > 0 ? dept.categories : getCategoriesForDepartment(dept.name);
        const deptOfficials = allOfficials.filter((o) => o.department === dept.name);
        const activeOfficials = deptOfficials.filter((o) => o.isActive !== false && !o.isBanned);
        const presentOfficials = activeOfficials.filter((o) => (o.dutyStatus || 'On Duty') === 'On Duty');

        const deptOpen = openComplaints.filter((c) => categories.includes(c.category));
        const unassignedTasks = deptOpen.filter((c) => !c.assignedTo).length;
        const escalatedTasks = deptOpen.filter((c) => c.escalationLevel === 'Senior' || c.escalationLevel === 'HOD').length;
        const resolvedTasks = categories.reduce((sum, cat) => sum + (resolvedMap.get(cat) || 0), 0);

        return {
            ...dept,
            categories,
            stats: {
                totalOfficials: deptOfficials.length,
                activeOfficials: activeOfficials.length,
                presentCount: presentOfficials.length,
                offDutyCount: activeOfficials.length - presentOfficials.length,
                juniorCount: deptOfficials.filter((o) => o.authorityLevel === 'Junior').length,
                seniorCount: deptOfficials.filter((o) => o.authorityLevel === 'Senior').length,
                hodCount: deptOfficials.filter((o) => o.authorityLevel === 'HOD').length,
                activeTasks: deptOpen.length,
                unassignedTasks,
                escalatedTasks,
                resolvedTasks
            },
            employees: deptOfficials.map((o) => ({
                ...o,
                isActive: o.isActive !== false,
                dutyStatus: o.dutyStatus || 'On Duty',
                activeTasks: activeByOfficial.get(String(o._id)) || 0
            }))
        };
    });

    return {
        departments: enriched,
        totals: {
            departmentsCount: enriched.length,
            totalOfficials: allOfficials.length,
            presentOfficials: allOfficials.filter((o) => o.isActive !== false && !o.isBanned && (o.dutyStatus || 'On Duty') === 'On Duty').length,
            openTasks: openComplaints.length,
            unassignedTasks: openComplaints.filter((c) => !c.assignedTo).length
        }
    };
};

export const createDepartment = async (input: {
    name?: string;
    code?: string;
    categories?: string[];
    description?: string;
}) => {
    const { name, code, categories = [], description = '' } = input;
    if (!name || !code) {
        throw new ApiError(400, 'Department name and code are required');
    }
    return DepartmentModel.create({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        categories,
        description,
        isActive: true
    });
};

export const updateDepartment = async (
    departmentId: string,
    updates: { name?: string; code?: string; categories?: string[]; description?: string; isActive?: boolean }
) => {
    const dept = await DepartmentModel.findByIdAndUpdate(departmentId, updates, { new: true });
    if (!dept) {
        throw new ApiError(404, 'Department not found');
    }
    return dept;
};

export const getAdminTasks = async (filters: {
    department?: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    escalationLevel?: string;
    search?: string;
}) => {
    const query: Record<string, unknown> = {};

    if (filters.department && filters.department !== 'All') {
        const cats = getCategoriesForDepartment(filters.department);
        if (cats.length > 0) {
            query.category = { $in: cats };
        }
    }

    if (filters.assignedTo === 'unassigned') {
        query.assignedTo = null;
    } else if (filters.assignedTo && filters.assignedTo !== 'All') {
        query.assignedTo = filters.assignedTo;
    }

    if (filters.status && filters.status !== 'All') {
        if (filters.status === 'Open') {
            query.status = { $nin: ['Resolved', 'Closed', 'Rejected'] };
        } else {
            query.status = filters.status;
        }
    }

    if (filters.priority && filters.priority !== 'All') {
        query.priority = filters.priority;
    }

    if (filters.escalationLevel && filters.escalationLevel !== 'All') {
        query.escalationLevel = filters.escalationLevel;
    }

    if (filters.search && filters.search.trim()) {
        const rx = new RegExp(filters.search.trim(), 'i');
        query.$or = [
            { category: rx },
            { description: rx },
            { 'address.fullAddress': rx }
        ];
    }

    const [tasks, officials, openCounts] = await Promise.all([
        Complaint.find(query)
            .sort({ createdAt: -1 })
            .limit(200)
            .populate('assignedTo', 'name email department authorityLevel dutyStatus isActive isBanned'),
        User.find({ role: 'Authority' })
            .sort({ department: 1, authorityLevel: 1, name: 1 })
            .select('_id name email department authorityLevel dutyStatus isActive isBanned isAuthorityAdmin')
            .lean(),
        Complaint.aggregate<{ _id: unknown; count: number }>([
            {
                $match: {
                    assignedTo: { $ne: null },
                    status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
                }
            },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
        ])
    ]);

    const openMap = new Map(openCounts.map((row) => [String(row._id), row.count]));

    const employees = officials.map((o) => ({
        ...o,
        isActive: o.isActive !== false,
        dutyStatus: o.dutyStatus || 'On Duty',
        activeTasks: openMap.get(String(o._id)) || 0
    }));

    return {
        tasks,
        employees,
        summary: {
            totalMatched: tasks.length,
            unassignedCount: tasks.filter((t) => !t.assignedTo).length,
            presentEmployees: employees.filter((e) => e.isActive && !e.isBanned && e.dutyStatus === 'On Duty').length,
            totalEmployees: employees.length
        }
    };
};

export const assignAdminTask = async (
    complaintId: string,
    assigneeId: string | null | undefined,
    actor: AuthenticatedUser
) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, 'Complaint not found');
    }

    if (!assigneeId || assigneeId === 'unassigned') {
        complaint.assignedTo = null;
        if (complaint.status === 'Assigned') {
            complaint.status = 'Verified';
        }
        complaint.lastActivityAt = new Date();
        complaint.officialReplies.push({
            authorityName: actor.name || 'Super Admin',
            content: 'Task returned to department unassigned queue by Administrator.'
        });
        await complaint.save();
        return Complaint.findById(complaint._id).populate('assignedTo', 'name email department authorityLevel dutyStatus');
    }

    const assignee = await User.findById(assigneeId);
    if (!assignee || assignee.role !== 'Authority') {
        throw new ApiError(404, 'Target official not found');
    }
    if (assignee.isActive === false || assignee.isBanned) {
        throw new ApiError(400, 'Cannot assign task to a disabled or blocked official');
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

    complaint.assignedTo = assignee._id;
    if (complaint.status === 'Submitted' || complaint.status === 'Verified') {
        complaint.status = 'Assigned';
    }
    complaint.lastActivityAt = new Date();
    complaint.officialReplies.push({
        authorityName: actor.name || 'Super Admin',
        content: `Task assigned to ${assignee.name} (${assignee.department} · ${assignee.authorityLevel}) by Administrator.`
    });

    await complaint.save();

    try {
        await notificationService.createNotification({
            recipient: assignee._id.toString(),
            sender: actor._id,
            title: 'Task Assigned by Admin',
            message: `Admin assigned a ${complaint.category} issue to you.`,
            type: 'Task Assigned',
            priority: 'High',
            complaint: complaint._id,
            actionUrl: '/authority/tasks'
        });
    } catch (e) {
        console.error('Notification error on admin assign task', e);
    }

    return Complaint.findById(complaint._id).populate('assignedTo', 'name email department authorityLevel dutyStatus');
};

export const getEscalationSettings = async () => {
    const doc = await getGlobalSystemSettings();
    return doc.escalationRules;
};

export const updateEscalationSettings = async (updates: {
    juniorToSeniorDays?: number;
    seniorToHodDays?: number;
    autoAssignEnabled?: boolean;
}) => {
    const doc = await getGlobalSystemSettings();

    if (typeof updates.juniorToSeniorDays === 'number') {
        if (updates.juniorToSeniorDays < 1 || updates.juniorToSeniorDays > 60) {
            throw new ApiError(400, 'Junior -> Senior escalation must be between 1 and 60 days');
        }
        doc.escalationRules.juniorToSeniorDays = updates.juniorToSeniorDays;
    }

    if (typeof updates.seniorToHodDays === 'number') {
        if (updates.seniorToHodDays < 2 || updates.seniorToHodDays > 120) {
            throw new ApiError(400, 'Senior -> HOD escalation must be between 2 and 120 days');
        }
        doc.escalationRules.seniorToHodDays = updates.seniorToHodDays;
    }

    if (doc.escalationRules.seniorToHodDays <= doc.escalationRules.juniorToSeniorDays) {
        throw new ApiError(400, 'HOD escalation days must be greater than Senior escalation days');
    }

    if (typeof updates.autoAssignEnabled === 'boolean') {
        doc.escalationRules.autoAssignEnabled = updates.autoAssignEnabled;
    }

    await doc.save();
    return doc.escalationRules;
};

export const triggerEscalationSweepNow = async () => {
    return runEscalationSweep(new Date());
};

export const getAllComplaints = async (page: number, limit: number, search?: string) => {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (search && search.trim()) {
        const rx = new RegExp(search.trim(), 'i');
        query.$or = [
            { category: rx },
            { description: rx },
            { 'address.fullAddress': rx }
        ];
    }

    const complaints = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'name department authorityLevel dutyStatus');

    const total = await Complaint.countDocuments(query);

    return {
        complaints,
        totalPages: Math.max(1, Math.ceil(total / limit)),
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
        .select('category description status priority reportCount location');
    const totalPending = await Complaint.countDocuments({
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
    });

    const prompt = `
        You are CivicPulse AI, an advanced AI assistant for municipal administrators.
        Analyze the following recent platform data and provide:
        1. An overall health summary (1 short paragraph).
        2. Potential anomalies, duplicate clusters, or bottlenecks.
        3. Recommended actions or hotspots to prioritize.

        Platform Data:
        Total Active Complaints: ${totalPending}
        Recent 10 Complaints: ${JSON.stringify(recentComplaints)}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
};

export const getMemberDetails = async (memberId: string) => {
    const member = await User.findById(memberId)
        .populate('customRole', 'name slug scope permissions')
        .select('-password -refreshToken');
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
        const plainCurrent = User.decryptIdentity(member.anonymousId) || member.anonymousId;
        const plainPast = (member.pastAnonymousIds || [])
            .map((id) => User.decryptIdentity(id))
            .filter((id): id is string => Boolean(id));
        const ids = [plainCurrent, ...plainPast, memberId];

        activeTasks = await Complaint.find({
            $or: [{ reportedBy: { $in: ids } }, { coReporters: { $in: ids } }],
            status: { $nin: ['Resolved', 'Closed', 'Rejected'] }
        }).sort({ createdAt: -1 });

        completedTasks = await Complaint.find({
            $or: [{ reportedBy: { $in: ids } }, { coReporters: { $in: ids } }],
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
    dutyStatus?: DutyStatus;
    isAuthorityAdmin?: boolean;
    customRole?: string | null;
    permissions?: string[];
    isActive?: boolean;
    isBanned?: boolean;
}

export const updateUser = async (memberId: string, updates: UpdateUserInput) => {
    const {
        name,
        email,
        role,
        department,
        authorityLevel,
        dutyStatus,
        isAuthorityAdmin,
        customRole,
        permissions,
        isActive,
        isBanned
    } = updates;

    const user = await User.findById(memberId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) {
        user.role = role;
        if (role === 'Citizen') {
            user.department = undefined;
            user.authorityLevel = undefined;
            user.isAuthorityAdmin = false;
        }
    }
    if (department && user.role === 'Authority') user.department = department;
    if (authorityLevel && user.role === 'Authority') user.authorityLevel = authorityLevel;
    if (dutyStatus && user.role === 'Authority') user.dutyStatus = dutyStatus;
    if (typeof isAuthorityAdmin === 'boolean') user.isAuthorityAdmin = isAuthorityAdmin;
    if (Array.isArray(permissions)) user.permissions = permissions;
    if (customRole) {
        const roleDoc = await Role.findById(customRole);
        if (roleDoc) {
            user.customRole = roleDoc._id;
            user.permissions = roleDoc.permissions;
            user.isAuthorityAdmin = roleDoc.permissions.includes('manage_all_departments');
        }
    } else if (customRole === null) {
        user.customRole = null;
    }
    if (typeof isActive === 'boolean') {
        user.isActive = isActive;
        if (!isActive) user.refreshToken = undefined;
    }
    if (typeof isBanned === 'boolean') {
        user.isBanned = isBanned;
        if (isBanned) user.refreshToken = undefined;
    }

    await user.save({ validateBeforeSave: false });

    try {
        const { getIo } = await import('../../config/socket.js');
        getIo().to('admin_room').emit('user_updated', user);
    } catch (e) {
        console.error("Socket error on user update", e);
    }

    return User.findById(user._id)
        .populate('customRole', 'name slug scope permissions')
        .select('-password -refreshToken');
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
