import { Request, Response } from 'express';
import asynchandler from '../../utils/asynchandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import * as adminService from './admin.service.js';
import * as envManagerService from './envManager.service.js';

export const getDashboardStats = asynchandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

export const getAllCitizens = asynchandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const data = await adminService.getAllCitizens(page, limit, search, status);
    return res.status(200).json(new ApiResponse(200, data, "Citizens fetched successfully"));
});

export const getAllAuthorities = asynchandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const search = req.query.search as string | undefined;
    const department = req.query.department as string | undefined;
    const dutyStatus = req.query.dutyStatus as string | undefined;
    const status = req.query.status as string | undefined;

    const data = await adminService.getAllAuthorities(page, limit, search, {
        department,
        dutyStatus,
        status
    });
    return res.status(200).json(new ApiResponse(200, data, "Authorities fetched successfully"));
});

export const createAuthorityOrAdmin = asynchandler(async (req: Request, res: Response) => {
    const created = await adminService.createAuthorityOrAdmin(req.body);
    return res.status(201).json(new ApiResponse(201, created, "Official account created successfully"));
});

export const toggleMemberStatus = asynchandler(async (req: Request, res: Response) => {
    const updated = await adminService.toggleMemberStatus(
        req.params.memberId as string,
        req.body,
        req.user!._id.toString()
    );
    return res.status(200).json(new ApiResponse(200, updated, "Account status updated successfully"));
});

export const resetMemberPasswordOneClick = asynchandler(async (req: Request, res: Response) => {
    const result = await adminService.resetMemberPasswordOneClick(req.params.memberId as string);
    return res.status(200).json(new ApiResponse(200, result, "Password reset successfully"));
});

export const getRoles = asynchandler(async (_req: Request, res: Response) => {
    const data = await adminService.getRoles();
    return res.status(200).json(new ApiResponse(200, data, "Roles fetched successfully"));
});

export const createRole = asynchandler(async (req: Request, res: Response) => {
    const role = await adminService.createRole(req.body);
    return res.status(201).json(new ApiResponse(201, role, "Role created successfully"));
});

export const updateRole = asynchandler(async (req: Request, res: Response) => {
    const role = await adminService.updateRole(req.params.roleId as string, req.body);
    return res.status(200).json(new ApiResponse(200, role, "Role updated successfully"));
});

export const deleteRole = asynchandler(async (req: Request, res: Response) => {
    await adminService.deleteRole(req.params.roleId as string);
    return res.status(200).json(new ApiResponse(200, {}, "Role deleted successfully"));
});

export const assignMemberRole = asynchandler(async (req: Request, res: Response) => {
    const updated = await adminService.assignMemberRole(req.params.memberId as string, req.body);
    return res.status(200).json(new ApiResponse(200, updated, "Role assigned successfully"));
});

export const getDepartmentsOverview = asynchandler(async (_req: Request, res: Response) => {
    const data = await adminService.getDepartmentsOverview();
    return res.status(200).json(new ApiResponse(200, data, "Departments overview fetched successfully"));
});

export const createDepartment = asynchandler(async (req: Request, res: Response) => {
    const dept = await adminService.createDepartment(req.body);
    return res.status(201).json(new ApiResponse(201, dept, "Department created successfully"));
});

export const updateDepartment = asynchandler(async (req: Request, res: Response) => {
    const dept = await adminService.updateDepartment(req.params.departmentId as string, req.body);
    return res.status(200).json(new ApiResponse(200, dept, "Department updated successfully"));
});

export const getAdminTasks = asynchandler(async (req: Request, res: Response) => {
    const { department, assignedTo, status, priority, escalationLevel, search } = req.query as Record<string, string | undefined>;
    const data = await adminService.getAdminTasks({
        department,
        assignedTo,
        status,
        priority,
        escalationLevel,
        search
    });
    return res.status(200).json(new ApiResponse(200, data, "Admin tasks fetched successfully"));
});

export const assignAdminTask = asynchandler(async (req: Request, res: Response) => {
    const updated = await adminService.assignAdminTask(
        req.params.complaintId as string,
        req.body.assigneeId,
        req.user!
    );
    return res.status(200).json(new ApiResponse(200, updated, "Task assignment updated successfully"));
});

export const getEscalationSettings = asynchandler(async (_req: Request, res: Response) => {
    const settings = await adminService.getEscalationSettings();
    return res.status(200).json(new ApiResponse(200, settings, "Escalation rules fetched successfully"));
});

export const updateEscalationSettings = asynchandler(async (req: Request, res: Response) => {
    const settings = await adminService.updateEscalationSettings(req.body);
    return res.status(200).json(new ApiResponse(200, settings, "Escalation rules updated successfully"));
});

export const triggerEscalationSweepNow = asynchandler(async (_req: Request, res: Response) => {
    const summary = await adminService.triggerEscalationSweepNow();
    return res.status(200).json(new ApiResponse(200, summary, "Escalation sweep executed successfully"));
});

export const getAllComplaints = asynchandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string | undefined;

    const data = await adminService.getAllComplaints(page, limit, search);
    return res.status(200).json(new ApiResponse(200, data, "Complaints fetched successfully"));
});

export const getAiInsights = asynchandler(async (_req: Request, res: Response) => {
    try {
        const text = await adminService.generateAiInsights();
        return res.status(200).json(new ApiResponse(200, { aiAnalysis: text }, "AI Insights generated successfully"));
    } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400) {
            return res.status(400).json(new ApiResponse(400, null, error.message));
        }
        console.error("Gemini API Error:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to generate AI insights"));
    }
});

export const getMemberDetails = asynchandler(async (req: Request, res: Response) => {
    const details = await adminService.getMemberDetails(req.params.memberId as string);
    return res.status(200).json(new ApiResponse(200, details, "Member details fetched successfully"));
});

export const updateUser = asynchandler(async (req: Request, res: Response) => {
    const user = await adminService.updateUser(req.params.memberId as string, req.body);
    return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

export const deleteComplaintAdmin = asynchandler(async (req: Request, res: Response) => {
    await adminService.deleteComplaintAdmin(req.params.complaintId as string);
    return res.status(200).json(new ApiResponse(200, {}, "Complaint permanently deleted by Admin"));
});

export const getEnvVariables = asynchandler(async (_req: Request, res: Response) => {
    const data = await envManagerService.listEnvVariables();
    return res.status(200).json(new ApiResponse(200, data, "Environment variables loaded"));
});

export const upsertEnvVariables = asynchandler(async (req: Request, res: Response) => {
    const { key, value, variables } = req.body as {
        key?: string;
        value?: unknown;
        variables?: Array<{ key: string; value: unknown }>;
    };

    if (Array.isArray(variables)) {
        const data = await envManagerService.bulkUpsertEnvVariables(variables);
        return res.status(200).json(new ApiResponse(200, data, "Environment variables updated"));
    }

    if (!key) {
        throw new ApiError(400, "Variable key is required");
    }

    const data = await envManagerService.upsertEnvVariable(key, value);
    return res.status(200).json(new ApiResponse(200, data, `Environment variable ${data.updated.key} saved`));
});

export const deleteEnvVariable = asynchandler(async (req: Request, res: Response) => {
    const data = await envManagerService.deleteEnvVariable(req.params.key as string);
    return res.status(200).json(new ApiResponse(200, data, "Environment variable deleted"));
});
