require("dotenv").config();

const express = require("express");
const cors = require("cors");

import authRoutes from "./modules/auth/auth.routes";
import issuesRoutes from "./modules/issues/issues.routes";
import { errorHandler, notFound } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: any, res: any) => {
  res.json({ success: true, message: "DevPulse API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issuesRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT ?? 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`DevPulse server running on port ${PORT}`);
    console.log("JWT_SECRET:", process.env.JWT_SECRET);
  });
}

module.exports = app;
export default app;