import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    registerUser,
    loginUser,
    logoutUser,
    rotateAnonymousId,
    getMe,
    forgotPassword,
    resetPassword
} from "../controllers/userContoller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 password reset requests per windowMs
    message: { success: false, message: 'Too many password reset requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public Routes
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, resetPassword);

// Protected Routes
router.post("/logout", verifyJWT, logoutUser);
router.post("/rotate-anonymous-id", verifyJWT, authLimiter, rotateAnonymousId);
router.get("/me", verifyJWT, getMe);

export default router;