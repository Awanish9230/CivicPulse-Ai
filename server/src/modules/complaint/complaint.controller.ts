import { Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asynchandler.js";
import * as complaintService from "./complaint.service.js";

export const resolveComplaint = asyncHandler(async (req: Request, res: Response) => {
    const complaint = await complaintService.resolveComplaint(req.params.complaintId as string, req.user!);

    return res.status(200).json(
        new ApiResponse(200, complaint, "Complaint resolved and media optimized.")
    );
});

export const addOfficialReply = asyncHandler(async (req: Request, res: Response) => {
    const complaint = await complaintService.addOfficialReply(
        req.params.complaintId as string,
        req.body.content,
        req.user!
    );

    res.status(200).json(new ApiResponse(200, complaint, "Official reply added"));
});

export const createComplaint = asyncHandler(async (req: Request, res: Response) => {
    const { category, description, coordinates, address, language } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    const result = await complaintService.createComplaint(
        { category, description, coordinates, address, language, files },
        req.user!
    );

    if (result.isDuplicate) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    complaint: result.complaint,
                    isDuplicate: true,
                    reportCount: result.reportCount,
                    headline: result.headline,
                    pointsAwarded: result.pointsAwarded,
                    distanceMeters: result.distanceMeters,
                    newlyEarnedBadges: result.newlyEarnedBadges
                },
                `Duplicate issue detected nearby and automatically merged. ${result.headline}!`
            )
        );
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                complaint: result.complaint,
                isDuplicate: false,
                reportCount: result.reportCount,
                headline: result.headline,
                pointsAwarded: result.pointsAwarded,
                newlyEarnedBadges: result.newlyEarnedBadges
            },
            "Complaint submitted successfully"
        )
    );
});

export const checkDuplicatePreview = asyncHandler(async (req: Request, res: Response) => {
    const { category, description, coordinates } = req.body;
    const preview = await complaintService.checkDuplicatePreview({
        category,
        description,
        coordinates
    });

    return res.status(200).json(
        new ApiResponse(200, preview, "Duplicate preview evaluated")
    );
});

export const getMyComplaints = asyncHandler(async (req: Request, res: Response) => {
    const complaints = await complaintService.getMyComplaints(req.user!);

    return res.status(200).json(
        new ApiResponse(200, complaints, "Complaints fetched successfully")
    );
});

export const deleteComplaint = asyncHandler(async (req: Request, res: Response) => {
    await complaintService.deleteComplaint(req.params.complaintId as string, req.user!);

    return res.status(200).json(
        new ApiResponse(200, {}, "Complaint deleted successfully")
    );
});

export const getAllComplaints = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius } = req.query as { lat?: string; lng?: string; radius?: string };
    const complaints = await complaintService.getAllComplaints({ lat, lng, radius }, req.user);

    return res.status(200).json(
        new ApiResponse(200, complaints, "Complaints fetched successfully")
    );
});

export const upvoteComplaint = asyncHandler(async (req: Request, res: Response) => {
    const complaint = await complaintService.upvoteComplaint(req.params.complaintId as string);

    return res.status(200).json(
        new ApiResponse(200, complaint, "Complaint upvoted successfully")
    );
});

export const editComplaint = asyncHandler(async (req: Request, res: Response) => {
    const { category, description } = req.body;
    const complaint = await complaintService.editComplaint(
        req.params.complaintId as string,
        { category, description },
        req.user!
    );

    return res.status(200).json(
        new ApiResponse(200, complaint, "Complaint updated successfully")
    );
});

export const submitResolutionFeedback = asyncHandler(async (req: Request, res: Response) => {
    const { action, comment } = req.body;
    const complaint = await complaintService.submitResolutionFeedback(
        req.params.complaintId as string,
        action,
        comment,
        req.user!
    );

    return res.status(200).json(
        new ApiResponse(200, complaint, 'Feedback submitted successfully')
    );
});

export const analyzeImage = asyncHandler(async (req: Request, res: Response) => {
    const parsed = await complaintService.analyzeImage(req.body.imageBase64);

    return res.status(200).json(new ApiResponse(200, parsed, "Image analyzed successfully"));
});
