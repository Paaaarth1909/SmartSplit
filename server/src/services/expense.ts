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
import {
  checkForDuplicates,
  storeReceiptHash,
  removeReceiptHash,
} from "./duplicateDetection.service.js";
import { convertCurrency } from "./currency.service.js";
import { emitToGroup } from "../socket.js";

interface CreateExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  paidBy: string;
  splitType: SplitType;
  participants: SplitParticipantInput[];
  createdBy: string;
  receiptUrl?: string;
  aiGenerated?: boolean;
  date?: Date;
  /** Perceptual hash forwarded from the OCR response */
  imageHash?: string;
  /** Merchant name extracted by OCR */
  receiptMerchant?: string;
  /** Receipt date (YYYY-MM-DD) extracted by OCR */
  receiptDate?: string;
  /** When true, skip duplicate detection (user confirmed override) */
  forceCreate?: boolean;
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
  return group;
};

export const createExpense = async (input: CreateExpenseInput): Promise<IExpense> => {
  const {
    groupId,
    description,
    amount,
    currency: rawCurrency,
    category,
    paidBy,
    splitType,
    participants,
    createdBy,
    receiptUrl,
    aiGenerated,
    date,
    imageHash,
    receiptMerchant,
    receiptDate,
    forceCreate,
  } = input;

  const group = await assertGroupMembership(groupId, [
    paidBy,
    ...participants.map((p) => p.userId),
  ]);

  const groupCurrency = group.currency || "USD";
  const expenseCurrency = (rawCurrency || groupCurrency).toUpperCase();

  let effectiveAmount = amount;
  let exchangeRate = 1.0;
  let convertedAmount = amount;

  if (expenseCurrency !== groupCurrency.toUpperCase()) {
    const conversion = await convertCurrency(amount, expenseCurrency, groupCurrency);
    exchangeRate = conversion.exchangeRate;
    convertedAmount = conversion.convertedAmount;
    effectiveAmount = convertedAmount;
  }

  // ------------------------------------------------------------------
  // Duplicate detection — Layer 2 (metadata fingerprint + image hash)
  // Skipped when the user explicitly confirmed via forceCreate.
  // ------------------------------------------------------------------
  if (!forceCreate) {
    const hasReceiptData = imageHash || (receiptMerchant && receiptDate);
    if (hasReceiptData) {
      const dupCheck = await checkForDuplicates({
        groupId,
        imageHash,
        merchant: receiptMerchant,
        total: amount,
        receiptDate,
      });

      if (dupCheck.isDuplicate) {
        throw new AppError("Potential duplicate receipt detected", 409, {
          isDuplicate: true,
          matchType: dupCheck.matchType,
          matchedExpenseId: dupCheck.matchedExpenseId,
          confidence: dupCheck.confidence,
        });
      }
    }
  }

  const computedSplits = calculateSplit(effectiveAmount, splitType, participants);

  const session = await mongoose.startSession();
  try {
    let expense!: IExpense;

    await session.withTransaction(async () => {
      const [created] = await Expense.create(
        [
          {
            group: groupId,
            description,
            amount: effectiveAmount,
            currency: expenseCurrency,
            originalAmount: amount,
            exchangeRate,
            convertedAmount,
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
        amount: effectiveAmount,
        splits: computedSplits.map((s) => ({
          user: new Types.ObjectId(s.userId),
          amount: s.amount,
        })),
        session,
      });

      expense = created;
    });

    // Store receipt hash for future duplicate checks (best-effort, non-blocking)
    if (imageHash || receiptMerchant) {
      storeReceiptHash({
        expenseId: expense._id.toString(),
        groupId,
        imageHash,
        merchant: receiptMerchant,
        total: amount,
        receiptDate,
        createdBy,
      }).catch((err) =>
        console.warn("Failed to store receipt hash:", err)
      );
    }

    const populated = await expense.populate([
      { path: "paidBy", select: "name email avatarUrl" },
      { path: "splits.user", select: "name email avatarUrl" },
    ]);

    emitToGroup(groupId, "expense:created", populated);
    return populated;
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

      const groupId = expense.group.toString();
      await expense.deleteOne({ session });
      emitToGroup(groupId, "expense:deleted", { expenseId, groupId });
    });

    // Clean up the receipt hash record (best-effort)
    removeReceiptHash(expenseId).catch((err) =>
      console.warn("Failed to remove receipt hash:", err)
    );
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
