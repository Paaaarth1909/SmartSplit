import { Request, Response } from "express";
import { Group, generateInviteCode, ensureGroupInviteCode } from "../models/Group.js";
import { User } from "../models/User.js";
import { Expense } from "../models/Expense.js";
import { calculateSettlements } from "../utils/debtCalculator.js";
import { emitToGroup } from "../socket.js";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, initialMembers, friendIds } = req.body;
    const userId = (req as any).user.id;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Group name is required" });
    }

    const currentUser = await User.findById(userId);

    let members = Array.isArray(initialMembers)
      ? initialMembers.map((m: { name: string; email?: string; phone?: string; role?: "admin" | "member" }) => ({
          name: m.name,
          email: m.email || "",
          phone: m.phone || "",
          role: m.role || "member",
          joinedAt: new Date()
        }))
      : [];

    if (Array.isArray(friendIds) && friendIds.length > 0) {
      const friends = await User.find({ _id: { $in: friendIds } });
      friends.forEach(f => {
        if (!members.some(m => m.email === f.email)) {
          members.push({
            name: f.fullName,
            email: f.email,
            phone: f.phone || "",
            role: "member",
            joinedAt: new Date()
          });
        }
      });
    }

    if (currentUser && !members.some(m => m.email === currentUser.email)) {
      members.push({
        name: currentUser.fullName || currentUser.preferredName || "Unknown",
        email: currentUser.email,
        phone: currentUser.phone || "",
        role: "admin",
        joinedAt: new Date()
      });
    }

    let inviteCode = generateInviteCode();
    let existingCode = await Group.findOne({ inviteCode });
    while (existingCode) {
      inviteCode = generateInviteCode();
      existingCode = await Group.findOne({ inviteCode });
    }

    const group = await Group.create({
      name,
      description: description || "",
      inviteCode,
      members,
      createdBy: userId
    });

    return res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error("Failed to create group:", error);
    return res.status(500).json({ error: "Failed to create group" });
  }
};

export const joinGroupByCode = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = (req as any).user?.id;

    if (!inviteCode || typeof inviteCode !== "string") {
      return res.status(400).json({ success: false, error: "Invite code is required" });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const group = await Group.findOne({ inviteCode: cleanCode });

    if (!group) {
      return res.status(404).json({ success: false, error: "Invalid invite code. Group not found." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const userEmail = (user.email || "").toLowerCase().trim();
    const userPhone = user.phone ? user.phone.trim() : "";

    const isMember = group.members.some((m) => {
      const mEmail = (m.email || "").toLowerCase().trim();
      const mPhone = (m.phone || "").trim();
      if (userEmail && mEmail && mEmail === userEmail) return true;
      if (userPhone && mPhone && mPhone === userPhone) return true;
      return false;
    });

    if (isMember) {
      return res.status(400).json({
        success: false,
        error: "You are already a member of this group.",
        data: group,
      });
    }

    const newMember = {
      name: user.fullName || user.preferredName || "Member",
      email: user.email.toLowerCase().trim(),
      phone: user.phone || "",
      role: "member" as const,
      joinedAt: new Date(),
    };

    group.members.push(newMember);
    await group.save();

    emitToGroup(group._id.toString(), "member-joined", {
      group: group._id,
      member: newMember
    });

    return res.status(200).json({
      success: true,
      message: `Successfully joined ${group.name}!`,
      data: group,
    });
  } catch (error: any) {
    console.error("Join group error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to join group" });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = ((req as any).user.email || "").toLowerCase().trim();
    const userPhone = (req as any).user.phone || "__NONE__";

    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { "members.email": { $regex: new RegExp(`^${userEmail}$`, "i") } },
        ...(userPhone && userPhone !== "__NONE__" ? [{ "members.phone": userPhone }] : [])
      ]
    }).sort({ createdAt: -1 });

    for (const group of groups) {
      if (!group.inviteCode) {
        await ensureGroupInviteCode(group);
      }
    }
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

    if (!group.inviteCode) {
      await ensureGroupInviteCode(group);
    }

    return res.json({ success: true, data: group });
  } catch (error) {
    return res.status(500).json({ error: "Invalid group ID or server error" });
  }
};

export const getOrGenerateInviteCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }

    const inviteCode = await ensureGroupInviteCode(group);
    return res.json({ success: true, inviteCode });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || "Failed to generate invite code" });
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

    const trimmedEmail = email ? email.trim().toLowerCase() : "";
    const trimmedPhone = phone ? phone.trim() : "";

    // Check if user is already a member
    if (trimmedEmail || trimmedPhone) {
      const isAlreadyMember = group.members.some((m) => {
        const mEmail = (m.email || "").toLowerCase().trim();
        const mPhone = (m.phone || "").trim();
        if (trimmedEmail && mEmail && mEmail === trimmedEmail) return true;
        if (trimmedPhone && mPhone && mPhone === trimmedPhone) return true;
        return false;
      });

      if (isAlreadyMember) {
        return res.status(400).json({
          success: false,
          error: "This user is already a member of this group."
        });
      }
    }

    const newMember = {
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      role: (role === "admin" ? "admin" : "member") as "admin" | "member",
      joinedAt: new Date()
    };

    group.members.push(newMember);
    await group.save();

    emitToGroup(group._id.toString(), "member-joined", {
      group: group._id,
      member: newMember
    });

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
    const id = req.params.id as string;
    const userId = (req as any).user?.id;
    const userEmail = ((req as any).user?.email || "").toLowerCase().trim();

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Allow creator or member to delete
    const isAuthorized =
      group.createdBy === userId ||
      group.members.some(
        (m) => m.email && m.email.toLowerCase().trim() === userEmail
      );

    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to delete this group" });
    }

    await Group.findByIdAndDelete(id);

    // Thoroughly clean up expenses belonging to this group
    await Expense.deleteMany({ group: id });
    try {
      const { Types } = await import("mongoose");
      if (typeof id === "string" && Types.ObjectId.isValid(id)) {
        await Expense.deleteMany({ group: new Types.ObjectId(id) });
      }
    } catch (_) {}

    try {
      const { Balance } = await import("../models/Balance.js");
      await Balance.deleteMany({ group: id });
    } catch (_) {}

    try {
      const { GroupMessage } = await import("../models/GroupMessage.js");
      await GroupMessage.deleteMany({ group: id });
    } catch (_) {}

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

    // Ensure invite code is present
    if (!group.inviteCode) {
      await ensureGroupInviteCode(group);
    }

    // Validate user is in group
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const isMember = 
      group.createdBy === userId ||
      group.members.some(m => 
        (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase()) || 
        (m.phone && user.phone && m.phone === user.phone)
      );
    if (!isMember) return res.status(403).json({ error: "Access denied" });

    const expenses = await Expense.find({ group: id }).populate('paidBy', 'fullName email');

    const balancesMap = new Map<string, { name: string, netAmount: number }>();
    const memberIdToUserId = new Map<string, string>();
    let totalShared = 0;

    // Initialize map with all members
    for (const member of group.members) {
      const memberUser = await User.findOne({ 
        $or: [
          { email: member.email ? member.email.toLowerCase().trim() : "__NONE__" },
          { phone: member.phone !== "" ? member.phone : "__NONE__" },
          { fullName: member.name }
        ] 
      });
      const uid = memberUser ? memberUser._id.toString() : (member._id ? member._id.toString() : member.name);
      balancesMap.set(uid, { name: memberUser?.fullName || member.name, netAmount: 0 });
      if (member._id && memberUser) {
        memberIdToUserId.set(member._id.toString(), memberUser._id.toString());
      }
    }

    expenses.forEach(exp => {
      totalShared += exp.amount;
      let payerId = (exp.paidBy as any)?._id?.toString() || (exp.paidBy as any)?.toString() || '';
      if (memberIdToUserId.has(payerId)) {
        payerId = memberIdToUserId.get(payerId)!;
      }
      if (!payerId) return;
      
      exp.splits.forEach(split => {
        let splitUserId = (split.user as any)?._id?.toString() || (split.user as any)?.toString() || '';
        if (memberIdToUserId.has(splitUserId)) {
          splitUserId = memberIdToUserId.get(splitUserId)!;
        }
        if (!splitUserId) return;
        
        if (payerId !== splitUserId) {
          if (balancesMap.has(payerId)) {
            balancesMap.get(payerId)!.netAmount += split.amount;
          }
          
          if (balancesMap.has(splitUserId)) {
            balancesMap.get(splitUserId)!.netAmount -= split.amount;
          }
        }
      });
    });

    const balances = Array.from(balancesMap.entries()).map(([uid, data]) => ({
      userId: uid,
      name: data.name,
      netAmount: Math.round(data.netAmount * 100) / 100
    }));

    const settlements = calculateSettlements(balances);
    
    let userOwed = 0;
    let userPaid = 0;
    
    expenses.forEach(exp => {
      let pId = (exp.paidBy as any)?._id?.toString() || (exp.paidBy as any)?.toString() || '';
      if (memberIdToUserId.has(pId)) pId = memberIdToUserId.get(pId)!;
      if (pId === userId) {
        userPaid += exp.amount;
      }
      exp.splits.forEach(split => {
        let sId = (split.user as any)?._id?.toString() || (split.user as any)?.toString() || '';
        if (memberIdToUserId.has(sId)) sId = memberIdToUserId.get(sId)!;
        if (sId === userId) {
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
          currency: group.currency || 'INR',
          memberCount: group.members.length,
          inviteCode: group.inviteCode,
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

export const settleGroupDebt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { payerId, receiverId, amount, notes } = req.body;

    if (!payerId || !receiverId) {
      return res.status(400).json({ success: false, error: "Payer and receiver are required." });
    }

    const settleAmount = Number(amount);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      return res.status(400).json({ success: false, error: "A valid positive settlement amount is required." });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found." });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(401).json({ success: false, error: "User not found." });
    }

    // Verify membership
    const isMember = 
      group.createdBy === userId ||
      group.members.some(m => 
        (m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) || 
        (m.phone && currentUser.phone && m.phone === currentUser.phone)
      );

    if (!isMember) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    // Find payer and receiver names
    const payerUser = await User.findById(payerId).catch(() => null);
    const receiverUser = await User.findById(receiverId).catch(() => null);

    const payerMember = group.members.find(m => m._id?.toString() === payerId);
    const receiverMember = group.members.find(m => m._id?.toString() === receiverId);

    const payerName = payerUser?.fullName || payerMember?.name || "Member";
    const receiverName = receiverUser?.fullName || receiverMember?.name || "Member";

    const description = notes?.trim() || `Settlement: ${payerName} paid ${receiverName}`;

    // Target ObjectIds
    const finalPayerId = payerUser ? payerUser._id : (payerMember?._id || payerId);
    const finalReceiverId = receiverUser ? receiverUser._id : (receiverMember?._id || receiverId);

    const settlementExpense = await Expense.create({
      group: group._id,
      description,
      amount: settleAmount,
      currency: group.currency || "INR",
      category: "Settlement",
      paidBy: finalPayerId,
      splitType: "exact",
      splits: [
        {
          user: finalReceiverId,
          amount: settleAmount,
        }
      ],
      createdBy: currentUser._id,
      date: new Date()
    });

    emitToGroup(group._id.toString(), "expense:created", settlementExpense);
    emitToGroup(group._id.toString(), "settlement:completed", {
      groupId: group._id,
      payerName,
      receiverName,
      amount: settleAmount
    });

    return res.status(200).json({
      success: true,
      message: `Successfully settled ₹${settleAmount.toFixed(2)} between ${payerName} and ${receiverName}`,
      data: settlementExpense
    });
  } catch (error: any) {
    console.error("Error settling debt:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to settle payment" });
  }
};
