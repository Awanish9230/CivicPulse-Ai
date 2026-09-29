import { Router } from 'express';
import { createPetition, getPetitions, toggleUpvote } from './petition.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/uploadmiddleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
    .get(getPetitions)
    .post(upload.single('image'), createPetition);

router.route('/:id/upvote')
    .post(toggleUpvote);

export default router;
