import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { TenantService } from "../services/TenantService";
import { ApiResponse } from "../utils/api-response";

const tenantService = new TenantService();

export class TenantController {
  static async getPreferences(req: Request, res: Response): Promise<Response> {
    const preferences = await tenantService.getPreferences(req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Tenant preferences retrieved successfully",
      data: preferences,
    });
  }

  static async updatePreferences(req: Request, res: Response): Promise<Response> {
    const preferences = await tenantService.updatePreferences(req.user!.id, req.body);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Tenant preferences updated successfully",
      data: preferences,
    });
  }
}
