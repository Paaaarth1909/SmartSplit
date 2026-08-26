import express from "express";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { connectDB } from "./config/db.js";
import groupRoutes from "./routes/group.routes.js";
import userRoutes from "./routes/user.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import ocrRoutes from "./routes/ocr.routes.js";
import currencyRoutes from "./routes/currency.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { initSocket } from "./socket.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

app.use("/api/groups", groupRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ai", ocrRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is operational" });
});

app.use(errorHandler);

const httpServer = http.createServer(app);

initSocket(httpServer);

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server & WebSockets listening on http://localhost:${PORT}`);
  });
};

startServer();
