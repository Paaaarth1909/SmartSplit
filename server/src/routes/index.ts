import { Router } from "express";
import groupRoutes from "./group.routes.js";
import expenseRoutes from "./expense.routes.js";
// import userRoutes from "./user.routes";
// import settlementRoutes from "./settlement.routes";
// import analyticsRoutes from "./analytics.routes";

const router = Router();

// router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/expenses", expenseRoutes);
// router.use("/settlements", settlementRoutes);
// router.use("/analytics", analyticsRoutes);

export default router;
