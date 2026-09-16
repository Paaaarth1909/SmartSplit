import { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { User } from "../models/User.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    clerkId?: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);
    
    // In development with no Clerk token, we can fallback to a mock user for testing if needed
    // But since the frontend now passes real Clerk tokens, we should strictly require it.
    if (!auth.userId) {
      return res.status(401).json({ success: false, error: "Unauthorized access - missing or invalid Clerk token" });
    }

    // Sync user with our MongoDB
    let user = await User.findOne({ clerkId: auth.userId });
    
    if (!user) {
      // Fetch user details from Clerk to initialize MongoDB document
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || "User";
      
      user = await User.create({
        clerkId: auth.userId,
        email: email,
        fullName: fullName,
        preferredName: clerkUser.firstName || fullName,
        avatar: clerkUser.imageUrl || ""
      });
    }

    // Attach DB user info to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      clerkId: user.clerkId
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, error: "Authentication failed" });
  }
};
