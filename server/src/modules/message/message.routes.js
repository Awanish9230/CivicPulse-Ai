import { Router } from "express";
import { getChannelMessages } from "./message.controller.js";

const router = Router();

// Routes
router.get("/:channel", getChannelMessages);

export default router;
