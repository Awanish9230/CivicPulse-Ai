import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    registerUser,
    loginUser,
    logoutUser,
    rotateAnonymousId,
    getMe
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

// Public Routes
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

// Protected Routes
router.post("/logout", verifyJWT, logoutUser);
router.post("/rotate-anonymous-id", verifyJWT, authLimiter, rotateAnonymousId);
router.get("/me", verifyJWT, getMe);

export default router;