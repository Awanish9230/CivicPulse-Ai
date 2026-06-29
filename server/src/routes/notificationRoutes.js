import { Router } from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getMyNotifications);
router.post('/mark-read', markAsRead);

export default router;
