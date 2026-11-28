import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    registerUser,
    loginUser,
    logoutUser,
    rotateAnonymousId,
    getMe,
    updateMe,
    changePassword,
    forgotPassword,
    resetPassword,
    getLeaderboard
} from "./user.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many password reset requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, resetPassword);

router.post("/logout", verifyJWT, logoutUser);
router.post("/rotate-anonymous-id", verifyJWT, authLimiter, rotateAnonymousId);
router.get("/me", verifyJWT, getMe);
router.patch("/me", verifyJWT, updateMe);
router.post("/change-password", verifyJWT, changePassword);
router.get("/leaderboard", optionalVerifyJWT, getLeaderboard);

export default router;
