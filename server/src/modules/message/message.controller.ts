import { Request, Response } from "express";
import asyncHandler from "../../utils/asynchandler.js";
import * as messageService from "./message.service.js";

export const getChannelMessages = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius } = req.query as { lat?: string; lng?: string; radius?: string };
    const formattedMessages = await messageService.getChannelMessages(
        req.params.channel as string,
        { lat, lng, radius },
        req.user
    );

    res.status(200).json({
        success: true,
        data: formattedMessages,
    });
});

export const editMessage = asyncHandler(async (req: Request, res: Response) => {
    const data = await messageService.editMessage(
        req.params.messageId as string,
        req.body.text,
        req.user!
    );

    res.status(200).json({
        success: true,
        data,
        message: "Message updated successfully"
    });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const data = await messageService.deleteMessage(req.params.messageId as string, req.user!);

    res.status(200).json({
        success: true,
        data,
        message: "Message deleted successfully"
    });
});

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
    const imageUrl = await messageService.uploadChatImage(req.file);

    res.status(200).json({
        success: true,
        data: { imageUrl },
        message: "Image uploaded successfully"
    });
});
