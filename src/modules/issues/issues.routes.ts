import { Router } from "express";
import {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
} from "./issues.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", getAllIssues);
router.get("/:id", getSingleIssue);
router.post("/", authenticate, createIssue);
router.patch("/:id", authenticate, updateIssue);
router.delete("/:id", authenticate, authorize("maintainer"), deleteIssue);

export default router;