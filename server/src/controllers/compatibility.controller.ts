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

  /**
   * Assess and retrieve compatibility with a batch of listings.
   */
  static async assessListingsBatch(req: Request, res: Response): Promise<Response> {
    const { listingIds } = req.body;
    if (!Array.isArray(listingIds)) {
      return ApiResponse.success({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "listingIds must be an array of strings",
        data: {},
      });
    }

    const results = await compatibilityService.getTenantListingsCompatibilityBatch(
      req.user!.id,
      listingIds
    );

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Batch compatibility evaluation retrieved successfully",
      data: results,
    });
  }

  /**
   * AI Smart Search Compatibility check
   */
  static async aiSmartSearch(req: Request, res: Response): Promise<Response> {
    const { environment, preferences, habits, listingIds } = req.body;
    if (!Array.isArray(listingIds)) {
      return ApiResponse.success({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "listingIds must be an array of strings",
        data: {},
      });
    }

    const results = await compatibilityService.getAISmartSearchCompatibility(
      req.user!.id,
      { environment: environment || "", preferences: preferences || "", habits: habits || "" },
      listingIds
    );

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "AI Smart Search matches calculated successfully",
      data: results,
    });
  }
}
