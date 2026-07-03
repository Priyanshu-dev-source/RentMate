import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { AppError } from "../helpers/app-error";
import { env } from "../config/env";
import { AuthUser } from "../types/express.d";
import { UserRepository } from "../repositories/UserRepository";
import { catchAsync } from "../utils/catch-async";

const userRepository = new UserRepository();

/**
 * Authentication and Authorization Middlewares.
 */

/**
 * Authenticates incoming request by verifying Bearer Token in authorization header.
 * Loads the user's current role from the database so authorization reflects live data.
 */
export const authenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(AppError.unauthorized("Authentication required: No token provided"));
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next(AppError.unauthorized("Authentication required: Token format must be Bearer <token>"));
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(AppError.unauthorized("Authentication failed: User not found or inactive"));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(AppError.unauthorized("Authentication expired: Please refresh your session"));
    }
    return next(AppError.unauthorized("Authentication failed: Invalid token"));
  }
});

/**
 * Restricts access to routes based on user roles.
 * Must be mounted AFTER authenticate.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden("Access denied: You do not have permission to access this resource"));
    }

    next();
  };
}
