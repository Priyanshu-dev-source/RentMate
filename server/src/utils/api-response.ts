import { Response } from "express";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

/**
 * Standardized API Response Format.
 *
 * Every API response follows this shape:
 * {
 *   success: boolean,
 *   statusCode: number,
 *   message: string,
 *   data: T | null,
 *   errors: object | null
 * }
 *
 * WHY STANDARDIZED:
 * - Frontend can rely on a consistent shape for every response
 * - Error handling is uniform — no guessing response structure
 * - Pagination metadata lives inside `data` (not top-level)
 * - `errors` field carries validation details when relevant
 */

interface ApiResponseOptions<T> {
  res: Response;
  statusCode: StatusCodes;
  message?: string;
  data?: T;
  errors?: Record<string, unknown> | null;
}

export class ApiResponse {
  /**
   * Send a successful response.
   */
  static success<T>(options: ApiResponseOptions<T>): Response {
    const { res, statusCode, message, data = null } = options;
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message: message || getReasonPhrase(statusCode),
      data,
      errors: null,
    });
  }

  /**
   * Send an error response.
   */
  static error(options: ApiResponseOptions<null>): Response {
    const { res, statusCode, message, errors = null } = options;
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message: message || getReasonPhrase(statusCode),
      data: null,
      errors,
    });
  }

  // ── Convenience methods ────────────────────────────────────────────

  static ok<T>(res: Response, data: T, message = "Success"): Response {
    return ApiResponse.success({ res, statusCode: StatusCodes.OK, message, data });
  }

  static created<T>(res: Response, data: T, message = "Created successfully"): Response {
    return ApiResponse.success({ res, statusCode: StatusCodes.CREATED, message, data });
  }

  static noContent(res: Response): Response {
    return res.status(StatusCodes.NO_CONTENT).send();
  }

  static badRequest(res: Response, message = "Bad request", errors?: Record<string, unknown>): Response {
    return ApiResponse.error({ res, statusCode: StatusCodes.BAD_REQUEST, message, errors });
  }

  static unauthorized(res: Response, message = "Unauthorized"): Response {
    return ApiResponse.error({ res, statusCode: StatusCodes.UNAUTHORIZED, message });
  }

  static forbidden(res: Response, message = "Forbidden"): Response {
    return ApiResponse.error({ res, statusCode: StatusCodes.FORBIDDEN, message });
  }

  static notFound(res: Response, message = "Resource not found"): Response {
    return ApiResponse.error({ res, statusCode: StatusCodes.NOT_FOUND, message });
  }

  static conflict(res: Response, message = "Resource already exists"): Response {
    return ApiResponse.error({ res, statusCode: StatusCodes.CONFLICT, message });
  }

  static internalError(res: Response, message = "Internal server error"): Response {
    return ApiResponse.error({ res, statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message });
  }
}
