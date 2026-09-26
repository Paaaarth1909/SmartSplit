import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone, avatar } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, error: "Full name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: "Invalid email address format" });
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

    const preferredName = fullName.trim().split(" ")[0];

    const newUser = await User.create({
      fullName: fullName.trim(),
      preferredName,
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : "",
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

    // Query user and explicitly include password field
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
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
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
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

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Email is required" });
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

    // Hash password with bcrypt and update directly to prevent legacy subdocument validation issues
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

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

export const exportUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find({}).select("+password").lean();
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

    // Write file to workspace root: c:/SmartSplit/existing_users.json
    const exportPath = path.resolve(process.cwd(), "..", "existing_users.json");
    fs.writeFileSync(exportPath, JSON.stringify(formatted, null, 2), "utf-8");

    // Also write a markdown summary file: c:/SmartSplit/existing_users.md
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

