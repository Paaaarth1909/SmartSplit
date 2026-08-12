import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware.js";
import { ok } from "../utils/api.js";
import * as expenseService from "../services/expense.js";
import { getGroupBalances } from "../services/balanceEngine.js";

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const createdBy = req.user!.id;
  const expense = await expenseService.createExpense({ ...req.body, createdBy });

  return ok(res, expense, 201);
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const { expenseId } = req.params;
  const expense = await expenseService.updateExpense({ expenseId: expenseId as string, ...req.body });

  return ok(res, expense);
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const { expenseId } = req.params;
  const expense = await expenseService.getExpenseById(expenseId as string);
  const groupId = expense.group.toString();

  await expenseService.deleteExpense(expenseId as string);

  return ok(res, { deleted: true });
});

export const getExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expenseService.getExpenseById(req.params.expenseId as string);
  return ok(res, expense);
});

export const listGroupExpenses = asyncHandler(async (req: Request, res: Response) => {
  const expenses = await expenseService.listExpensesForGroup(req.params.groupId as string);
  return ok(res, expenses);
});

export const getGroupBalancesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const balances = await getGroupBalances(req.params.groupId as string);
    return ok(res, balances);
  }
);

export const previewSplit = asyncHandler(async (req: Request, res: Response) => {
  const { amount, splitType, participants } = req.body;
  const preview = expenseService.previewSplit(amount, splitType, participants);
  return ok(res, preview);
});
