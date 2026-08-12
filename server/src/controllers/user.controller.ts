import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Group } from "../models/Group.js";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullName, preferredName, email, phone, avatar, clerkId } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: "Full name and email are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const user = await User.create({
      clerkId: clerkId || "",
      fullName,
      preferredName: preferredName || fullName.split(" ")[0],
      email,
      phone: phone || "",
      avatar: avatar || ""
    });

    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create user profile" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalGroups = await Group.countDocuments({
      $or: [
        { "members.email": user.email },
        { "members.phone": user.phone ? user.phone : "__NONE__" }
      ]
    });

    const activeGroups = totalGroups;

    return res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          totalGroups,
          activeGroups
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Invalid user ID or server error" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, preferredName, email, phone, avatar } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (preferredName !== undefined) user.preferredName = preferredName;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

export const updateLinkedAccounts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { venmo, cashApp, paypal, upi } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (venmo) user.linkedAccounts.venmo = { ...user.linkedAccounts.venmo, ...venmo };
    if (cashApp) user.linkedAccounts.cashApp = { ...user.linkedAccounts.cashApp, ...cashApp };
    if (paypal) user.linkedAccounts.paypal = { ...user.linkedAccounts.paypal, ...paypal };
    if (upi) user.linkedAccounts.upi = { ...user.linkedAccounts.upi, ...upi };

    await user.save();
    return res.json({ success: true, data: user.linkedAccounts });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update linked accounts" });
  }
};

export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { twoFactorEnabled, passwordChanged } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (typeof twoFactorEnabled === "boolean") {
      user.security.twoFactorEnabled = twoFactorEnabled;
    }

    if (passwordChanged) {
      user.security.passwordLastChangedAt = new Date();
    }

    await user.save();
    return res.json({ success: true, data: user.security });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update security settings" });
  }
};
