import { Router } from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  getGroupDetails,
  addMember,
  removeMember,
  deleteGroup,
  getGroupMessages
} from "../controllers/group.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createGroup);
router.get("/", requireAuth, getGroups);
router.get("/:id", requireAuth, getGroupById);
router.get("/:id/details", requireAuth, getGroupDetails);
router.get("/:id/messages", requireAuth, getGroupMessages);
router.delete("/:id", requireAuth, deleteGroup);
router.post("/:id/members", requireAuth, addMember);
router.delete("/:id/members/:memberId", requireAuth, removeMember);

export default router;
