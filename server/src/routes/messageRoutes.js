import { Router } from "express";
import { getChannelMessages } from "../controllers/messageController.js";

const router = Router();

// Routes
router.get("/:channel", getChannelMessages);

export default router;
