import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  requestPasswordResetOtp,
  forgotPassword,
  exportUsers,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  authRateLimiter,
  checkLoginLockout,
} from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, checkLoginLockout, login);
router.post("/logout", requireAuth, logout);
router.post("/forgot-password/request-otp", authRateLimiter, requestPasswordResetOtp);
router.post("/forgot-password/reset", authRateLimiter, forgotPassword);
router.get("/me", requireAuth, getMe);
router.get("/export-users", requireAuth, exportUsers);

export default router;

