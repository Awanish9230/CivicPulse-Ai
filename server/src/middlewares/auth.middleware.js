import jwt from "jsonwebtoken";
import User from "../modules/user/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {

    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }

    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    req.user.anonymousId = decodedToken.anonymousId;
    req.user.pastAnonymousIds = decodedToken.pastAnonymousIds || [];
    next()
});

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError(403, "Access denied. Insufficient permissions."));
        }
        next();
    };
};

export const verifyAdmin = authorizeRoles("Admin");

export const checkRestrictedFeature = (feature) => {
    return (req, res, next) => {
        if (!req.user) return next(new ApiError(401, "Unauthorized"));
        
        const isPermanentlyBanned = req.user.isBanned;
        const isTemporarilyBanned = req.user.banUntil && new Date(req.user.banUntil) > Date.now();
        
        if (isPermanentlyBanned || isTemporarilyBanned) {
            if (req.user.restrictedFeatures && req.user.restrictedFeatures.includes(feature)) {
                return next(new ApiError(403, `You are currently banned from accessing the ${feature} feature. Please submit an appeal.`));
            }
        }
        next();
    };
};