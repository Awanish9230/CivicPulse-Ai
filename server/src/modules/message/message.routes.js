import { Router } from "express";
import { getChannelMessages, editMessage, deleteMessage } from "./message.controller.js";
import { verifyJWT, checkRestrictedFeature } from "../../middlewares/auth.middleware.js";

const router = Router();

// Apply community restriction to all message routes
router.use(verifyJWT, checkRestrictedFeature('community'));

router.get("/:channel", getChannelMessages);
router.put("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);

export default router;
