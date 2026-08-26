import { Request, Response } from "express";
import { getGroupAnalytics, getUserAnalytics } from "../services/analytics.service.js";

export const fetchGroupAnalytics = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    if (!groupId) {
      return res.status(400).json({ success: false, error: "Group ID is required" });
    }

    const data = await getGroupAnalytics(groupId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Failed to fetch group analytics"
    });
  }
};

export const fetchUserAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const data = await getUserAnalytics(userId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Failed to fetch user analytics"
    });
  }
};
