import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../helpers/app-error";
import { logger } from "../utils/logger";
import { env } from "../config/env";

/**
 * Global Error Handler Middleware.
 *
 * WHY CENTRALIZED:
 * - Single place to handle all errors consistently
 * - Operational errors (AppError): send the message to client
 * - Programming errors: log full stack, send generic message
 * - Prisma errors: mapped to user-friendly messages
 * - Validation errors: formatted with field-level detail
 *
 * MUST be registered LAST in the middleware chain (after all routes).
 * Express identifies error handlers by their 4-parameter signature.
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default values
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errors: Record<string, unknown> | null = null;
  let isOperational = false;

  // ── Handle known error types ───────────────────────────────────

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Prisma: Unique constraint violation (e.g., duplicate email)
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as Error & { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === "P2002") {
      statusCode = StatusCodes.CONFLICT;
      const field = prismaErr.meta?.target?.[0] || "field";
      message = `A record with this ${field} already exists`;
      isOperational = true;
    }
    if (prismaErr.code === "P2025") {
      statusCode = StatusCodes.NOT_FOUND;
      message = "Record not found";
      isOperational = true;
    }
  }

  // Prisma: Validation error
  if (err.name === "PrismaClientValidationError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Invalid data provided";
    isOperational = true;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Invalid token";
    isOperational = true;
  }
  if (err.name === "TokenExpiredError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Token expired";
    isOperational = true;
  }

  // Zod validation errors (if thrown directly)
  if (err.name === "ZodError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Validation failed";
    const zodErr = err as Error & { issues: Array<{ path: (string | number)[]; message: string }> };
    errors = {
      fields: zodErr.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
    isOperational = true;
  }

  // ── Logging ────────────────────────────────────────────────────

  if (!isOperational) {
    // Unexpected error: log full details for debugging
    logger.error("Unexpected error:", {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  } else {
    // Operational error: log at warn level
    logger.warn(`${statusCode} - ${message}`);
  }

  // ── Response ───────────────────────────────────────────────────

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: isOperational ? message : "Internal server error",
    data: null,
    errors,
    // Include stack trace only in development for debugging
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
