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
    deleteComplaintAdmin,
    createChiefOfficer
} from './admin.controller.js';

const router = express.Router();

// Apply auth and admin check to all routes in this file
router.use(verifyJWT);
router.use(authorizeRoles('Admin'));

// Dashboard
router.route('/stats').get(getDashboardStats);

// Entities
router.route('/citizens').get(getAllCitizens);
router.route('/authorities').get(getAllAuthorities);
router.route('/members/:memberId')
    .get(getMemberDetails)
    .put(updateUser);
router.route('/complaints').get(getAllComplaints);
router.route('/complaints/:complaintId').delete(deleteComplaintAdmin);

// Chief Officer Lifecycle Management (Admin Only)
router.route('/chief-officer').post(createChiefOfficer);

// AI
router.route('/ai/insights').get(getAiInsights);

export default router;
