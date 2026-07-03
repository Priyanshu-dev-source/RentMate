import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

/**
 * 404 Not Found Handler.
 *
 * Catches all requests that didn't match any route.
 * Must be registered AFTER all routes but BEFORE the error handler.
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    statusCode: StatusCodes.NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null,
    errors: null,
  });
}
