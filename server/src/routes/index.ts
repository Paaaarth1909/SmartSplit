import { Router } from "express";
import groupRoutes from "./group.routes.js";
import expenseRoutes from "./expense.routes.js";
import { clerkMiddleware, clerkClient, getAuth } from '@clerk/express';
// import userRoutes from "./user.routes";
// import settlementRoutes from "./settlement.routes";
// import analyticsRoutes from "./analytics.routes";

const router = Router();

// router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/expenses", expenseRoutes);
// router.use("/settlements", settlementRoutes);
// router.use("/analytics", analyticsRoutes);

// Apply Clerk Middleware
router.use(clerkMiddleware());

// Use `getAuth()` to protect this route
router.get('/protected', async (req, res) => {
  // Use `getAuth()` to get the user's `userId` and authentication status
  const { isAuthenticated, userId } = getAuth(req);

  // If user isn't authenticated, return a 401 error
  if (!isAuthenticated) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  // Use Clerk's JavaScript Backend SDK to get the user's User object
  const user = await clerkClient.users.getUser(userId);

  res.json({ user });
});

export default router;
