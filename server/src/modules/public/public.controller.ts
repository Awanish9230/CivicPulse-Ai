import { Request, Response } from 'express';
import asyncHandler from '../../utils/asynchandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as publicService from './public.service.js';

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await publicService.getPlatformStats();
    return res.status(200).json(new ApiResponse(200, stats, "Platform stats fetched successfully"));
});

export const getCategoryStats = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await publicService.getCategoryStats();
    return res.status(200).json(new ApiResponse(200, categories, "Category stats fetched successfully"));
});

export const getPublicMapData = asyncHandler(async (_req: Request, res: Response) => {
    const complaints = await publicService.getPublicMapData();
    return res.status(200).json(new ApiResponse(200, complaints, "Map data fetched successfully"));
});

export const getRecentReports = asyncHandler(async (_req: Request, res: Response) => {
    const recent = await publicService.getRecentReports();
    return res.status(200).json(new ApiResponse(200, recent, "Recent reports fetched successfully"));
});

export const getLeaderboard = asyncHandler(async (_req: Request, res: Response) => {
    const leaderboard = await publicService.getLeaderboard();
    return res.status(200).json(new ApiResponse(200, leaderboard, "Leaderboard fetched successfully"));
});

export const getLiveActivity = asyncHandler(async (_req: Request, res: Response) => {
    const activity = await publicService.getLiveActivity();
    return res.status(200).json(new ApiResponse(200, activity, "Live activity fetched successfully"));
});

export const getPublicPetitions = asyncHandler(async (_req: Request, res: Response) => {
    const petitions = await publicService.getPublicPetitions();
    return res.status(200).json(new ApiResponse(200, petitions, "Public petitions fetched successfully"));
});
