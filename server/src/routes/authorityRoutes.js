import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/uploadmiddleware.js";
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
} from "../controllers/authorityController.js";

const router = Router();

// Only officer@city.gov can access these (checked in controller/middleware)
router.post("/create", verifyJWT, createAuthorityMember);
router.get("/members", verifyJWT, getAuthorityMembers);

// Department specific
router.get("/department-members", verifyJWT, getDepartmentMembers);
router.get("/employee-report/:employeeId", verifyJWT, getEmployeeReport);

// Authority tasks
router.get("/tasks", verifyJWT, getTasks);
router.get("/analytics", verifyJWT, getAnalytics);
router.post("/tasks/:complaintId/escalate", verifyJWT, escalateTask);
router.post("/tasks/:complaintId/assign", verifyJWT, assignTask);
router.patch("/tasks/:complaintId", verifyJWT, upload.array('resolutionImages', 5), updateTask);

export default router;
