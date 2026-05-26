import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import pool from "../../config/db";
import { sendSuccess, sendError } from "../../utils/response";
import { IssueType, IssueStatus } from "../../utils/types";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

const attachReporters = async (issues: Record<string, unknown>[]) => {
  if (issues.length === 0) return issues;

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const result = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds]
  );

  const reporterMap = new Map(result.rows.map((r) => [r.id, r]));

  return issues.map(({ reporter_id, ...rest }) => ({
    ...rest,
    reporter: reporterMap.get(reporter_id) ?? null,
  }));
};

export const createIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, type } = req.body as {
    title: string;
    description: string;
    type: IssueType;
  };

  if (!title || !description || !type) {
    sendError(res, StatusCodes.BAD_REQUEST, "title, description, and type are required.");
    return;
  }

  if (title.length > 150) {
    sendError(res, StatusCodes.BAD_REQUEST, "Title must not exceed 150 characters.");
    return;
  }

  if (description.length < 20) {
    sendError(res, StatusCodes.BAD_REQUEST, "Description must be at least 20 characters.");
    return;
  }

  const validTypes: IssueType[] = ["bug", "feature_request"];
  if (!validTypes.includes(type)) {
    sendError(res, StatusCodes.BAD_REQUEST, "type must be either bug or feature_request.");
    return;
  }

  const reporterId = req.user?.id;

  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporterId]
  );

  sendSuccess(res, StatusCodes.CREATED, "Issue created successfully", result.rows[0]);
};

export const getAllIssues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { sort = "newest", type, status } = req.query as {
    sort?: string;
    type?: IssueType;
    status?: IssueStatus;
  };

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";

  const result = await pool.query(
    `SELECT * FROM issues ${whereClause} ${orderClause}`,
    params
  );

  const issuesWithReporters = await attachReporters(result.rows);
  sendSuccess(res, StatusCodes.OK, "Issues retrieved successfully", issuesWithReporters);
};

export const getSingleIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);

  if (!result.rowCount || result.rowCount === 0) {
    sendError(res, StatusCodes.NOT_FOUND, "Issue not found.");
    return;
  }

  const issuesWithReporters = await attachReporters(result.rows);
  sendSuccess(res, StatusCodes.OK, "Issue retrieved successfully", issuesWithReporters[0]);
};

export const updateIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, type, status } = req.body as {
    title?: string;
    description?: string;
    type?: IssueType;
    status?: IssueStatus;
  };

  const issueResult = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);

  if (!issueResult.rowCount || issueResult.rowCount === 0) {
    sendError(res, StatusCodes.NOT_FOUND, "Issue not found.");
    return;
  }

  const issue = issueResult.rows[0];
  const user = req.user!;

  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      sendError(res, StatusCodes.FORBIDDEN, "You can only update your own issues.");
      return;
    }
    if (issue.status !== "open") {
      sendError(res, StatusCodes.CONFLICT, "You can only edit issues that are still open.");
      return;
    }
    if (status) {
      sendError(res, StatusCodes.FORBIDDEN, "Contributors cannot change issue status.");
      return;
    }
  }

  const updatedTitle = title ?? issue.title;
  const updatedDescription = description ?? issue.description;
  const updatedType = type ?? issue.type;
  const updatedStatus = status ?? issue.status;

  const result = await pool.query(
    `UPDATE issues
     SET title = $1, description = $2, type = $3, status = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [updatedTitle, updatedDescription, updatedType, updatedStatus, id]
  );

  sendSuccess(res, StatusCodes.OK, "Issue updated successfully", result.rows[0]);
};

export const deleteIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const issueResult = await pool.query("SELECT id FROM issues WHERE id = $1", [id]);

  if (!issueResult.rowCount || issueResult.rowCount === 0) {
    sendError(res, StatusCodes.NOT_FOUND, "Issue not found.");
    return;
  }

  await pool.query("DELETE FROM issues WHERE id = $1", [id]);

  sendSuccess(res, StatusCodes.OK, "Issue deleted successfully");
};