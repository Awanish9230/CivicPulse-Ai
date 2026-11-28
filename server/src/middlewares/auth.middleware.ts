import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { UserRole } from "../modules/user/user.model.js";
import type { AuthenticatedUser } from "../types/express.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";

interface AccessTokenPayload extends JwtPayload {
    _id: string;
    anonymousId: string;
    pastAnonymousIds?: string[];
}

export const verifyJWT = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken: AccessTokenPayload;
    try {
        decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as AccessTokenPayload;
    } catch (error) {
        const err = error as Error;
        throw new ApiError(401, err?.message || "Invalid access token");
    }

    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    if (user.isActive === false) {
        throw new ApiError(403, "Your account has been disabled by an administrator.");
    }

    if (user.isBanned && (user.role === 'Authority' || user.role === 'Admin')) {
        throw new ApiError(403, "Your official account has been blocked by an administrator.");
    }

    const authUser = user as unknown as AuthenticatedUser;
    authUser.anonymousId = decodedToken.anonymousId;
    authUser.pastAnonymousIds = decodedToken.pastAnonymousIds || [];
    req.user = authUser;
    next();
});

export const optionalVerifyJWT = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return next();
    }

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as AccessTokenPayload;

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        if (
            !user ||
            user.isActive === false ||
            (user.isBanned && (user.role === 'Authority' || user.role === 'Admin'))
        ) {
            return next();
        }

        const authUser = user as unknown as AuthenticatedUser;
        authUser.anonymousId = decodedToken.anonymousId;
        authUser.pastAnonymousIds = decodedToken.pastAnonymousIds || [];
        req.user = authUser;
    } catch {
        // Proceed anonymously when token is missing, invalid, or expired
    }

    next();
});

export const authorizeRoles = (...roles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError(403, "Access denied. Insufficient permissions."));
        }
        next();
    };
};

export const verifyAdmin = authorizeRoles("Admin");

export const checkRestrictedFeature = (feature: string) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) return next();

        const isPermanentlyBanned = req.user.isBanned;
        const isTemporarilyBanned = req.user.banUntil && new Date(req.user.banUntil).getTime() > Date.now();

        if (isPermanentlyBanned || isTemporarilyBanned) {
            if (req.user.restrictedFeatures && req.user.restrictedFeatures.includes(feature)) {
                return next(new ApiError(403, `You are currently banned from accessing the ${feature} feature. Please submit an appeal.`));
            }
        }
        next();
    };
};
