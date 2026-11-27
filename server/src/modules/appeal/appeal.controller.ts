import { Request, Response } from 'express';
import asyncHandler from '../../utils/asynchandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as appealService from './appeal.service.js';

export const submitAppeal = asyncHandler(async (req: Request, res: Response) => {
    const appeal = await appealService.submitAppeal(req.user!._id, req.body.reason);

    return res.status(201).json(new ApiResponse(201, appeal, "Appeal submitted successfully."));
});

export const getAppeals = asyncHandler(async (_req: Request, res: Response) => {
    const appeals = await appealService.getAppeals();

    return res.status(200).json(new ApiResponse(200, appeals, "Appeals fetched successfully."));
});

export const resolveAppeal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, note } = req.body;

    const appeal = await appealService.resolveAppeal(id as string, req.user!._id, status, note);

    return res.status(200).json(new ApiResponse(200, appeal, `Appeal ${status.toLowerCase()} successfully.`));
});
