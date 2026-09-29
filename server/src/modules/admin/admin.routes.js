import express from 'express';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';
import { 
    getDashboardStats, 
    getAllCitizens, 
    getAllAuthorities, 
    getAllComplaints,
    getAiInsights,
    getMemberDetails,
    updateUser,
    deleteComplaintAdmin
} from './admin.controller.js';

const router = express.Router();

router.use(verifyJWT);
router.use(authorizeRoles('Admin'));

router.route('/stats').get(getDashboardStats);

router.route('/citizens').get(getAllCitizens);
router.route('/authorities').get(getAllAuthorities);
router.route('/members/:memberId')
    .get(getMemberDetails)
    .put(updateUser);
router.route('/complaints').get(getAllComplaints);
router.route('/complaints/:complaintId').delete(deleteComplaintAdmin);

router.route('/ai/insights').get(getAiInsights);

export default router;
