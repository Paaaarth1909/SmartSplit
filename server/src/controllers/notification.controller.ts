import { Request, Response } from "express";
import { Notification } from "../models/Notification.js";
import { Group } from "../models/Group.js";
import { User } from "../models/User.js";
import { FriendRequest } from "../models/FriendRequest.js";
import { emitToUser, emitToGroup } from "../socket.js";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const currentUser = await User.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const notifications = await Notification.find({ recipient: currentUser._id })
      .sort({ createdAt: -1 })
      .populate("sender", "fullName preferredName avatar")
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

    if (notification.status !== "PENDING") {
      return res.status(400).json({ error: "Notification already processed" });
    }

    if (notification.type === "FRIEND_REQUEST") {
      const senderUser = await User.findById(notification.sender);
      if (!senderUser) return res.status(404).json({ error: "Sender user not found" });

      await User.findByIdAndUpdate(currentUser._id, {
        $addToSet: { friends: senderUser._id }
      });
      await User.findByIdAndUpdate(senderUser._id, {
        $addToSet: { friends: currentUser._id }
      });

      await FriendRequest.findOneAndUpdate(
        { sender: senderUser._id, recipient: currentUser._id, status: "PENDING" },
        { status: "ACCEPTED" }
      );

      notification.status = "ACCEPTED";
      notification.read = true;
      await notification.save();

      const acceptedNotif = await Notification.create({
        recipient: senderUser._id,
        sender: currentUser._id,
        type: "FRIEND_ACCEPTED",
        status: "COMPLETED",
        read: false
      });

      const populatedAcceptedNotif = await Notification.findById(acceptedNotif._id)
        .populate("sender", "fullName preferredName avatar");

      emitToUser(senderUser._id.toString(), "notification:new", populatedAcceptedNotif || acceptedNotif);
      emitToUser(senderUser._id.toString(), "friend:status-change", {
        userId: currentUser._id.toString(),
        status: "FRIENDS"
      });
      emitToUser(currentUser._id.toString(), "friend:status-change", {
        userId: senderUser._id.toString(),
        status: "FRIENDS"
      });

      return res.json({ success: true, message: "Friend request accepted" });
    }

    if (notification.type === "GROUP_INVITE") {
      const group = await Group.findById(notification.group);
      if (!group) return res.status(404).json({ error: "Group not found" });

      notification.status = "ACCEPTED";
      notification.read = true;
      await notification.save();

      const ownerNotification = await Notification.create({
        recipient: notification.sender,
        sender: currentUser._id,
        group: group._id,
        type: "GROUP_INVITE_ACCEPTED",
        status: "PENDING_ADD",
        read: false
      });

      const populatedOwnerNotif = await Notification.findById(ownerNotification._id)
        .populate("sender", "fullName preferredName avatar")
        .populate("group", "name");

      emitToUser(notification.sender.toString(), "notification:new", populatedOwnerNotif || ownerNotification);

      return res.json({
        success: true,
        message: "Group invitation accepted. Group owner has been notified to add you."
      });
    }

    return res.status(400).json({ error: "Invalid notification type" });
  } catch (error) {
    console.error("Accept invite error:", error);
    return res.status(500).json({ error: "Failed to accept invite" });
  }
};

export const rejectInvite = async (req: Request, res: Response) => {
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

    if (notification.type === "FRIEND_REQUEST") {
      await FriendRequest.findOneAndUpdate(
        { sender: notification.sender, recipient: currentUser._id, status: "PENDING" },
        { status: "REJECTED" }
      );
      emitToUser(notification.sender.toString(), "friend:status-change", {
        userId: currentUser._id.toString(),
        status: "NONE"
      });
      emitToUser(currentUser._id.toString(), "friend:status-change", {
        userId: notification.sender.toString(),
        status: "NONE"
      });
    }

    notification.status = "REJECTED";
    notification.read = true;
    await notification.save();

    return res.json({ success: true, message: "Request declined" });
  } catch (error) {
    console.error("Reject invite error:", error);
    return res.status(500).json({ error: "Failed to reject invite" });
  }
};

export const confirmAddMember = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const { id } = req.params; // Notification ID of GROUP_INVITE_ACCEPTED

    const currentUser = await User.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const notification = await Notification.findById(id);
    if (!notification || notification.recipient.toString() !== currentUser._id.toString()) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.type !== "GROUP_INVITE_ACCEPTED") {
      return res.status(400).json({ error: "Invalid notification type for adding member" });
    }

    if (notification.status === "COMPLETED") {
      return res.status(400).json({ error: "Member has already been added to the group" });
    }

    const group = await Group.findById(notification.group);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const friendUser = await User.findById(notification.sender);
    if (!friendUser) return res.status(404).json({ error: "Friend user not found" });

    const isAuthorized =
      group.createdBy === currentUser._id.toString() ||
      group.members.some(
        (m) =>
          (m.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (m.role === "admin")
      );

    if (!isAuthorized) {
      return res.status(403).json({ error: "Only the group owner/admin can confirm member addition" });
    }

    const isMember = group.members.some(
      (m) => m.email && m.email.toLowerCase() === friendUser.email.toLowerCase()
    );

    if (!isMember) {
      const newMember = {
        name: friendUser.fullName || friendUser.preferredName || "Member",
        email: friendUser.email,
        phone: friendUser.phone || "",
        role: "member" as const,
        joinedAt: new Date(),
      };
      group.members.push(newMember);
      await group.save();

      emitToGroup(group._id.toString(), "member-joined", {
        group: group._id,
        member: newMember,
      });
    }

    notification.status = "COMPLETED";
    notification.read = true;
    await notification.save();

    const joinedNotification = await Notification.create({
      recipient: friendUser._id,
      sender: currentUser._id,
      group: group._id,
      type: "GROUP_JOINED",
      status: "COMPLETED",
      read: false,
    });

    const populatedJoinedNotif = await Notification.findById(joinedNotification._id)
      .populate("sender", "fullName preferredName avatar")
      .populate("group", "name");

    emitToUser(friendUser._id.toString(), "notification:new", populatedJoinedNotif || joinedNotification);

    return res.json({
      success: true,
      message: `${friendUser.fullName} has been added directly to ${group.name}`,
      data: group,
    });
  } catch (error) {
    console.error("Confirm add member error:", error);
    return res.status(500).json({ error: "Failed to confirm member addition" });
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
