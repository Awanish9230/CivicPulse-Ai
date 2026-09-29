import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/uploadmiddleware.js";
import { 
    createAuthorityMember, 
    getAuthorityMembers,
    getTasks,
    getAnalytics,
    escalateTask,
    updateTask,
    assignTask,
    getDepartmentMembers,
    getEmployeeReport
} from "./authority.controller.js";

const router = Router();

router.post("/create", verifyJWT, createAuthorityMember);
router.get("/members", verifyJWT, getAuthorityMembers);

router.get("/department-members", verifyJWT, getDepartmentMembers);
router.get("/employee-report/:employeeId", verifyJWT, getEmployeeReport);

router.get("/tasks", verifyJWT, getTasks);
router.get("/analytics", verifyJWT, getAnalytics);
router.post("/tasks/:complaintId/escalate", verifyJWT, escalateTask);
router.post("/tasks/:complaintId/assign", verifyJWT, assignTask);
router.patch("/tasks/:complaintId", verifyJWT, upload.array('resolutionImages', 5), updateTask);

export default router;
