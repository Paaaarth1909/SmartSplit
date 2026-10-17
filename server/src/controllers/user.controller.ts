import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Group, ensureGroupInviteCode } from "../models/Group.js";
import { Expense } from "../models/Expense.js";
import { Notification } from "../models/Notification.js";
import { FriendRequest } from "../models/FriendRequest.js";
import { emitToUser } from "../socket.js";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullName, preferredName, email, phone, avatar } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: "Full name and email are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const user = await User.create({
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
        { createdBy: user._id.toString() },
        { "members.email": { $regex: new RegExp(`^${user.email}$`, "i") } },
        ...(user.phone ? [{ "members.phone": user.phone }] : [])
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
    const authUserId = (req as any).user?.id || (req as any).user?._id?.toString();
    if (id !== authUserId) {
      return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }

    const { fullName, preferredName, email, phone, avatar } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (fullName) {
      const cleanName = fullName.replace(/<[^>]*>?/gm, "").trim();
      if (cleanName.length >= 2 && cleanName.length <= 50) {
        user.fullName = cleanName;
      }
    }
    if (preferredName !== undefined) {
      user.preferredName = preferredName.replace(/<[^>]*>?/gm, "").trim();
    }
    if (email) user.email = email.toLowerCase().trim();
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (trimmedPhone) {
        const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
        if (!phoneRegex.test(trimmedPhone)) {
          return res.status(400).json({ error: "Invalid phone number format." });
        }
        user.phone = trimmedPhone;
      } else {
        user.phone = "";
      }
    }
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

    if (venmo !== undefined) user.linkedAccounts.venmo = venmo;
    if (cashApp !== undefined) user.linkedAccounts.cashApp = cashApp;
    if (paypal !== undefined) user.linkedAccounts.paypal = paypal;
    if (upi !== undefined) user.linkedAccounts.upi = upi;

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

async function calculateUserFinancials(userId: string, userEmail: string, userPhone: string) {
  const allActiveGroups = await Group.find({}).select("_id").lean();
  const allActiveGroupIds = allActiveGroups.map(g => g._id);
  await Expense.deleteMany({ group: { $nin: allActiveGroupIds } });

  const cleanEmail = (userEmail || "").toLowerCase().trim();
  const cleanPhone = (userPhone || "").trim();

  const userGroups = await Group.find({
    $or: [
      { createdBy: userId },
      { "members.email": { $regex: new RegExp(`^${cleanEmail}$`, "i") } },
      ...(cleanPhone && cleanPhone !== "__NONE__" ? [{ "members.phone": cleanPhone }] : [])
    ]
  }).sort({ createdAt: -1 });

  const groupIds = userGroups.map(g => g._id);

  const myIdSet = new Set<string>([userId]);
  for (const group of userGroups) {
    for (const m of group.members) {
      const mEmail = (m.email || "").toLowerCase().trim();
      const mPhone = (m.phone || "").trim();
      if ((cleanEmail && mEmail === cleanEmail) || (cleanPhone && mPhone && mPhone === cleanPhone)) {
        if (m._id) myIdSet.add(m._id.toString());
      }
    }
  }

  const memberNameMap = new Map<string, string>();
  const memberGroupMap = new Map<string, string>();
  const memberIdToUserId = new Map<string, string>();

  for (const group of userGroups) {
    for (const m of group.members) {
      const mId = m._id?.toString();
      if (mId) {
        memberNameMap.set(mId, m.name);
        memberGroupMap.set(mId, group.name);
      }
      if (m.email) {
        const u = await User.findOne({ email: m.email.toLowerCase().trim() }).select("_id fullName").lean();
        if (u) {
          const uId = u._id.toString();
          if (mId) memberIdToUserId.set(mId, uId);
          memberNameMap.set(uId, u.fullName || m.name);
          memberGroupMap.set(uId, group.name);
        }
      }
    }
  }

  const allExpenses = await Expense.find({ group: { $in: groupIds } })
    .populate('paidBy', 'fullName email avatar')
    .populate('splits.user', 'fullName email avatar')
    .populate('group', 'name')
    .sort({ date: -1 });

  const personNetMap = new Map<string, {
    canonicalId: string;
    name: string;
    groupName: string;
    netAmount: number; // positive = they owe me, negative = I owe them
  }>();

  for (const exp of allExpenses) {
    let rawPayerId = (exp.paidBy as any)?._id?.toString() || (exp.paidBy as any)?.toString() || '';
    const payerCanonical = memberIdToUserId.get(rawPayerId) || rawPayerId;
    const isPayerMe = myIdSet.has(rawPayerId) || myIdSet.has(payerCanonical);

    const groupObj = userGroups.find(g => g._id.toString() === exp.group.toString() || (exp.group as any)?._id?.toString() === g._id.toString());
    const groupName = groupObj?.name || (exp.group as any)?.name || "Group";

    if (isPayerMe) {
      for (const split of exp.splits) {
        let rawSplitUserId = (split.user as any)?._id?.toString() || (split.user as any)?.toString() || '';
        const splitCanonical = memberIdToUserId.get(rawSplitUserId) || rawSplitUserId;
        const isSplitMe = myIdSet.has(rawSplitUserId) || myIdSet.has(splitCanonical);

        if (!isSplitMe && split.amount > 0) {
          if (!personNetMap.has(splitCanonical)) {
            const displayName = (split.user as any)?.fullName || memberNameMap.get(rawSplitUserId) || memberNameMap.get(splitCanonical) || "Member";
            personNetMap.set(splitCanonical, {
              canonicalId: splitCanonical,
              name: displayName,
              groupName,
              netAmount: 0
            });
          }
          personNetMap.get(splitCanonical)!.netAmount += split.amount;
        }
      }
    } else {
      for (const split of exp.splits) {
        let rawSplitUserId = (split.user as any)?._id?.toString() || (split.user as any)?.toString() || '';
        const splitCanonical = memberIdToUserId.get(rawSplitUserId) || rawSplitUserId;
        const isSplitMe = myIdSet.has(rawSplitUserId) || myIdSet.has(splitCanonical);

        if (isSplitMe && split.amount > 0) {
          if (!personNetMap.has(payerCanonical)) {
            const displayName = (exp.paidBy as any)?.fullName || memberNameMap.get(rawPayerId) || memberNameMap.get(payerCanonical) || "Member";
            personNetMap.set(payerCanonical, {
              canonicalId: payerCanonical,
              name: displayName,
              groupName,
              netAmount: 0
            });
          }
          personNetMap.get(payerCanonical)!.netAmount -= split.amount;
        }
      }
    }
  }

  let totalOwe = 0;
  let totalOwed = 0;
  const groupsOwedSet = new Set<string>();
  let friendsOwedCount = 0;
  const recentBalances: any[] = [];

  for (const [pId, data] of personNetMap.entries()) {
    const roundedNet = Math.round(data.netAmount * 100) / 100;
    if (roundedNet > 0.01) {
      totalOwed += roundedNet;
      friendsOwedCount++;
      recentBalances.push({
        name: data.name,
        description: data.groupName,
        amount: roundedNet,
        type: 'owed'
      });
    } else if (roundedNet < -0.01) {
      const absAmount = Math.abs(roundedNet);
      totalOwe += absAmount;
      groupsOwedSet.add(data.groupName);
      recentBalances.push({
        name: data.name,
        description: data.groupName,
        amount: absAmount,
        type: 'owe'
      });
    }
  }

  let monthShared = 0;
  let monthPaid = 0;
  const now = new Date();
  for (const exp of allExpenses) {
    const expDate = new Date(exp.date);
    if (expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()) {
      monthShared += exp.amount;
      const rawPayerId = (exp.paidBy as any)?._id?.toString() || (exp.paidBy as any)?.toString() || '';
      const payerCanonical = memberIdToUserId.get(rawPayerId) || rawPayerId;
      if (myIdSet.has(rawPayerId) || myIdSet.has(payerCanonical)) {
        monthPaid += exp.amount;
      }
    }
  }

  totalOwe = Math.round(totalOwe * 100) / 100;
  totalOwed = Math.round(totalOwed * 100) / 100;
  const netBalance = Math.round((totalOwed - totalOwe) * 100) / 100;

  return {
    userGroups,
    allExpenses,
    myIdSet,
    memberIdToUserId,
    memberNameMap,
    totalOwe,
    totalOwed,
    netBalance,
    totalBalance: netBalance,
    groupsOwedCount: groupsOwedSet.size,
    friendsOwedCount,
    recentBalances,
    monthToDate: {
      shared: Math.round(monthShared * 100) / 100,
      paid: Math.round(monthPaid * 100) / 100
    }
  };
}

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const userPhone = (req as any).user.phone || "__NONE__";

    const {
      userGroups,
      allExpenses,
      myIdSet,
      memberIdToUserId,
      totalOwe,
      totalOwed,
      netBalance,
      monthToDate
    } = await calculateUserFinancials(userId, userEmail, userPhone);

    const formattedGroups = userGroups.map(g => ({
      id: g._id,
      name: g.name,
      memberCount: g.members.length
    }));

    const recentExpenses = allExpenses.slice(0, 3).map(exp => {
      const rawPayerId = (exp.paidBy as any)?._id?.toString() || (exp.paidBy as any)?.toString() || '';
      const payerCanonical = memberIdToUserId.get(rawPayerId) || rawPayerId;
      const isPayer = myIdSet.has(rawPayerId) || myIdSet.has(payerCanonical);

      let userShare = 0;
      if (!isPayer) {
        const split = exp.splits.find(s => {
          const sId = (s.user as any)?._id?.toString() || (s.user as any)?.toString() || '';
          return myIdSet.has(sId) || myIdSet.has(memberIdToUserId.get(sId) || sId);
        });
        if (split) userShare = split.amount;
      }

      return {
        id: exp._id,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        groupName: (exp.group as any)?.name || 'Group',
        payerName: isPayer ? 'You' : ((exp.paidBy as any)?.fullName || 'Member'),
        isPayer,
        userShare
      };
    });

    return res.json({
      success: true,
      data: {
        totalOwe,
        totalOwed,
        netBalance,
        monthToDate,
        recentTransactions: recentExpenses,
        sharedGroups: formattedGroups
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

export const getUserGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const userPhone = (req as any).user.phone || "__NONE__";

    const {
      userGroups,
      allExpenses,
      myIdSet,
      memberIdToUserId
    } = await calculateUserFinancials(userId, userEmail, userPhone);

    for (const group of userGroups) {
      if (!group.inviteCode) {
        await ensureGroupInviteCode(group);
      }
    }

    const groupDetails = userGroups.map(group => {
      const groupExpenses = allExpenses.filter(exp => 
        exp.group.toString() === group._id.toString() || 
        (exp.group as any)?._id?.toString() === group._id.toString()
      );

      const personNetInGroup = new Map<string, number>();

      groupExpenses.forEach(exp => {
        let rawPayerId = (exp.paidBy as any)?._id?.toString() || (exp.paidBy as any)?.toString() || '';
        const payerCanonical = memberIdToUserId.get(rawPayerId) || rawPayerId;
        const isPayerMe = myIdSet.has(rawPayerId) || myIdSet.has(payerCanonical);

        if (isPayerMe) {
          exp.splits.forEach(split => {
            let rawSplitUserId = (split.user as any)?._id?.toString() || (split.user as any)?.toString() || '';
            const splitCanonical = memberIdToUserId.get(rawSplitUserId) || rawSplitUserId;
            const isSplitMe = myIdSet.has(rawSplitUserId) || myIdSet.has(splitCanonical);
            if (!isSplitMe && split.amount > 0) {
              personNetInGroup.set(splitCanonical, (personNetInGroup.get(splitCanonical) || 0) + split.amount);
            }
          });
        } else {
          exp.splits.forEach(split => {
            let rawSplitUserId = (split.user as any)?._id?.toString() || (split.user as any)?.toString() || '';
            const splitCanonical = memberIdToUserId.get(rawSplitUserId) || rawSplitUserId;
            const isSplitMe = myIdSet.has(rawSplitUserId) || myIdSet.has(splitCanonical);
            if (isSplitMe && split.amount > 0) {
              personNetInGroup.set(payerCanonical, (personNetInGroup.get(payerCanonical) || 0) - split.amount);
            }
          });
        }
      });

      let netBalance = 0;
      for (const amount of personNetInGroup.values()) {
        netBalance += amount;
      }
      netBalance = Math.round(netBalance * 100) / 100;

      let status = 'settled';
      if (netBalance > 0.01) status = 'owed';
      else if (netBalance < -0.01) status = 'owe';

      return {
        id: group._id,
        name: group.name,
        category: (group as any).category || 'GENERAL',
        memberCount: group.members.length,
        inviteCode: group.inviteCode,
        balance: Math.abs(netBalance),
        status,
        members: group.members.map(m => ({
          name: m.name,
          email: m.email
        }))
      };
    });

    return res.json({
      success: true,
      data: groupDetails
    });
  } catch (error) {
    console.error("User groups error:", error);
    return res.status(500).json({ error: "Failed to fetch user groups" });
  }
};

export const getFinancialOverview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const userPhone = (req as any).user.phone || "__NONE__";

    const {
      totalBalance,
      totalOwe,
      totalOwed,
      groupsOwedCount,
      friendsOwedCount,
      recentBalances
    } = await calculateUserFinancials(userId, userEmail, userPhone);

    return res.json({
      success: true,
      data: {
        totalBalance,
        youOwe: totalOwe,
        youAreOwed: totalOwed,
        groupsOwedCount,
        friendsOwedCount,
        recentBalances
      }
    });
  } catch (error) {
    console.error("Financial Overview error:", error);
    return res.status(500).json({ error: "Failed to fetch financial overview" });
  }
};
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const userPhone = (req as any).user.phone || "__NONE__";

    const {
      allExpenses,
      myIdSet,
      memberIdToUserId,
      memberNameMap,
      totalOwe,
      totalOwed,
      netBalance,
      totalBalance,
      recentBalances
    } = await calculateUserFinancials(userId, userEmail, userPhone);

    const activities = allExpenses.map(exp => {
      const rawPayerId = (exp.paidBy as any)?._id?.toString() || (exp.paidBy as any)?.toString() || '';
      const payerCanonical = memberIdToUserId.get(rawPayerId) || rawPayerId;
      const isPayer = myIdSet.has(rawPayerId) || myIdSet.has(payerCanonical);
      const isSettlement = exp.category?.toLowerCase() === 'settlement' || exp.category?.toLowerCase() === 'payment';

      let userShare = 0;
      let type: 'owe' | 'owed' | 'settled' = 'settled';

      if (isPayer) {
        let amountOwedToUser = 0;
        (exp.splits || []).forEach(split => {
          const sId = (split.user as any)?._id?.toString() || (split.user as any)?.toString() || '';
          const sCanonical = memberIdToUserId.get(sId) || sId;
          if (!myIdSet.has(sId) && !myIdSet.has(sCanonical)) {
            amountOwedToUser += (split.amount || 0);
          }
        });

        if (amountOwedToUser > 0) {
          type = isSettlement ? 'settled' : 'owed';
          userShare = amountOwedToUser;
        }
      } else {
        const mySplit = (exp.splits || []).find(s => {
          const sId = (s.user as any)?._id?.toString() || (s.user as any)?.toString() || '';
          const sCanonical = memberIdToUserId.get(sId) || sId;
          return myIdSet.has(sId) || myIdSet.has(sCanonical);
        });

        if (mySplit) {
          type = isSettlement ? 'settled' : 'owe';
          userShare = mySplit.amount || 0;
        }
      }

      return {
        id: exp._id,
        title: exp.description,
        description: exp.description,
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        groupName: (exp.group as any)?.name || 'Group',
        payerName: isPayer ? 'You' : ((exp.paidBy as any)?.fullName || memberNameMap?.get(payerCanonical) || memberNameMap?.get(rawPayerId) || 'Member'),
        type,
        userShare,
        isSettlement
      };
    }).filter(a => a.type !== 'settled' || a.isSettlement);

    const frequentConnections = recentBalances
      .filter(c => Math.abs(c.amount) > 0.01)
      .map(rb => ({
        name: rb.name,
        netBalance: rb.type === 'owed' ? rb.amount : -rb.amount
      }));

    return res.json({
      success: true,
      data: {
        totalBalance,
        youOwe: totalOwe,
        youAreOwed: totalOwed,
        activities,
        recentActivity: activities,
        frequentConnections
      }
    });
  } catch (error) {
    console.error("Recent Activity error:", error);
    return res.status(500).json({ error: "Failed to fetch recent activity" });
  }
};
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const userPhone = (req as any).user.phone || "__NONE__";

    const user = await User.findOne({
      $or: [
        { email: userEmail },
        { phone: userPhone },
        { _id: userId }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Fetch current user error:", error);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    
    const user = await User.findOne({
      $or: [
        { email: userEmail },
        { _id: userId }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { fullName, email, phone, currency, theme, compactDensity, liveForex, acousticFeedback, avatar } = req.body;

    if (fullName !== undefined) {
      const cleanName = String(fullName).replace(/<[^>]*>?/gm, "").trim();
      if (cleanName.length >= 2 && cleanName.length <= 50) {
        user.fullName = cleanName;
        user.preferredName = cleanName.split(" ")[0];
      }
    }
    if (email !== undefined && String(email).trim()) {
      user.email = String(email).trim().toLowerCase();
    }
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (trimmedPhone) {
        const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
        if (!phoneRegex.test(trimmedPhone)) {
          return res.status(400).json({ error: "Invalid phone number format." });
        }
        user.phone = trimmedPhone;
      } else {
        user.phone = "";
      }
    }
    if (avatar !== undefined) user.avatar = avatar;
    
    if (!user.preferences) {
      user.preferences = {};
    }

    let prefsModified = false;
    if (currency !== undefined) { user.preferences.currency = currency; prefsModified = true; }
    if (theme !== undefined) { user.preferences.theme = theme; prefsModified = true; }
    if (compactDensity !== undefined) { user.preferences.compactDensity = compactDensity; prefsModified = true; }
    if (liveForex !== undefined) { user.preferences.liveForex = liveForex; prefsModified = true; }
    if (acousticFeedback !== undefined) { user.preferences.acousticFeedback = acousticFeedback; prefsModified = true; }

    if (prefsModified) {
      user.markModified('preferences');
    }

    await user.save();

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Update current user error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const query = req.query.q as string;

    if (!query || query.trim() === '') {
      return res.json({ success: true, data: [] });
    }

    const currentUser = await User.findOne({
      $or: [
        { _id: userId },
        { email: (req as any).user.email }
      ]
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Current user not found" });
    }

    const friendIdStrings = new Set((currentUser.friends || []).map((f: any) => f.toString()));

    const trimmedQuery = query.trim();
    const isFullEmail = trimmedQuery.includes("@");

    const filter: any = {
      _id: { $ne: currentUser._id },
      $or: isFullEmail
        ? [{ email: trimmedQuery.toLowerCase() }]
        : [
            { fullName: { $regex: trimmedQuery, $options: 'i' } },
            { preferredName: { $regex: trimmedQuery, $options: 'i' } }
          ]
    };

    const rawUsers = await User.find(filter)
      .select('fullName preferredName avatar _id')
      .limit(20);

    const pendingRequests = await FriendRequest.find({
      $or: [
        { sender: currentUser._id, status: 'PENDING' },
        { recipient: currentUser._id, status: 'PENDING' }
      ]
    });

    const sentRequestRecipientIds = new Set<string>();
    const receivedRequestMap = new Map<string, string>(); // senderId -> requestId

    pendingRequests.forEach(r => {
      const sId = r.sender.toString();
      const recId = r.recipient.toString();
      if (sId === currentUser._id.toString()) {
        sentRequestRecipientIds.add(recId);
      } else if (recId === currentUser._id.toString()) {
        receivedRequestMap.set(sId, r._id.toString());
      }
    });

    const results = rawUsers.map(u => {
      const uId = u._id.toString();
      let relationshipStatus: 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE' = 'NONE';
      let requestId: string | undefined = undefined;

      if (friendIdStrings.has(uId)) {
        relationshipStatus = 'FRIENDS';
      } else if (sentRequestRecipientIds.has(uId)) {
        relationshipStatus = 'REQUEST_SENT';
      } else if (receivedRequestMap.has(uId)) {
        relationshipStatus = 'REQUEST_RECEIVED';
        requestId = receivedRequestMap.get(uId);
      }

      return {
        _id: u._id,
        fullName: u.fullName || u.preferredName || "User",
        preferredName: u.preferredName,
        avatar: u.avatar || "",
        relationshipStatus,
        requestId
      };
    });

    return res.json({ success: true, data: results });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({ error: "Failed to search users" });
  }
};

export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;

    const user = await User.findOne({
      $or: [
        { _id: userId },
        { email: userEmail }
      ]
    }).populate('friends', 'fullName preferredName avatar _id');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, data: user.friends || [] });
  } catch (error) {
    console.error("Get friends error:", error);
    return res.status(500).json({ error: "Failed to fetch friends" });
  }
};

export const getFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;

    const currentUser = await User.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });

    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const incoming = await FriendRequest.find({
      recipient: currentUser._id,
      status: "PENDING"
    })
      .sort({ createdAt: -1 })
      .populate("sender", "fullName preferredName avatar _id");

    const outgoing = await FriendRequest.find({
      sender: currentUser._id,
      status: "PENDING"
    })
      .sort({ createdAt: -1 })
      .populate("recipient", "fullName preferredName avatar _id");

    return res.json({
      success: true,
      data: {
        incoming,
        outgoing
      }
    });
  } catch (error) {
    console.error("Get friend requests error:", error);
    return res.status(500).json({ error: "Failed to fetch friend requests" });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const targetUserId = req.params.targetUserId as string;

    const currentUser = await User.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });

    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    if (currentUser._id.toString() === targetUserId) {
      return res.status(400).json({ error: "You cannot send a friend request to yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: "Target user not found" });

    const isAlreadyFriend = (currentUser.friends || []).some(
      (f: any) => f.toString() === targetUser._id.toString()
    );
    if (isAlreadyFriend) {
      return res.status(400).json({ error: "You are already friends with this user" });
    }

    const incomingRequest = await FriendRequest.findOne({
      sender: targetUser._id,
      recipient: currentUser._id,
      status: "PENDING"
    });

    if (incomingRequest) {
      incomingRequest.status = "ACCEPTED";
      await incomingRequest.save();

      await User.findByIdAndUpdate(currentUser._id, {
        $addToSet: { friends: targetUser._id }
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $addToSet: { friends: currentUser._id }
      });

      const acceptedNotif = await Notification.create({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: "FRIEND_ACCEPTED",
        status: "COMPLETED",
        read: false
      });

      const popNotif = await Notification.findById(acceptedNotif._id)
        .populate("sender", "fullName preferredName avatar");

      emitToUser(targetUser._id.toString(), "notification:new", popNotif || acceptedNotif);
      emitToUser(targetUser._id.toString(), "friend:status-change", {
        userId: currentUser._id.toString(),
        status: "FRIENDS"
      });
      emitToUser(currentUser._id.toString(), "friend:status-change", {
        userId: targetUser._id.toString(),
        status: "FRIENDS"
      });

      return res.json({
        success: true,
        message: "You accepted their existing friend request!",
        status: "FRIENDS"
      });
    }

    let existingRequest = await FriendRequest.findOne({
      sender: currentUser._id,
      recipient: targetUser._id
    });

    if (existingRequest && existingRequest.status === "PENDING") {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    if (existingRequest) {
      existingRequest.status = "PENDING";
      await existingRequest.save();
    } else {
      existingRequest = await FriendRequest.create({
        sender: currentUser._id,
        recipient: targetUser._id,
        status: "PENDING"
      });
    }

    const notification = await Notification.create({
      recipient: targetUser._id,
      sender: currentUser._id,
      type: "FRIEND_REQUEST",
      status: "PENDING",
      read: false
    });

    const populatedNotif = await Notification.findById(notification._id)
      .populate("sender", "fullName preferredName avatar");

    emitToUser(targetUser._id.toString(), "notification:new", populatedNotif || notification);
    emitToUser(targetUser._id.toString(), "friend:status-change", {
      userId: currentUser._id.toString(),
      status: "REQUEST_RECEIVED",
      requestId: existingRequest._id.toString()
    });
    emitToUser(currentUser._id.toString(), "friend:status-change", {
      userId: targetUser._id.toString(),
      status: "REQUEST_SENT",
      requestId: existingRequest._id.toString()
    });

    return res.json({
      success: true,
      message: "Friend request sent successfully",
      status: "REQUEST_SENT",
      requestId: existingRequest._id
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    return res.status(500).json({ error: "Failed to send friend request" });
  }
};

export const cancelFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const targetUserId = req.params.targetUserId as string;

    const currentUser = await User.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });

    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    await FriendRequest.findOneAndDelete({
      $or: [
        { sender: currentUser._id, recipient: targetUserId, status: "PENDING" },
        { _id: targetUserId, sender: currentUser._id, status: "PENDING" }
      ]
    });

    await Notification.findOneAndDelete({
      recipient: targetUserId,
      sender: currentUser._id,
      type: "FRIEND_REQUEST",
      status: "PENDING"
    });

    emitToUser(targetUserId, "friend:status-change", {
      userId: currentUser._id.toString(),
      status: "NONE"
    });
    emitToUser(currentUser._id.toString(), "friend:status-change", {
      userId: targetUserId,
      status: "NONE"
    });

    return res.json({
      success: true,
      message: "Friend request cancelled",
      status: "NONE"
    });
  } catch (error) {
    console.error("Cancel friend request error:", error);
    return res.status(500).json({ error: "Failed to cancel friend request" });
  }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const targetUserId = req.params.targetUserId as string; // Can be targetUserId or requestId

    const currentUser = await User.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });

    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    const request = await FriendRequest.findOne({
      $or: [
        { sender: targetUserId, recipient: currentUser._id, status: "PENDING" },
        { _id: targetUserId, recipient: currentUser._id, status: "PENDING" }
      ]
    });

    if (!request) {
      return res.status(404).json({ error: "Friend request not found or already handled" });
    }

    const senderId = request.sender.toString();

    request.status = "ACCEPTED";
    await request.save();

    await User.findByIdAndUpdate(currentUser._id, {
      $addToSet: { friends: request.sender }
    });
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: currentUser._id }
    });

    await Notification.findOneAndUpdate(
      { recipient: currentUser._id, sender: request.sender, type: "FRIEND_REQUEST" },
      { status: "ACCEPTED", read: true }
    );

    const acceptedNotif = await Notification.create({
      recipient: request.sender,
      sender: currentUser._id,
      type: "FRIEND_ACCEPTED",
      status: "COMPLETED",
      read: false
    });

    const populatedNotif = await Notification.findById(acceptedNotif._id)
      .populate("sender", "fullName preferredName avatar");

    emitToUser(senderId, "notification:new", populatedNotif || acceptedNotif);
    emitToUser(senderId, "friend:status-change", {
      userId: currentUser._id.toString(),
      status: "FRIENDS"
    });
    emitToUser(currentUser._id.toString(), "friend:status-change", {
      userId: senderId,
      status: "FRIENDS"
    });

    return res.json({
      success: true,
      message: "Friend request accepted",
      status: "FRIENDS"
    });
  } catch (error) {
    console.error("Accept friend request error:", error);
    return res.status(500).json({ error: "Failed to accept friend request" });
  }
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const targetUserId = req.params.targetUserId as string;

    const currentUser = await User.findOne({
      $or: [{ _id: userId }, { email: userEmail }]
    });

    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    const request = await FriendRequest.findOneAndUpdate(
      {
        $or: [
          { sender: targetUserId, recipient: currentUser._id, status: "PENDING" },
          { _id: targetUserId, recipient: currentUser._id, status: "PENDING" }
        ]
      },
      { status: "REJECTED" }
    );

    await Notification.findOneAndUpdate(
      {
        recipient: currentUser._id,
        $or: [{ sender: targetUserId }, { _id: targetUserId }],
        type: "FRIEND_REQUEST"
      },
      { status: "REJECTED", read: true }
    );

    const senderId: string = request ? request.sender.toString() : targetUserId;

    emitToUser(senderId, "friend:status-change", {
      userId: currentUser._id.toString(),
      status: "NONE"
    });
    emitToUser(currentUser._id.toString(), "friend:status-change", {
      userId: senderId,
      status: "NONE"
    });

    return res.json({
      success: true,
      message: "Friend request declined",
      status: "NONE"
    });
  } catch (error) {
    console.error("Reject friend request error:", error);
    return res.status(500).json({ error: "Failed to reject friend request" });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const friendId = req.params.friendId as string;

    const currentUser = await User.findOne({
      $or: [
        { _id: userId },
        { email: userEmail }
      ]
    });

    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    const targetUser = await User.findById(friendId);

    currentUser.friends = (currentUser.friends || []).filter(
      id => id.toString() !== friendId
    );
    await currentUser.save();

    if (targetUser) {
      targetUser.friends = (targetUser.friends || []).filter(
        id => id.toString() !== currentUser._id.toString()
      );
      await targetUser.save();
    }

    await FriendRequest.deleteMany({
      $or: [
        { sender: currentUser._id, recipient: friendId },
        { sender: friendId, recipient: currentUser._id }
      ]
    });

    emitToUser(friendId, "friend:status-change", {
      userId: currentUser._id.toString(),
      status: "NONE"
    });
    emitToUser(currentUser._id.toString(), "friend:status-change", {
      userId: friendId,
      status: "NONE"
    });

    return res.json({ success: true, message: "Friend removed successfully", status: "NONE" });
  } catch (error) {
    console.error("Remove friend error:", error);
    return res.status(500).json({ error: "Failed to remove friend" });
  }
};

export const addFriend = sendFriendRequest;
