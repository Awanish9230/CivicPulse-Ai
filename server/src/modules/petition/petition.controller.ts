import { Request, Response } from "express";
import asyncHandler from "../../utils/asynchandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as petitionService from "./petition.service.js";

export const getPetitions = asyncHandler(async (req: Request, res: Response) => {
    const formattedPetitions = await petitionService.getPetitions(req.user);

    res.status(200).json(new ApiResponse(200, formattedPetitions, "Petitions fetched successfully"));
});

export const createPetition = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category } = req.body;
    const petition = await petitionService.createPetition(
        { title, description, category, file: req.file },
        req.user!
    );

    res.status(201).json(new ApiResponse(201, petition, "Petition created successfully"));
});

export const toggleUpvote = asyncHandler(async (req: Request, res: Response) => {
    const result = await petitionService.toggleUpvote(req.params.id as string, req.user!._id);

    res.status(200).json(new ApiResponse(200, result.data, result.message));
});
