import { Router } from "express";
import {
  getNotifications,
  acceptInvite,
  rejectInvite,
  confirmAddMember,
  markAsRead,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getNotifications);
router.post("/:id/accept", acceptInvite);
router.post("/:id/reject", rejectInvite);
router.post("/:id/confirm-add", confirmAddMember);
router.post("/:id/read", markAsRead);

export default router;
