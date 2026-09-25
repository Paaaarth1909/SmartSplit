import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let user = await User.findOne({});
    
    if (!user) {
      user = await User.create({
        email: "demo@smartsplit.com",
        fullName: "Demo User",
        preferredName: "Demo",
        avatar: ""
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, error: "Authentication failed" });
  }
};
