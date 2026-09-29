import { Router } from "express";
import { getChannelMessages, editMessage, deleteMessage, uploadImage } from "./message.controller.js";
import { verifyJWT, checkRestrictedFeature } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/uploadmiddleware.js";

const router = Router();

router.use(verifyJWT, checkRestrictedFeature('community'));

router.get("/:channel", getChannelMessages);
router.post("/upload-image", upload.single('image'), uploadImage);
router.put("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);

export default router;
