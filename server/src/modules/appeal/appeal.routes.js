import { Router } from 'express';
import { submitAppeal, getAppeals, resolveAppeal } from './appeal.controller.js';
import { verifyJWT, verifyAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();

// A banned user can still submit an appeal
router.post('/submit', verifyJWT, submitAppeal);

// Admin routes
router.get('/list', verifyJWT, verifyAdmin, getAppeals);
router.post('/resolve/:id', verifyJWT, verifyAdmin, resolveAppeal);

export default router;
