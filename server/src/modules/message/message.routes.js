import { Router } from "express";
import { getChannelMessages, editMessage, deleteMessage } from "./message.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

// All message routes require authentication
router.get("/:channel", verifyJWT, getChannelMessages);
router.put("/:messageId", verifyJWT, editMessage);
router.delete("/:messageId", verifyJWT, deleteMessage);

export default router;
