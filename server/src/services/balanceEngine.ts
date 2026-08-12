import { ClientSession, Types } from "mongoose";
import { Balance } from "../models/Balance.js";
import { IExpenseSplit } from "../models/Expense.js";

interface ApplyExpenseParams {
  groupId: string;
  payerId: string;
  amount: number;
  splits: IExpenseSplit[] | { user: Types.ObjectId; amount: number }[];
  session?: ClientSession;
}

const upsertBalanceDelta = async (
  groupId: string,
  userId: Types.ObjectId | string,
  delta: number,
  session?: ClientSession
) => {
  await Balance.findOneAndUpdate(
    { group: groupId, user: userId },
    { $inc: { netAmount: round2(delta) } },
    { upsert: true, new: true, session }
  );
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const applyExpenseToBalances = async ({
  groupId,
  payerId,
  amount,
  splits,
  session,
}: ApplyExpenseParams) => {
  for (const split of splits) {
    await upsertBalanceDelta(groupId, split.user, -split.amount, session);
  }
  await upsertBalanceDelta(groupId, payerId, amount, session);
};

export const reverseExpenseFromBalances = async ({
  groupId,
  payerId,
  amount,
  splits,
  session,
}: ApplyExpenseParams) => {
  for (const split of splits) {
    await upsertBalanceDelta(groupId, split.user, split.amount, session);
  }
  await upsertBalanceDelta(groupId, payerId, -amount, session);
};

export const getGroupBalances = async (groupId: string) => {
  const balances = await Balance.find({ group: groupId })
    .populate("user", "name email avatarUrl")
    .lean();

  return balances.map((b) => ({
    user: b.user,
    netAmount: round2(b.netAmount),
    status:
      b.netAmount > 0.005 ? "owed" : b.netAmount < -0.005 ? "owes" : "settled",
  }));
};
