import mongoose, { Types } from "mongoose";
import { Expense, IExpense } from "../models/Expense.js";
import { Group } from "../models/Group.js";
import { AppError } from "../middleware/error.middleware.js";
import {
  calculateSplit,
  SplitType,
  SplitParticipantInput,
} from "../utils/splitCalculator.js";
import {
  applyExpenseToBalances,
  reverseExpenseFromBalances,
} from "./balanceEngine.js";

interface CreateExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  category?: string;
  paidBy: string;
  splitType: SplitType;
  participants: SplitParticipantInput[];
  createdBy: string;
  receiptUrl?: string;
  aiGenerated?: boolean;
  date?: Date;
}

const assertGroupMembership = async (groupId: string, userIds: string[]) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);

  const memberIds = new Set(group.members.map((m) => m._id?.toString()));
  const invalid = userIds.filter((id) => !memberIds.has(id));
  if (invalid.length > 0) {
    throw new AppError(
      "All participants and the payer must be members of the group",
      400,
      { invalidUserIds: invalid }
    );
  }
};

export const createExpense = async (input: CreateExpenseInput): Promise<IExpense> => {
  const {
    groupId,
    description,
    amount,
    category,
    paidBy,
    splitType,
    participants,
    createdBy,
    receiptUrl,
    aiGenerated,
    date,
  } = input;

  await assertGroupMembership(groupId, [
    paidBy,
    ...participants.map((p) => p.userId),
  ]);

  const computedSplits = calculateSplit(amount, splitType, participants);

  const session = await mongoose.startSession();
  try {
    let expense!: IExpense;

    await session.withTransaction(async () => {
      const [created] = await Expense.create(
        [
          {
            group: groupId,
            description,
            amount,
            category,
            paidBy,
            splitType,
            splits: computedSplits.map((s, i) => ({
              user: s.userId,
              amount: s.amount,
              percentage: participants[i]?.percentage,
              shares: participants[i]?.shares,
            })),
            receiptUrl,
            aiGenerated: aiGenerated ?? false,
            createdBy,
            date: date ?? new Date(),
          },
        ],
        { session }
      );

      await applyExpenseToBalances({
        groupId,
        payerId: paidBy,
        amount,
        splits: computedSplits.map((s) => ({
          user: new Types.ObjectId(s.userId),
          amount: s.amount,
        })),
        session,
      });

      expense = created;
    });

    return expense.populate([
      { path: "paidBy", select: "name email avatarUrl" },
      { path: "splits.user", select: "name email avatarUrl" },
    ]);
  } finally {
    await session.endSession();
  }
};

interface UpdateExpenseInput {
  expenseId: string;
  description?: string;
  amount?: number;
  category?: string;
  paidBy?: string;
  splitType?: SplitType;
  participants?: SplitParticipantInput[];
}

export const updateExpense = async (input: UpdateExpenseInput): Promise<IExpense> => {
  const { expenseId } = input;

  const session = await mongoose.startSession();
  try {
    let updated!: IExpense;

    await session.withTransaction(async () => {
      const expense = await Expense.findById(expenseId).session(session);
      if (!expense) throw new AppError("Expense not found", 404);

      const groupId = expense.group.toString();

      await reverseExpenseFromBalances({
        groupId,
        payerId: expense.paidBy.toString(),
        amount: expense.amount,
        splits: expense.splits,
        session,
      });

      const amount = input.amount ?? expense.amount;
      const splitType = input.splitType ?? expense.splitType;
      const paidBy = input.paidBy ?? expense.paidBy.toString();
      const participants: SplitParticipantInput[] =
        input.participants ??
        expense.splits.map((s) => ({
          userId: s.user.toString(),
          amount: s.amount,
          percentage: s.percentage,
          shares: s.shares,
        }));

      if (input.participants || input.paidBy) {
        await assertGroupMembership(groupId, [
          paidBy,
          ...participants.map((p) => p.userId),
        ]);
      }

      const computedSplits = calculateSplit(amount, splitType, participants);

      expense.description = input.description ?? expense.description;
      expense.amount = amount;
      expense.category = input.category ?? expense.category;
      expense.paidBy = new Types.ObjectId(paidBy);
      expense.splitType = splitType;
      expense.splits = computedSplits.map((s, i) => ({
        user: new Types.ObjectId(s.userId),
        amount: s.amount,
        percentage: participants[i]?.percentage,
        shares: participants[i]?.shares,
      }));

      await expense.save({ session });

      await applyExpenseToBalances({
        groupId,
        payerId: paidBy,
        amount,
        splits: computedSplits.map((s) => ({
          user: new Types.ObjectId(s.userId),
          amount: s.amount,
        })),
        session,
      });

      updated = expense;
    });

    return updated.populate([
      { path: "paidBy", select: "name email avatarUrl" },
      { path: "splits.user", select: "name email avatarUrl" },
    ]);
  } finally {
    await session.endSession();
  }
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const expense = await Expense.findById(expenseId).session(session);
      if (!expense) throw new AppError("Expense not found", 404);

      await reverseExpenseFromBalances({
        groupId: expense.group.toString(),
        payerId: expense.paidBy.toString(),
        amount: expense.amount,
        splits: expense.splits,
        session,
      });

      await expense.deleteOne({ session });
    });
  } finally {
    await session.endSession();
  }
};

export const listExpensesForGroup = async (groupId: string) => {
  return Expense.find({ group: groupId })
    .populate("paidBy", "name email avatarUrl")
    .populate("splits.user", "name email avatarUrl")
    .sort({ date: -1 });
};

export const getExpenseById = async (expenseId: string) => {
  const expense = await Expense.findById(expenseId)
    .populate("paidBy", "name email avatarUrl")
    .populate("splits.user", "name email avatarUrl");

  if (!expense) throw new AppError("Expense not found", 404);
  return expense;
};

export const previewSplit = (
  amount: number,
  splitType: SplitType,
  participants: SplitParticipantInput[]
) => {
  return calculateSplit(amount, splitType, participants);
};
