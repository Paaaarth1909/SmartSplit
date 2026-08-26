import { Router } from "express";
import { fetchGroupAnalytics, fetchUserAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.get("/groups/:groupId", fetchGroupAnalytics);
router.get("/users/:userId", fetchUserAnalytics);

export default router;
