import { Request, Response } from "express";
import { Group } from "../models/Group.js";
import { User } from "../models/User.js";
import { Expense } from "../models/Expense.js";
import { calculateSettlements } from "../utils/debtCalculator.js";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, initialMembers } = req.body;
    const userId = (req as any).user.id;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Group name is required" });
    }

    const currentUser = await User.findById(userId);

    const members = Array.isArray(initialMembers)
      ? initialMembers.map((m: { name: string; email?: string; phone?: string; role?: "admin" | "member" }) => ({
          name: m.name,
          email: m.email || "",
          phone: m.phone || "",
          role: m.role || "member",
          joinedAt: new Date()
        }))
      : [];

    if (currentUser && !members.some(m => m.email === currentUser.email)) {
      members.push({
        name: currentUser.fullName || currentUser.preferredName || "Unknown",
        email: currentUser.email,
        phone: currentUser.phone || "",
        role: "admin",
        joinedAt: new Date()
      });
    }

    const group = await Group.create({
      name,
      description: description || "",
      members,
      createdBy: userId
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

export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { GroupMessage } = await import("../models/GroupMessage.js");
    const messages = await GroupMessage.find({ group: id })
      .sort({ createdAt: 1 })
      .limit(100);

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch group messages" });
  }
};

export const getGroupDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Validate user is in group
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const isMember = group.members.some(m => m.email === user.email || m.phone === user.phone);
    if (!isMember) return res.status(403).json({ error: "Access denied" });

    const expenses = await Expense.find({ group: id }).populate('paidBy', 'fullName email');

    const balancesMap = new Map<string, { name: string, netAmount: number }>();
    let totalShared = 0;

    // Initialize map with all members
    for (const member of group.members) {
      // Find the corresponding User document to use object ID as the key, since Expenses use User IDs.
      const memberUser = await User.findOne({ 
        $or: [
          { email: member.email },
          { phone: member.phone !== "" ? member.phone : "__NONE__" },
          { fullName: member.name }
        ] 
      });
      if (memberUser) {
        balancesMap.set(memberUser._id.toString(), { name: memberUser.fullName || member.name, netAmount: 0 });
      }
    }

    expenses.forEach(exp => {
      totalShared += exp.amount;
      const payerId = exp.paidBy._id.toString();
      
      exp.splits.forEach(split => {
        const splitUserId = split.user.toString();
        
        // Payer is owed this amount by the split user
        if (payerId !== splitUserId) {
          // Payer gains (is owed)
          if (balancesMap.has(payerId)) {
            balancesMap.get(payerId)!.netAmount += split.amount;
          }
          
          // Split user loses (owes)
          if (balancesMap.has(splitUserId)) {
            balancesMap.get(splitUserId)!.netAmount -= split.amount;
          }
        }
      });
    });

    const balances = Array.from(balancesMap.entries()).map(([uid, data]) => ({
      userId: uid,
      name: data.name,
      netAmount: data.netAmount
    }));

    const settlements = calculateSettlements(balances);
    
    // Group Balance Distribution (Owed vs Paid for the specific user)
    let userOwed = 0;
    let userPaid = 0;
    
    expenses.forEach(exp => {
      if (exp.paidBy._id.toString() === userId) {
        userPaid += exp.amount;
      }
      exp.splits.forEach(split => {
        if (split.user.toString() === userId) {
          userOwed += split.amount;
        }
      });
    });

    return res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name,
          category: (group as any).category || 'GENERAL',
          memberCount: group.members.length,
          members: group.members
        },
        balances,
        settlements,
        distribution: {
          totalShared,
          userOwed,
          userPaid
        }
      }
    });

  } catch (error) {
    console.error("Error in getGroupDetails:", error);
    return res.status(500).json({ error: "Failed to fetch group details" });
  }
};
