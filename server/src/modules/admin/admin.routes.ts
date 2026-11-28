import express from 'express';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';
import {
    getDashboardStats,
    getAllCitizens,
    getAllAuthorities,
    createAuthorityOrAdmin,
    toggleMemberStatus,
    resetMemberPasswordOneClick,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    assignMemberRole,
    getDepartmentsOverview,
    createDepartment,
    updateDepartment,
    getAdminTasks,
    assignAdminTask,
    getEscalationSettings,
    updateEscalationSettings,
    triggerEscalationSweepNow,
    getAllComplaints,
    getAiInsights,
    getMemberDetails,
    updateUser,
    deleteComplaintAdmin,
    getEnvVariables,
    upsertEnvVariables,
    deleteEnvVariable
} from './admin.controller.js';

const router = express.Router();

router.use(verifyJWT);
router.use(authorizeRoles('Admin'));

router.route('/stats').get(getDashboardStats);

router.route('/citizens').get(getAllCitizens);
router.route('/authorities')
    .get(getAllAuthorities)
    .post(createAuthorityOrAdmin);

router.route('/members/:memberId')
    .get(getMemberDetails)
    .put(updateUser);
router.route('/members/:memberId/status').patch(toggleMemberStatus);
router.route('/members/:memberId/reset-password').post(resetMemberPasswordOneClick);
router.route('/members/:memberId/role').put(assignMemberRole);

router.route('/roles')
    .get(getRoles)
    .post(createRole);
router.route('/roles/:roleId')
    .put(updateRole)
    .delete(deleteRole);

router.route('/departments')
    .get(getDepartmentsOverview)
    .post(createDepartment);
router.route('/departments/:departmentId').put(updateDepartment);

router.route('/tasks').get(getAdminTasks);
router.route('/tasks/:complaintId/assign').post(assignAdminTask);

router.route('/settings/escalation')
    .get(getEscalationSettings)
    .put(updateEscalationSettings);
router.route('/settings/escalation/run-now').post(triggerEscalationSweepNow);

router.route('/env')
    .get(getEnvVariables)
    .put(upsertEnvVariables);
router.route('/env/:key').delete(deleteEnvVariable);

router.route('/complaints').get(getAllComplaints);
router.route('/complaints/:complaintId').delete(deleteComplaintAdmin);

router.route('/ai/insights').get(getAiInsights);

export default router;
