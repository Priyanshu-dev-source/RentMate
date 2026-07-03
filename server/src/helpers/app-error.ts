import { StatusCodes } from "http-status-codes";

/**
 * Custom Application Error.
 *
 * WHY CUSTOM ERROR CLASS:
 * - Carries an HTTP status code so the error handler knows what to respond
 * - `isOperational` distinguishes expected errors (bad input, not found)
 *   from unexpected errors (null pointer, DB crash). Only operational errors
 *   send their message to the client; unexpected errors return generic 500.
 * - Stack trace is captured automatically via Error.captureStackTrace
 *
 * USAGE:
 *   throw new AppError("User not found", StatusCodes.NOT_FOUND);
 *   throw AppError.badRequest("Email is required");
 *   throw AppError.unauthorized();
 */
export class AppError extends Error {
  public readonly statusCode: StatusCodes;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Preserve proper stack trace (V8 engines only)
    Error.captureStackTrace(this, this.constructor);

    // Set prototype explicitly for instanceof checks after transpilation
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // ── Factory methods ──────────────────────────────────────────────

  static badRequest(message = "Bad request"): AppError {
    return new AppError(message, StatusCodes.BAD_REQUEST);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, StatusCodes.UNAUTHORIZED);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(message, StatusCodes.FORBIDDEN);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(message, StatusCodes.NOT_FOUND);
  }

  static conflict(message = "Resource already exists"): AppError {
    return new AppError(message, StatusCodes.CONFLICT);
  }

  static tooManyRequests(message = "Too many requests"): AppError {
    return new AppError(message, StatusCodes.TOO_MANY_REQUESTS);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(message, StatusCodes.INTERNAL_SERVER_ERROR, false);
  }
}
