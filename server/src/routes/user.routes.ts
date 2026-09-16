import { Router } from "express";
import {
  createUser,
  getUserProfile,
  updateUserProfile,
  updateLinkedAccounts,
  updateSecuritySettings,
  getDashboardData,
  getUserGroups,
  getFinancialOverview,
  getRecentActivity,
  getCurrentUser,
  updateCurrentUser
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", createUser);
router.get("/me/dashboard", requireAuth, getDashboardData);
router.get("/me/groups", requireAuth, getUserGroups);
router.get("/me/financial-overview", requireAuth, getFinancialOverview);
router.get("/me/recent-activity", requireAuth, getRecentActivity);
router.get("/me", requireAuth, getCurrentUser);
router.put("/me", requireAuth, updateCurrentUser);
router.get("/:id", getUserProfile);
router.put("/:id", updateUserProfile);
router.put("/:id/linked-accounts", updateLinkedAccounts);
router.put("/:id/security", updateSecuritySettings);

export default router;
