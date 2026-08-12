import { Request, Response } from "express";
import { Group } from "../models/Group.js";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, initialMembers } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Group name is required" });
    }

    const members = Array.isArray(initialMembers)
      ? initialMembers.map((m: { name: string; email?: string; phone?: string; role?: "admin" | "member" }) => ({
          name: m.name,
          email: m.email || "",
          phone: m.phone || "",
          role: m.role || "member",
          joinedAt: new Date()
        }))
      : [];

    const group = await Group.create({
      name,
      description: description || "",
      members
    });

    return res.status(201).json({ success: true, data: group });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create group" });
  }
};

export const getGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: groups });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch groups" });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json({ success: true, data: group });
  } catch (error) {
    return res.status(500).json({ error: "Invalid group ID or server error" });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Member name is required" });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const newMember = {
      name,
      email: email || "",
      phone: phone || "",
      role: (role === "admin" ? "admin" : "member") as "admin" | "member",
      joinedAt: new Date()
    };

    group.members.push(newMember);
    await group.save();

    return res.status(200).json({ success: true, data: group });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add member to group" });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const initialLength = group.members.length;
    group.members = group.members.filter(
      (member) => member._id && member._id.toString() !== memberId
    );

    if (group.members.length === initialLength) {
      return res.status(404).json({ error: "Member not found in group" });
    }

    await group.save();

    return res.status(200).json({ success: true, data: group });
  } catch (error) {
    return res.status(500).json({ error: "Failed to remove member from group" });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedGroup = await Group.findByIdAndDelete(id);
    if (!deletedGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.status(200).json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete group" });
  }
};
