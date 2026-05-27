import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { sendError } from "../utils/response";
import { JwtPayload, UserRole } from "../utils/types";

const jwt = require("jsonwebtoken");

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      sendError(res, StatusCodes.UNAUTHORIZED, "Access denied. No token provided.");
      return;
    }

    // Support both "Bearer token" and plain token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    sendError(res, StatusCodes.UNAUTHORIZED, "Invalid or expired token.");
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, StatusCodes.FORBIDDEN, "You do not have permission to perform this action.");
      return;
    }
    next();
  };
};