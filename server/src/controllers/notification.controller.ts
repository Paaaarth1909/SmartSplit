import { Request, Response } from "express";
import { Notification } from "../models/Notification.js";
import { Group } from "../models/Group.js";
import { User } from "../models/User.js";
import { emitToUser, emitToGroup } from "../socket.js";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const currentUser = await User.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const notifications = await Notification.find({ recipient: currentUser._id })
      .sort({ createdAt: -1 })
      .populate("sender", "fullName avatar email")
      .populate("group", "name");

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const { id } = req.params; // Notification ID

    const currentUser = await User.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const notification = await Notification.findById(id);
    if (!notification || notification.recipient.toString() !== currentUser._id.toString()) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.type !== "GROUP_INVITE" || notification.status !== "PENDING") {
      return res.status(400).json({ error: "Invalid notification type or already processed" });
    }

    const group = await Group.findById(notification.group);
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Add to group
    const isMember = group.members.some(m => m.email && m.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!isMember) {
      const newMember = {
        name: currentUser.fullName || "Member",
        email: currentUser.email,
        phone: currentUser.phone || "",
        role: "member" as const,
        joinedAt: new Date()
      };
      group.members.push(newMember);
      await group.save();

      emitToGroup(group._id.toString(), "member-joined", {
        group: group._id,
        member: newMember
      });
    }

    notification.status = "ACCEPTED";
    await notification.save();

    // Create a GROUP_JOINED notification for the sender
    const joinedNotification = await Notification.create({
      recipient: notification.sender,
      sender: currentUser._id,
      group: group._id,
      type: "GROUP_JOINED",
      status: "ACCEPTED"
    });
    
    emitToUser(notification.sender.toString(), "notification:new", joinedNotification);

    return res.json({ success: true, message: "Invite accepted" });
  } catch (error) {
    console.error("Accept invite error:", error);
    return res.status(500).json({ error: "Failed to accept invite" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const { id } = req.params;
    
    const currentUser = await User.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const notification = await Notification.findById(id);
    if (!notification || notification.recipient.toString() !== currentUser._id.toString()) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    notification.read = true;
    await notification.save();
    
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark as read" });
  }
};
