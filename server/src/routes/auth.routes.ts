import { Router } from "express";
import { register, login, getMe, forgotPassword, exportUsers } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/me", requireAuth, getMe);
router.get("/export-users", exportUsers);

export default router;
