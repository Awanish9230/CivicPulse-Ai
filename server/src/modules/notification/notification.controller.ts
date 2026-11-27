import { Request, Response } from 'express';
import asynchandler from '../../utils/asynchandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import notificationService from './notification.service.js';

export const getMyNotifications = asynchandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const { type, unread, timeframe } = req.query as {
        type?: string;
        unread?: string;
        timeframe?: string;
    };

    const data = await notificationService.getMyNotifications(req.user!, {
        page,
        limit,
        type,
        unread,
        timeframe
    });

    return res.status(200).json(new ApiResponse(200, data, 'Notifications fetched successfully'));
});

export const getUnreadCount = asynchandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!);
    return res.status(200).json(new ApiResponse(200, { count }, 'Unread count fetched'));
});

export const markAsRead = asynchandler(async (req: Request, res: Response) => {
    const notification = await notificationService.markAsRead(req.params.id as string, req.user!);
    return res.status(200).json(new ApiResponse(200, notification, 'Marked as read'));
});

export const markAllAsRead = asynchandler(async (req: Request, res: Response) => {
    await notificationService.markAllAsRead(req.user!);
    return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

export const deleteNotification = asynchandler(async (req: Request, res: Response) => {
    await notificationService.deleteNotification(req.params.id as string, req.user!);
    return res.status(200).json(new ApiResponse(200, {}, 'Notification deleted'));
});

export const deleteAllNotifications = asynchandler(async (req: Request, res: Response) => {
    await notificationService.deleteAllNotifications(req.user!);
    res.status(200).json(new ApiResponse(200, null, "All notifications deleted successfully"));
});

export const subscribeToPush = asynchandler(async (req: Request, res: Response) => {
    await notificationService.subscribeToPush(req.user!, req.body.subscription);
    res.status(200).json(new ApiResponse(200, null, "Subscribed to push notifications"));
});

export const unsubscribeFromPush = asynchandler(async (req: Request, res: Response) => {
    await notificationService.unsubscribeFromPush(req.user!, req.body.endpoint);
    res.status(200).json(new ApiResponse(200, null, "Unsubscribed from push notifications"));
});
