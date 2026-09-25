import { Router } from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  getGroupDetails,
  getOrGenerateInviteCode,
  addMember,
  removeMember,
  deleteGroup,
  getGroupMessages,
  joinGroupByCode
} from "../controllers/group.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createGroup);
router.post("/join", requireAuth, joinGroupByCode);
router.get("/", requireAuth, getGroups);
router.get("/:id", requireAuth, getGroupById);
router.get("/:id/details", requireAuth, getGroupDetails);
router.get("/:id/invite-code", requireAuth, getOrGenerateInviteCode);
router.post("/:id/invite-code", requireAuth, getOrGenerateInviteCode);
router.get("/:id/messages", requireAuth, getGroupMessages);
router.delete("/:id", requireAuth, deleteGroup);
router.post("/:id/members", requireAuth, addMember);
router.delete("/:id/members/:memberId", requireAuth, removeMember);

export default router;
