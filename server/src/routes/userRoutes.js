import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    rotateAnonymousId
} from "../controllers/userContoller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected Routes
router.post("/logout", verifyJWT, logoutUser);
router.post("/rotate-anonymous-id", verifyJWT, rotateAnonymousId);

export default router;