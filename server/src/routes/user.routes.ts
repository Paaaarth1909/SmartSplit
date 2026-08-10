import { Router } from "express";
import {
  createUser,
  getUserProfile,
  updateUserProfile,
  updateLinkedAccounts,
  updateSecuritySettings
} from "../controllers/user.controller.js";

const router = Router();

router.post("/", createUser);
router.get("/:id", getUserProfile);
router.put("/:id", updateUserProfile);
router.put("/:id/linked-accounts", updateLinkedAccounts);
router.put("/:id/security", updateSecuritySettings);

export default router;
