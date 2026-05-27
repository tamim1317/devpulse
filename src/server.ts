const dotenv = require("dotenv");
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import issuesRoutes from "./modules/issues/issues.routes";
import { errorHandler, notFound } from "./middleware/error.middleware";

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

const PORT = process.env.PORT ?? 5000;

// Only listen when not on Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`DevPulse server running on port ${PORT}`);
  });
}

export default app;