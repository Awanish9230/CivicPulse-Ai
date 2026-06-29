import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/uploadmiddleware.js";
import {
    createComplaint,
    getMyComplaints,
    deleteComplaint,
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

router.delete(
    "/:complaintId",
    verifyJWT,
    deleteComplaint
);

export default router;