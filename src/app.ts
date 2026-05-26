import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes";
import issuesRoutes from "./modules/issues/issues.routes";
import { errorHandler, notFound } from "./middleware/error.middleware";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ success: true, message: "DevPulse API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issuesRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;