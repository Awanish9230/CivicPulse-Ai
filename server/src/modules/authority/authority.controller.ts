import { Request, Response } from "express";
import asyncHandler from "../../utils/asynchandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as authorityService from "./authority.service.js";

export const createAuthorityMember = asyncHandler(async (req: Request, res: Response) => {
    const createdUser = await authorityService.createAuthorityMember(req.body, req.user!);

    return res.status(201).json(
        new ApiResponse(201, createdUser, "Authority member created successfully")
    );
});

export const getAuthorityMembers = asyncHandler(async (req: Request, res: Response) => {
    const members = await authorityService.getAuthorityMembers(req.user!);

    return res.status(200).json(
        new ApiResponse(200, members, "Authority members fetched successfully")
    );
});

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
    const complaints = await authorityService.getTasks(req.user!);

    return res.status(200).json(
        new ApiResponse(200, complaints, "Tasks fetched successfully")
    );
});

export const escalateTask = asyncHandler(async (req: Request, res: Response) => {
    const { complaint, nextLevel } = await authorityService.escalateTask(
        req.params.complaintId as string,
        req.user!
    );

    return res.status(200).json(
        new ApiResponse(200, complaint, `Complaint successfully escalated to ${nextLevel}`)
    );
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
    const { status, expectedCompletionDate, gps, testModeBypass, replyMessage } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    const complaint = await authorityService.updateTask(
        req.params.complaintId as string,
        { status, expectedCompletionDate, gps, testModeBypass, replyMessage, files },
        req.user!
    );

    return res.status(200).json(
        new ApiResponse(200, complaint, "Task updated successfully")
    );
});

export const assignTask = asyncHandler(async (req: Request, res: Response) => {
    const complaint = await authorityService.assignTask(
        req.params.complaintId as string,
        req.body.assigneeId,
        req.user!
    );

    return res.status(200).json(
        new ApiResponse(200, complaint, "Task assigned successfully")
    );
});

export const getDepartmentMembers = asyncHandler(async (req: Request, res: Response) => {
    const memberStats = await authorityService.getDepartmentMembers(req.user!);

    return res.status(200).json(
        new ApiResponse(200, memberStats, "Department members fetched successfully")
    );
});

export const getEmployeeReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await authorityService.getEmployeeReport(
        req.params.employeeId as string,
        req.user!
    );

    return res.status(200).json(
        new ApiResponse(200, report, "Employee report generated")
    );
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const complaints = await authorityService.getAnalytics(req.user!);

    return res.status(200).json(
        new ApiResponse(200, complaints, 'Analytics data fetched successfully')
    );
});
