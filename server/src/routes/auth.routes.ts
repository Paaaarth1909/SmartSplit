import { Router } from "express";
import { register, login, getMe, requestPasswordResetOtp, forgotPassword, exportUsers } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password/request-otp", requestPasswordResetOtp);
router.post("/forgot-password/reset", forgotPassword);
router.get("/me", requireAuth, getMe);
router.get("/export-users", exportUsers);

export default router;
