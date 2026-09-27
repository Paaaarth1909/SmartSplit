import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Group, ensureGroupInviteCode } from "../models/Group.js";
import { Expense } from "../models/Expense.js";

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
    const { fullName, preferredName, email, phone, avatar } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (preferredName !== undefined) user.preferredName = preferredName;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
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

// Unified helper to calculate net debt, credit, and balances for a user
async function calculateUserFinancials(userId: string, userEmail: string, userPhone: string) {
  // 1. Purge any orphan expenses belonging to deleted groups
  const allActiveGroups = await Group.find({}).select("_id").lean();
  const allActiveGroupIds = allActiveGroups.map(g => g._id);
  await Expense.deleteMany({ group: { $nin: allActiveGroupIds } });

  // 2. Query groups current user belongs to
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

  // 3. User alias set (handles member subdocument IDs belonging to current user)
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

  // 4. Name and ID mapping for all members
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

  // 5. Fetch all expenses for active user groups only
  const allExpenses = await Expense.find({ group: { $in: groupIds } })
    .populate('paidBy', 'fullName email avatar')
    .populate('splits.user', 'fullName email avatar')
    .populate('group', 'name')
    .sort({ date: -1 });

  // 6. Net balances per person
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

  // 7. Aggregate net totals
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

  // 8. Month to date
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
        exp.splits.forEach(split => {
          const sId = (split.user as any)?._id?.toString() || (split.user as any)?.toString() || '';
          const sCanonical = memberIdToUserId.get(sId) || sId;
          if (!myIdSet.has(sId) && !myIdSet.has(sCanonical)) {
            amountOwedToUser += split.amount;
          }
        });

        if (amountOwedToUser > 0) {
          type = isSettlement ? 'settled' : 'owed';
          userShare = amountOwedToUser;
        }
      } else {
        const mySplit = exp.splits.find(s => {
          const sId = (s.user as any)?._id?.toString() || (s.user as any)?.toString() || '';
          const sCanonical = memberIdToUserId.get(sId) || sId;
          return myIdSet.has(sId) || myIdSet.has(sCanonical);
        });

        if (mySplit) {
          type = isSettlement ? 'settled' : 'owe';
          userShare = mySplit.amount;
        }
      }

      return {
        id: exp._id,
        title: exp.description,
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        groupName: (exp.group as any)?.name || 'Group',
        payerName: isPayer ? 'You' : ((exp.paidBy as any)?.fullName || 'Member'),
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

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
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

// --- Friend Management ---

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

    const friendIds = currentUser.friends || [];
    const includeFriends = req.query.includeFriends === 'true';

    // Search for users whose email or name matches the query
    const filter: any = {
      _id: includeFriends ? { $ne: currentUser._id } : { $ne: currentUser._id, $nin: friendIds },
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    const users = await User.find(filter)
      .select('fullName email avatar _id')
      .limit(10);

    return res.json({ success: true, data: users });
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
    }).populate('friends', 'fullName email avatar _id');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, data: user.friends || [] });
  } catch (error) {
    console.error("Get friends error:", error);
    return res.status(500).json({ error: "Failed to fetch friends" });
  }
};

export const addFriend = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const { friendId } = req.params;

    const currentUser = await User.findOne({
      $or: [
        { _id: userId },
        { email: userEmail }
      ]
    });

    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    const targetUser = await User.findById(friendId);
    if (!targetUser) return res.status(404).json({ error: "Target user not found" });

    // Ensure friends arrays exist
    if (!currentUser.friends) currentUser.friends = [];
    if (!targetUser.friends) targetUser.friends = [];

    // Mutually add
    if (!currentUser.friends.includes(targetUser._id as any)) {
      currentUser.friends.push(targetUser._id as any);
      await currentUser.save();
    }
    
    if (!targetUser.friends.includes(currentUser._id as any)) {
      targetUser.friends.push(currentUser._id as any);
      await targetUser.save();
    }

    return res.json({ success: true, message: "Friend added successfully" });
  } catch (error) {
    console.error("Add friend error:", error);
    return res.status(500).json({ error: "Failed to add friend" });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const { friendId } = req.params;

    const currentUser = await User.findOne({
      $or: [
        { _id: userId },
        { email: userEmail }
      ]
    });

    if (!currentUser) return res.status(404).json({ error: "Current user not found" });

    const targetUser = await User.findById(friendId);
    
    // Ensure friends arrays exist
    if (!currentUser.friends) currentUser.friends = [];
    if (targetUser && !targetUser.friends) targetUser.friends = [];

    // Mutually remove
    currentUser.friends = currentUser.friends.filter(id => id.toString() !== friendId);
    await currentUser.save();

    if (targetUser) {
      targetUser.friends = (targetUser.friends || []).filter(id => id.toString() !== currentUser._id.toString());
      await targetUser.save();
    }

    return res.json({ success: true, message: "Friend removed successfully" });
  } catch (error) {
    console.error("Remove friend error:", error);
    return res.status(500).json({ error: "Failed to remove friend" });
  }
};
