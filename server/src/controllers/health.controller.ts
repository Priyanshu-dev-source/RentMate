import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "../utils/api-response";
import { prisma } from "../config/database";

/**
 * Health Check Controller.
 *
 * Returns server status, uptime, and database connectivity.
 * Used by load balancers, monitoring, and CI/CD pipelines.
 */
export class HealthController {
  static async check(_req: Request, res: Response): Promise<Response> {
    // Test database connectivity
    let dbStatus = "disconnected";
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch {
      dbStatus = "error";
    }

    return ApiResponse.ok(res, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: dbStatus,
      version: process.env.npm_package_version || "1.0.0",
    });
  }

  static ping(_req: Request, res: Response): Response {
    return res.status(StatusCodes.OK).json({ pong: true });
  }
}
