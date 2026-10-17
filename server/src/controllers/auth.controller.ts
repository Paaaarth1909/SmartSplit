import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { sendOtpEmail } from "../services/email.service.js";
import { recordFailedLogin, clearFailedLogin } from "../middleware/rateLimit.middleware.js";

const sanitizeText = (str: string): string => {
  return (str || "").replace(/<[^>]*>?/gm, "").trim();
};

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone, avatar } = req.body;

    const cleanFullName = sanitizeText(fullName);
    if (!cleanFullName || cleanFullName.length < 2 || cleanFullName.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Full name must be between 2 and 50 characters (HTML tags not allowed)",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: "Invalid email address format" });
    }

    let cleanPhone = "";
    if (phone && String(phone).trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(String(phone).trim())) {
        return res.status(400).json({
          success: false,
          error: "Invalid phone number format. Please provide a valid phone number (digits, optional leading +).",
        });
      }
      cleanPhone = String(phone).trim();
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists",
      });
    }

    const preferredName = cleanFullName.split(" ")[0];

    const newUser = await User.create({
      fullName: cleanFullName,
      preferredName,
      email: normalizedEmail,
      password,
      phone: cleanPhone,
      avatar: avatar || "",
      preferences: {
        currency: "INR",
        theme: "dark",
        compactDensity: false,
        liveForex: true,
        acousticFeedback: true,
      },
    });

    const token = generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      fullName: newUser.fullName,
    });

    res.cookie("smartsplit_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id.toString(),
        fullName: newUser.fullName,
        preferredName: newUser.preferredName,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
        preferences: newUser.preferences,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to register user",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      recordFailedLogin(normalizedEmail);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: "This account has no password set. Please reset your password or register again.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      recordFailedLogin(normalizedEmail);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    clearFailedLogin(normalizedEmail);

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    });

    res.cookie("smartsplit_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        preferredName: user.preferredName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to log in",
    });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { lastLogoutAt: new Date() });
    }
    res.clearCookie("smartsplit_auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Logout failed" });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        preferredName: user.preferredName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        preferences: user.preferences,
        linkedAccounts: user.linkedAccounts,
        security: user.security,
      },
    });
  } catch (error: any) {
    console.error("GetMe error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user data",
    });
  }
};

export const requestPasswordResetOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Prevent account enumeration by returning generic success
      return res.json({
        success: true,
        message: "If an account exists with this email address, a password reset code has been sent.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    console.log(`[AUTH] Password reset OTP for ${normalizedEmail} is: ${otp}`);

    const emailResult = await sendOtpEmail(normalizedEmail, otp);

    if (!emailResult.success) {
      console.warn(`[AUTH] Email sending notice for ${normalizedEmail}: ${emailResult.error}`);
    }

    return res.json({
      success: true,
      message: "An OTP has been sent to your email address. Please check your inbox (and spam folder).",
    });
  } catch (error: any) {
    console.error("Request OTP error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process password reset request. Please try again later.",
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    if (!otp || !otp.trim()) {
      return res.status(400).json({ success: false, error: "OTP is required" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "No account found with this email address",
      });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    if (!user.resetPasswordOtpExpiry || user.resetPasswordOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired. Please request a new one.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await User.updateOne({ _id: user._id }, { 
      $set: { password: hashedPassword },
      $unset: { resetPasswordOtp: "", resetPasswordOtpExpiry: "" }
    });

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    });

    return res.json({
      success: true,
      message: "Password reset successful! You are now logged in.",
      token,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        preferredName: user.preferredName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to reset password",
    });
  }
};

export const exportUsers = async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const users = await User.find({}).select("-password").lean();
    const formatted = users.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || "",
      hasPassword: Boolean(u.password),
      preferences: u.preferences,
      linkedAccounts: u.linkedAccounts,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    const exportPath = path.resolve(process.cwd(), "..", "existing_users.json");
    fs.writeFileSync(exportPath, JSON.stringify(formatted, null, 2), "utf-8");

    const mdPath = path.resolve(process.cwd(), "..", "existing_users.md");
    let md = "# Existing SmartSplit Users in MongoDB\n\n";
    md += `*Exported on: ${new Date().toISOString()}*\n\n`;
    md += `**Total Users:** ${formatted.length}\n\n`;
    md += "| Name | Email | Phone | Has Password? | Created At |\n";
    md += "| --- | --- | --- | --- | --- |\n";
    for (const u of formatted) {
      md += `| ${u.fullName || "-"} | \`${u.email}\` | ${u.phone || "-"} | ${u.hasPassword ? "✅ Yes" : "❌ No (Needs Reset)"} | ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"} |\n`;
    }
    fs.writeFileSync(mdPath, md, "utf-8");

    return res.json({
      success: true,
      count: formatted.length,
      users: formatted,
      jsonFile: exportPath,
      mdFile: mdPath,
    });
  } catch (error: any) {
    console.error("Export users error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to export users",
    });
  }
};
