import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { sendError } from "../utils/response";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err.stack);
  sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Something went wrong.", err.message);
};

export const notFound = (_req: Request, res: Response): void => {
  sendError(res, StatusCodes.NOT_FOUND, "Route not found.");
};