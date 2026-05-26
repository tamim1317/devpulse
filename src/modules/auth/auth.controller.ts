import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import pool from "../../config/db";
import { sendSuccess, sendError } from "../../utils/response";
import { UserRole } from "../../utils/types";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10");

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  };

  if (!name || !email || !password) {
    sendError(res, StatusCodes.BAD_REQUEST, "name, email, and password are required.");
    return;
  }

  const validRoles: UserRole[] = ["contributor", "maintainer"];
  const userRole: UserRole = validRoles.includes(role) ? role : "contributor";

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    sendError(res, StatusCodes.BAD_REQUEST, "An account with this email already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, userRole]
  );

  sendSuccess(res, StatusCodes.CREATED, "User registered successfully", result.rows[0]);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    sendError(res, StatusCodes.BAD_REQUEST, "Email and password are required.");
    return;
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

  if (!result.rowCount || result.rowCount === 0) {
    sendError(res, StatusCodes.UNAUTHORIZED, "Invalid email or password.");
    return;
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    sendError(res, StatusCodes.UNAUTHORIZED, "Invalid email or password.");
    return;
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn }
  );

  sendSuccess(res, StatusCodes.OK, "Login successful", {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  });
};