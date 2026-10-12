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
  updateCurrentUser,
  searchUsers,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  addFriend,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", createUser);
router.get("/me/dashboard", requireAuth, getDashboardData);
router.get("/me/groups", requireAuth, getUserGroups);
router.get("/me/financial-overview", requireAuth, getFinancialOverview);
router.get("/me/recent-activity", requireAuth, getRecentActivity);
router.get("/me/friends", requireAuth, getFriends);
router.get("/me/friend-requests", requireAuth, getFriendRequests);
router.get("/me", requireAuth, getCurrentUser);
router.put("/me", requireAuth, updateCurrentUser);

router.get("/search", requireAuth, searchUsers);
router.post("/friends/request/:targetUserId", requireAuth, sendFriendRequest);
router.post("/friends/cancel/:targetUserId", requireAuth, cancelFriendRequest);
router.post("/friends/accept/:targetUserId", requireAuth, acceptFriendRequest);
router.post("/friends/reject/:targetUserId", requireAuth, rejectFriendRequest);
router.post("/friends/:friendId", requireAuth, addFriend);
router.delete("/friends/:friendId", requireAuth, removeFriend);

router.get("/:id", getUserProfile);
router.put("/:id", updateUserProfile);
router.put("/:id/linked-accounts", updateLinkedAccounts);
router.put("/:id/security", updateSecuritySettings);

export default router;
