import { Router } from "express";
import { getChannelMessages, editMessage, deleteMessage, uploadImage } from "./message.controller.js";
import { verifyJWT, optionalVerifyJWT, checkRestrictedFeature } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/uploadmiddleware.js";

const router = Router();

router.get("/:channel", optionalVerifyJWT, checkRestrictedFeature('community'), getChannelMessages);
router.post("/upload-image", verifyJWT, checkRestrictedFeature('community'), upload.single('image'), uploadImage);
router.put("/:messageId", verifyJWT, checkRestrictedFeature('community'), editMessage);
router.delete("/:messageId", verifyJWT, checkRestrictedFeature('community'), deleteMessage);

export default router;
