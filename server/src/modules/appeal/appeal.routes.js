import { Router } from 'express';
import { submitAppeal, getAppeals, resolveAppeal } from './appeal.controller.js';
import { verifyJWT, verifyAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/submit', verifyJWT, submitAppeal);

router.get('/list', verifyJWT, verifyAdmin, getAppeals);
router.post('/resolve/:id', verifyJWT, verifyAdmin, resolveAppeal);

export default router;
