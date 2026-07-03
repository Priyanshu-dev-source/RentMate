import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CompatibilityService } from "../services/CompatibilityService";
import { ApiResponse } from "../utils/api-response";

const compatibilityService = new CompatibilityService();

export class CompatibilityController {
  /**
   * Assess and retrieve compatibility with a property listing.
   */
  static async assessListing(req: Request, res: Response): Promise<Response> {
    const result = await compatibilityService.getTenantListingCompatibility(
      req.user!.id,
      req.params.listingId as string
    );

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Compatibility evaluation retrieved successfully",
      data: result,
    });
  }

  /**
   * Assess and retrieve compatibility with another tenant (roommate matching).
   */
  static async assessTenant(req: Request, res: Response): Promise<Response> {
    const result = await compatibilityService.getTenantTenantCompatibility(
      req.user!.id,
      req.params.targetUserId as string
    );

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Roommate compatibility evaluation retrieved successfully",
      data: result,
    });
  }
}
