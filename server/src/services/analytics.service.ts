import mongoose, { Types } from "mongoose";
import { Expense } from "../models/Expense.js";
import { Group } from "../models/Group.js";
import { Balance } from "../models/Balance.js";
import { AppError } from "../middleware/error.middleware.js";

export interface CategoryBreakdown {
  category: string;
  totalAmount: number;
  percentage: number;
  expenseCount: number;
}

export interface MemberSpending {
  userId: string;
  name: string;
  totalPaid: number;
  totalShare: number;
}

export interface MonthlyTrend {
  month: string;
  totalSpent: number;
  count: number;
}

export interface GroupAnalyticsResult {
  groupId: string;
  groupName: string;
  currency: string;
  totalSpent: number;
  expenseCount: number;
  categoryBreakdown: CategoryBreakdown[];
  memberSpending: MemberSpending[];
  monthlyTimeline: MonthlyTrend[];
  topExpense?: {
    description: string;
    amount: number;
    paidBy: string;
    date: Date;
  };
}

export const getGroupAnalytics = async (groupId: string): Promise<GroupAnalyticsResult> => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError("Group not found", 404);
  }

  const groupObjectId = new Types.ObjectId(groupId);
  const expenses = await Expense.find({ group: groupObjectId }).populate("paidBy", "name email");

  let totalSpent = 0;
  const categoryMap: Record<string, { amount: number; count: number }> = {};
  const memberMap: Record<string, { name: string; totalPaid: number; totalShare: number }> = {};
  const monthlyMap: Record<string, { amount: number; count: number }> = {};

  group.members.forEach((m) => {
    if (m._id) {
      memberMap[m._id.toString()] = {
        name: m.name,
        totalPaid: 0,
        totalShare: 0
      };
    }
  });

  let topExpense: GroupAnalyticsResult["topExpense"] = undefined;
  let maxAmount = 0;

  expenses.forEach((expense) => {
    const amt = expense.amount;
    totalSpent += amt;

    if (amt > maxAmount) {
      maxAmount = amt;
      topExpense = {
        description: expense.description,
        amount: amt,
        paidBy: (expense.paidBy as any)?.name || "Unknown",
        date: expense.date
      };
    }

    // Category calculation
    const cat = expense.category || "General";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amount: 0, count: 0 };
    }
    categoryMap[cat].amount += amt;
    categoryMap[cat].count += 1;

    // Monthly timeline
    const dateObj = new Date(expense.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { amount: 0, count: 0 };
    }
    monthlyMap[monthKey].amount += amt;
    monthlyMap[monthKey].count += 1;

    // Member paid calculation
    const paidById = expense.paidBy._id?.toString() || (expense.paidBy as any).toString();
    if (memberMap[paidById]) {
      memberMap[paidById].totalPaid += amt;
    }

    // Member share calculation
    expense.splits.forEach((split) => {
      const splitUserId = split.user.toString();
      if (memberMap[splitUserId]) {
        memberMap[splitUserId].totalShare += split.amount;
      }
    });
  });

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryMap).map(([category, val]) => ({
    category,
    totalAmount: Number(val.amount.toFixed(2)),
    percentage: totalSpent > 0 ? Number(((val.amount / totalSpent) * 100).toFixed(1)) : 0,
    expenseCount: val.count
  }));

  const memberSpending: MemberSpending[] = Object.entries(memberMap).map(([userId, val]) => ({
    userId,
    name: val.name,
    totalPaid: Number(val.totalPaid.toFixed(2)),
    totalShare: Number(val.totalShare.toFixed(2))
  }));

  const monthlyTimeline: MonthlyTrend[] = Object.entries(monthlyMap)
    .map(([month, val]) => ({
      month,
      totalSpent: Number(val.amount.toFixed(2)),
      count: val.count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    groupId,
    groupName: group.name,
    currency: group.currency || "USD",
    totalSpent: Number(totalSpent.toFixed(2)),
    expenseCount: expenses.length,
    categoryBreakdown,
    memberSpending,
    monthlyTimeline,
    topExpense
  };
};

export interface UserAnalyticsResult {
  userId: string;
  totalSpentAcrossGroups: number;
  totalOwedToUser: number;
  totalUserOwes: number;
  netBalance: number;
  categoryBreakdown: CategoryBreakdown[];
  groupsSummary: Array<{
    groupId: string;
    groupName: string;
    userPaid: number;
    userShare: number;
  }>;
}

export const getUserAnalytics = async (userId: string): Promise<UserAnalyticsResult> => {
  const userObjectId = new Types.ObjectId(userId);

  const expenses = await Expense.find({
    $or: [{ paidBy: userObjectId }, { "splits.user": userObjectId }]
  }).populate("group", "name currency");

  let totalSpent = 0;
  const categoryMap: Record<string, { amount: number; count: number }> = {};
  const groupSummaryMap: Record<string, { groupName: string; userPaid: number; userShare: number }> = {};

  expenses.forEach((expense) => {
    const groupName = (expense.group as any)?.name || "Group";
    const groupId = (expense.group as any)?._id?.toString() || expense.group.toString();

    if (!groupSummaryMap[groupId]) {
      groupSummaryMap[groupId] = { groupName, userPaid: 0, userShare: 0 };
    }

    const isPayer = expense.paidBy.toString() === userId;
    if (isPayer) {
      groupSummaryMap[groupId].userPaid += expense.amount;
    }

    const split = expense.splits.find((s) => s.user.toString() === userId);
    if (split) {
      const share = split.amount;
      totalSpent += share;
      groupSummaryMap[groupId].userShare += share;

      const cat = expense.category || "General";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { amount: 0, count: 0 };
      }
      categoryMap[cat].amount += share;
      categoryMap[cat].count += 1;
    }
  });

  // Calculate balances from Balance collection
  const userBalances = await Balance.find({ user: userObjectId });

  let totalUserOwes = 0;
  let totalOwedToUser = 0;

  userBalances.forEach((b) => {
    if (b.netAmount > 0) {
      totalOwedToUser += b.netAmount;
    } else if (b.netAmount < 0) {
      totalUserOwes += Math.abs(b.netAmount);
    }
  });

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryMap).map(([category, val]) => ({
    category,
    totalAmount: Number(val.amount.toFixed(2)),
    percentage: totalSpent > 0 ? Number(((val.amount / totalSpent) * 100).toFixed(1)) : 0,
    expenseCount: val.count
  }));

  const groupsSummary = Object.entries(groupSummaryMap).map(([groupId, val]) => ({
    groupId,
    groupName: val.groupName,
    userPaid: Number(val.userPaid.toFixed(2)),
    userShare: Number(val.userShare.toFixed(2))
  }));

  return {
    userId,
    totalSpentAcrossGroups: Number(totalSpent.toFixed(2)),
    totalOwedToUser: Number(totalOwedToUser.toFixed(2)),
    totalUserOwes: Number(totalUserOwes.toFixed(2)),
    netBalance: Number((totalOwedToUser - totalUserOwes).toFixed(2)),
    categoryBreakdown,
    groupsSummary
  };
};
