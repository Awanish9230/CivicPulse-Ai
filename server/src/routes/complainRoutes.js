import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/uploadmiddleware.js";
import {
    createComplaint,
    getMyComplaints,
} from "../controllers/complainController.js";

const router = Router();

// Citizen Routes
router.post(
    "/create",
    verifyJWT,
    upload.single("image"),
    createComplaint
);

router.get(
    "/my-complaints",
    verifyJWT,
    getMyComplaints
);

export default router;