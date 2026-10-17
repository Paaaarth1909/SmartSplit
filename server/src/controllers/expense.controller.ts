import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware.js";
import { ok } from "../utils/api.js";
import * as expenseService from "../services/expense.js";
import { getGroupBalances } from "../services/balanceEngine.js";
import { Group } from "../models/Group.js";
import { isUserAuthorizedForGroup } from "./group.controller.js";

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const createdBy = (req as any).user?.id || (req as any).user?._id?.toString();
  if (!createdBy) {
    return res.status(401).json({ success: false, error: "Authentication required to create an expense" });
  }
  const expense = await expenseService.createExpense({ ...req.body, createdBy });

  return ok(res, expense, 201);
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id?.toString();
  const userEmail = (req as any).user?.email;
  const userPhone = (req as any).user?.phone;
  const { expenseId } = req.params;

  const existing = await expenseService.getExpenseById(expenseId as string);
  const group = await Group.findById(existing.group);
  if (!group || !isUserAuthorizedForGroup(group, userId, userEmail, userPhone)) {
    return res.status(403).json({ success: false, error: "Access denied. You are not a member of this group." });
  }

  const expense = await expenseService.updateExpense({ expenseId: expenseId as string, ...req.body });
  return ok(res, expense);
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id?.toString();
  const userEmail = (req as any).user?.email;
  const userPhone = (req as any).user?.phone;
  const { expenseId } = req.params;

  const expense = await expenseService.getExpenseById(expenseId as string);
  const group = await Group.findById(expense.group);
  if (!group || !isUserAuthorizedForGroup(group, userId, userEmail, userPhone)) {
    return res.status(403).json({ success: false, error: "Access denied. You are not a member of this group." });
  }

  await expenseService.deleteExpense(expenseId as string);
  return ok(res, { deleted: true });
});

export const getExpense = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id?.toString();
  const userEmail = (req as any).user?.email;
  const userPhone = (req as any).user?.phone;

  const expense = await expenseService.getExpenseById(req.params.expenseId as string);
  const group = await Group.findById(expense.group);
  if (!group || !isUserAuthorizedForGroup(group, userId, userEmail, userPhone)) {
    return res.status(403).json({ success: false, error: "Access denied. You are not a member of this group." });
  }
  return ok(res, expense);
});

export const listGroupExpenses = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id?.toString();
  const userEmail = (req as any).user?.email;
  const userPhone = (req as any).user?.phone;
  const groupId = req.params.groupId as string;

  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ success: false, error: "Group not found" });
  }
  if (!isUserAuthorizedForGroup(group, userId, userEmail, userPhone)) {
    return res.status(403).json({ success: false, error: "Access denied. You are not a member of this group." });
  }

  const expenses = await expenseService.listExpensesForGroup(groupId);
  return ok(res, expenses);
});

export const getGroupBalancesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req as any).user?._id?.toString();
    const userEmail = (req as any).user?.email;
    const userPhone = (req as any).user?.phone;
    const groupId = req.params.groupId as string;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    if (!isUserAuthorizedForGroup(group, userId, userEmail, userPhone)) {
      return res.status(403).json({ success: false, error: "Access denied. You are not a member of this group." });
    }

    const balances = await getGroupBalances(groupId);
    return ok(res, balances);
  }
);

export const previewSplit = asyncHandler(async (req: Request, res: Response) => {
  const { amount, splitType, participants } = req.body;
  const preview = expenseService.previewSplit(amount, splitType, participants);
  return ok(res, preview);
});
