import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/uploadmiddleware.js";
import {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    upvoteComplaint,
    resolveComplaint,
    addOfficialReply,
    editComplaint,
    deleteComplaint
} from "../controllers/complainController.js";

const router = Router();

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 complaints per 15 minutes
    message: { success: false, message: 'Upload limit reached. Please try again after 15 minutes to prevent spam.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Citizen Routes
router.post("/:complaintId/upvote", verifyJWT, upvoteComplaint);
router.post("/:complaintId/resolve", verifyJWT, resolveComplaint);
router.post("/:complaintId/reply", verifyJWT, addOfficialReply);
router.post(
    "/create",
    verifyJWT,
    uploadLimiter,
    upload.array("images", 5),
    createComplaint
);

router.get(
    "/my-complaints",
    verifyJWT,
    getMyComplaints
);

router.patch("/:complaintId", verifyJWT, editComplaint);
router.delete("/:complaintId", verifyJWT, deleteComplaint);

// Authority Routes (can add role middleware later)
router.get(
    "/all",
    getAllComplaints
);

export default router;