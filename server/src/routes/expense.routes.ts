import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
  groupIdParamSchema,
  previewSplitSchema,
} from "../validators/expense.validator.js";
import * as expenseController from "../controllers/expense.controller.js";

const router = Router();

router.use(requireAuth);
router.post(
  "/preview-split",
  validate(previewSplitSchema),
  expenseController.previewSplit
);

router.post("/", validate(createExpenseSchema), expenseController.createExpense);
router.get(
  "/group/:groupId",
  validate(groupIdParamSchema),
  expenseController.listGroupExpenses
);
router.get(
  "/group/:groupId/balances",
  validate(groupIdParamSchema),
  expenseController.getGroupBalancesHandler
);
router.get(
  "/:expenseId",
  validate(expenseIdParamSchema),
  expenseController.getExpense
);
router.patch(
  "/:expenseId",
  validate(updateExpenseSchema),
  expenseController.updateExpense
);
router.delete(
  "/:expenseId",
  validate(expenseIdParamSchema),
  expenseController.deleteExpense
);
export default router;
