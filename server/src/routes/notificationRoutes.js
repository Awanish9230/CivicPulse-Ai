import { Router } from 'express';
import { 
    getMyNotifications, 
    markAsRead, 
    markAllAsRead, 
    getUnreadCount, 
    deleteNotification, 
    deleteAllNotifications 
} from '../controllers/notificationController.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/', deleteAllNotifications);
router.delete('/:id', deleteNotification);

export default router;
