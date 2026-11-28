import { Request, Response } from "express";
import asyncHandler from "../../utils/asynchandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as userService from "./user.service.js";

export const rotateAnonymousId = asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body || {};
    const { anonymousId, accessToken, refreshToken } = await userService.rotateAnonymousId(
        req.user,
        password
    );
    const options = userService.getCookieOptions(true);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { anonymousId }, "Anonymous ID rotated successfully"));
});

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const createdUser = await userService.registerUser(email, password);

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, role = 'Citizen' } = req.body;
    const { user, accessToken, refreshToken } = await userService.loginUser(email, password, role);
    const options = userService.getCookieOptions(true);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user }, "User logged in successfully"));
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    if (req.user) {
        await userService.logoutUser(req.user._id);
    }
    const options = userService.getCookieOptions(false);

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserProfile(req.user!);

    return res.status(200).json(
        new ApiResponse(200, user, "User profile fetched successfully")
    );
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
    const updatedUser = await userService.updateOwnProfile(req.user!, req.body);

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
    };
    const { accessToken, refreshToken } = await userService.changeOwnPassword(
        req.user!,
        currentPassword,
        newPassword
    );
    const options = userService.getCookieOptions(true);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await userService.forgotPassword(email);

    return res.status(200).json(
        new ApiResponse(200, {}, "If that email address is in our database, we will send you an email to reset your password.")
    );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await userService.resetPassword(req.params.token as string, req.body.password);

    return res.status(200).json(new ApiResponse(200, {}, "Password updated successfully"));
});

export const getLeaderboard = asyncHandler(async (_req: Request, res: Response) => {
    const leaderboard = await userService.getCitizenLeaderboard();

    return res.status(200).json(new ApiResponse(200, leaderboard, "Leaderboard fetched successfully"));
});
