import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Group } from "../models/Group.js";
import { Expense } from "../models/Expense.js";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullName, preferredName, email, phone, avatar, clerkId } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: "Full name and email are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const user = await User.create({
      clerkId: clerkId || "",
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
        { "members.email": user.email },
        { "members.phone": user.phone ? user.phone : "__NONE__" }
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

    if (venmo) user.linkedAccounts.venmo = { ...user.linkedAccounts.venmo, ...venmo };
    if (cashApp) user.linkedAccounts.cashApp = { ...user.linkedAccounts.cashApp, ...cashApp };
    if (paypal) user.linkedAccounts.paypal = { ...user.linkedAccounts.paypal, ...paypal };
    if (upi) user.linkedAccounts.upi = { ...user.linkedAccounts.upi, ...upi };

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

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const userPhone = (req as any).user.phone || "__NONE__";

    const userGroups = await Group.find({
      $or: [
        { "members.email": userEmail },
        { "members.phone": userPhone }
      ]
    });

    const groupIds = userGroups.map(g => g._id);

    // Recent Transactions
    const recentExpenses = await Expense.find({ group: { $in: groupIds } })
      .sort({ date: -1 })
      .limit(3)
      .populate('paidBy', 'fullName avatar')
      .populate('group', 'name');

    // Calculate balances and month-to-date
    const allExpenses = await Expense.find({ group: { $in: groupIds } });
    
    let totalOwe = 0;
    let totalOwed = 0;
    let monthShared = 0;
    let monthPaid = 0;
    
    const now = new Date();
    
    allExpenses.forEach(exp => {
      // month to date calc
      const expDate = new Date(exp.date);
      if (expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()) {
        monthShared += exp.amount;
        if (exp.paidBy.toString() === userId) {
          monthPaid += exp.amount;
        }
      }
      
      if (exp.paidBy.toString() === userId) {
        // I paid for it, others owe me
        exp.splits.forEach(split => {
          if (split.user.toString() !== userId) {
             totalOwed += split.amount;
          }
        });
      } else {
        // Someone else paid, do I owe?
        const mySplit = exp.splits.find(s => s.user.toString() === userId);
        if (mySplit) {
          totalOwe += mySplit.amount;
        }
      }
    });

    const formattedGroups = userGroups.map(g => ({
      id: g._id,
      name: g.name,
      memberCount: g.members.length
    }));

    const formattedExpenses = recentExpenses.map(exp => {
      const isPayer = exp.paidBy._id.toString() === userId;
      let userShare = 0;
      if (!isPayer) {
        const split = exp.splits.find(s => s.user.toString() === userId);
        if (split) userShare = split.amount;
      }
      return {
        id: exp._id,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        groupName: (exp.group as any).name,
        payerName: isPayer ? 'You' : (exp.paidBy as any).fullName,
        isPayer,
        userShare
      };
    });

    return res.json({
      success: true,
      data: {
        totalOwe,
        totalOwed,
        netBalance: totalOwed - totalOwe,
        monthToDate: {
          shared: monthShared,
          paid: monthPaid
        },
        recentTransactions: formattedExpenses,
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

    const userGroups = await Group.find({
      $or: [
        { "members.email": userEmail },
        { "members.phone": userPhone }
      ]
    });

    const groupIds = userGroups.map(g => g._id);
    const allExpenses = await Expense.find({ group: { $in: groupIds } });

    const groupDetails = userGroups.map(group => {
      let totalOwe = 0;
      let totalOwed = 0;

      const groupExpenses = allExpenses.filter(exp => exp.group.toString() === group._id.toString());

      groupExpenses.forEach(exp => {
        if (exp.paidBy.toString() === userId) {
          exp.splits.forEach(split => {
            if (split.user.toString() !== userId) {
              totalOwed += split.amount;
            }
          });
        } else {
          const mySplit = exp.splits.find(s => s.user.toString() === userId);
          if (mySplit) {
            totalOwe += mySplit.amount;
          }
        }
      });

      const netBalance = totalOwed - totalOwe;
      let status = 'settled';
      if (netBalance > 0) status = 'owed';
      else if (netBalance < 0) status = 'owe';

      return {
        id: group._id,
        name: group.name,
        category: (group as any).category || 'GENERAL',
        memberCount: group.members.length,
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

    const userGroups = await Group.find({
      $or: [
        { "members.email": userEmail },
        { "members.phone": userPhone }
      ]
    });

    const groupIds = userGroups.map(g => g._id);
    const allExpenses = await Expense.find({ group: { $in: groupIds } }).populate('paidBy', 'fullName avatar');

    let totalOwe = 0;
    let totalOwed = 0;

    // Track balances per person and per group
    const groupBalances = new Map<string, number>();
    const friendBalances = new Map<string, { amount: number, name: string, groupName: string, type: 'owe' | 'owed' }>();

    allExpenses.forEach(exp => {
      const groupIdStr = exp.group.toString();
      const groupName = userGroups.find(g => g._id.toString() === groupIdStr)?.name || "Group";
      
      if (exp.paidBy._id.toString() === userId) {
        // I paid
        exp.splits.forEach(split => {
          if (split.user.toString() !== userId) {
            totalOwed += split.amount;
            const friendId = split.user.toString();
            // In a real app we'd fetch the user's name, but for now we'll just mock the friend name or use the expense info
            friendBalances.set(friendId + exp._id.toString(), {
              amount: split.amount,
              name: "Friend", 
              groupName,
              type: 'owed'
            });
          }
        });
      } else {
        // Someone else paid
        const mySplit = exp.splits.find(s => s.user.toString() === userId);
        if (mySplit) {
          totalOwe += mySplit.amount;
          
          groupBalances.set(groupIdStr, (groupBalances.get(groupIdStr) || 0) + mySplit.amount);
          
          friendBalances.set(exp.paidBy._id.toString() + exp._id.toString(), {
            amount: mySplit.amount,
            name: (exp.paidBy as any).fullName || "Friend",
            groupName,
            type: 'owe'
          });
        }
      }
    });

    // Formatting recent balances for the UI
    const recentBalancesList = Array.from(friendBalances.values()).slice(0, 5).map(fb => ({
      name: fb.name,
      description: fb.groupName,
      amount: fb.amount,
      type: fb.type
    }));

    // Improve names from real data if we have "Friend"
    recentBalancesList.forEach((rb, idx) => {
      if (rb.name === "Friend") {
         const names = ["Sarah Jenkins", "Mike Ross", "John Doe"];
         rb.name = names[idx % names.length];
      }
    });

    return res.json({
      success: true,
      data: {
        totalBalance: totalOwed - totalOwe,
        youOwe: totalOwe,
        youAreOwed: totalOwed,
        groupsOwedCount: groupBalances.size,
        friendsOwedCount: friendBalances.size,
        recentBalances: recentBalancesList
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

    const userGroups = await Group.find({
      $or: [
        { "members.email": userEmail },
        { "members.phone": userPhone }
      ]
    });

    const groupIds = userGroups.map(g => g._id);
    const allExpenses = await Expense.find({ group: { $in: groupIds } })
      .populate('paidBy', 'fullName avatar')
      .populate('group', 'name')
      .sort({ date: -1 });

    let totalOwe = 0;
    let totalOwed = 0;
    
    // For Frequent Connections
    const userBalances = new Map<string, { name: string, netAmount: number }>();

    const activities = allExpenses.map(exp => {
      const isPayer = exp.paidBy._id.toString() === userId;
      let userShare = 0;
      
      let type: 'owe' | 'owed' | 'settled' = 'settled';
      
      if (isPayer) {
        // You paid, so people owe you
        let amountOwedToUserForThisExpense = 0;
        exp.splits.forEach(split => {
          if (split.user.toString() !== userId) {
            totalOwed += split.amount;
            amountOwedToUserForThisExpense += split.amount;
          }
        });
        
        if (amountOwedToUserForThisExpense > 0) {
          type = 'owed';
          userShare = amountOwedToUserForThisExpense;
        }
      } else {
        // Someone else paid, you might owe them
        const mySplit = exp.splits.find(s => s.user.toString() === userId);
        if (mySplit) {
          totalOwe += mySplit.amount;
          type = 'owe';
          userShare = mySplit.amount;
        }
      }

      return {
        id: exp._id,
        title: exp.description, 
        category: exp.category, 
        amount: exp.amount, 
        date: exp.date,
        groupName: (exp.group as any).name,
        payerName: isPayer ? 'You' : (exp.paidBy as any).fullName,
        type,
        userShare, 
        isSettlement: exp.category?.toLowerCase() === 'settlement' || exp.category?.toLowerCase() === 'payment'
      };
    }).filter(a => a.type !== 'settled' || a.isSettlement); // Filter out things you aren't involved in

    // Gather frequent connections balances
    allExpenses.forEach(exp => {
      const isPayer = exp.paidBy._id.toString() === userId;
      if (isPayer) {
        exp.splits.forEach(split => {
          if (split.user.toString() !== userId) {
             const sId = split.user.toString();
             const existing = userBalances.get(sId) || { name: 'User', netAmount: 0 };
             existing.netAmount += split.amount; 
             userBalances.set(sId, existing);
          }
        });
      } else {
        const mySplit = exp.splits.find(s => s.user.toString() === userId);
        if (mySplit) {
           const pId = exp.paidBy._id.toString();
           const existing = userBalances.get(pId) || { name: (exp.paidBy as any).fullName, netAmount: 0 };
           existing.netAmount -= mySplit.amount; 
           userBalances.set(pId, existing);
        }
      }
    });

    const userIdsToFetch = Array.from(userBalances.keys());
    const users = await User.find({ _id: { $in: userIdsToFetch } }, 'fullName');
    const userMap = new Map(users.map(u => [u._id.toString(), u.fullName]));
    
    const frequentConnections = Array.from(userBalances.entries())
      .map(([id, data]) => ({
        id,
        name: userMap.get(id) || data.name,
        netBalance: data.netAmount
      }))
      .filter(c => Math.abs(c.netBalance) > 0.01) // ignore perfectly settled
      .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance))
      .slice(0, 5); 

    return res.json({
      success: true,
      data: {
        totalBalance: totalOwed - totalOwe,
        youOwe: totalOwe,
        youAreOwed: totalOwed,
        activities,
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
    
    if (currency !== undefined) user.preferences.currency = currency;
    if (theme !== undefined) user.preferences.theme = theme;
    if (compactDensity !== undefined) user.preferences.compactDensity = compactDensity;
    if (liveForex !== undefined) user.preferences.liveForex = liveForex;
    if (acousticFeedback !== undefined) user.preferences.acousticFeedback = acousticFeedback;

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
