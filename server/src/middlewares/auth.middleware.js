import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {

    // Get token from cookie or Authorization header
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Verify JWT
    let decodedToken;
    try {
        decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }

    // Find user
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    // Attach user to request
    req.user = user;
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