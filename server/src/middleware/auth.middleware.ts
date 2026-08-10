import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    clerkId?: string;
  };
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (process.env.NODE_ENV === "development" && !authHeader) {
    req.user = {
      id: req.headers["x-user-id"] as string || "dev_user_123",
      email: "dev@smartsplit.app"
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication token missing or invalid format"
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized access" });
  }

  next();
};
