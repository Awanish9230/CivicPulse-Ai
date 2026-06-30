import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createAuthorityMember, 
    getAuthorityMembers,
    getTasks,
    escalateTask,
    updateTask
} from "../controllers/authorityController.js";

const router = Router();

// Only officer@city.gov can access these (checked in controller/middleware)
router.post("/create", verifyJWT, createAuthorityMember);
router.get("/members", verifyJWT, getAuthorityMembers);

// Authority tasks
router.get("/tasks", verifyJWT, getTasks);
router.post("/tasks/:complaintId/escalate", verifyJWT, escalateTask);
router.patch("/tasks/:complaintId", verifyJWT, updateTask);

export default router;
