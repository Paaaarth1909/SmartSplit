import { Router } from "express";
import groupRoutes from "./group.routes.js";
import expenseRoutes from "./expense.routes.js";

const router = Router();

router.use("/groups", groupRoutes);
router.use("/expenses", expenseRoutes);

export default router;
