import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/uploadmiddleware.js";
import {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    upvoteComplaint,
    resolveComplaint
} from "../controllers/complainController.js";

const router = Router();

// Citizen Routes
router.post("/:complaintId/upvote", verifyJWT, upvoteComplaint);
router.post("/:complaintId/resolve", verifyJWT, resolveComplaint);
router.post(
    "/create",
    verifyJWT,
    upload.array("images", 5),
    createComplaint
);

router.get(
    "/my-complaints",
    verifyJWT,
    getMyComplaints
);

// Authority Routes (can add role middleware later)
router.get(
    "/all",
    getAllComplaints
);

export default router;