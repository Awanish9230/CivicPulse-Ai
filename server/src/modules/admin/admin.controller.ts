import { Request, Response } from 'express';
import asynchandler from '../../utils/asynchandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import * as adminService from './admin.service.js';

export const getDashboardStats = asynchandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

export const getAllCitizens = asynchandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string | undefined;

    const data = await adminService.getAllCitizens(page, limit, search);
    return res.status(200).json(new ApiResponse(200, data, "Citizens fetched successfully"));
});

export const getAllAuthorities = asynchandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string | undefined;

    const data = await adminService.getAllAuthorities(page, limit, search);
    return res.status(200).json(new ApiResponse(200, data, "Authorities fetched successfully"));
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
