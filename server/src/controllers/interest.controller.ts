import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { InterestRequestService } from "../services/InterestRequestService";
import { ApiResponse } from "../utils/api-response";

const interestService = new InterestRequestService();

export class InterestController {
  static async create(req: Request, res: Response): Promise<Response> {
    const interest = await interestService.createInterestRequest(
      req.user!.id,
      req.body.listingId as string,
      req.body.message as string | undefined
    );
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.CREATED,
      message: "Interest request submitted successfully",
      data: interest,
    });
  }

  static async updateStatus(req: Request, res: Response): Promise<Response> {
    const interest = await interestService.updateInterestStatus(
      req.params.id as string,
      req.user!.id,
      req.body.status
    );
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: `Interest request status updated to ${req.body.status}`,
      data: interest,
    });
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    await interestService.deleteInterestRequest(req.params.id as string, req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Interest request deleted successfully",
      data: null,
    });
  }

  static async listTenantInterests(req: Request, res: Response): Promise<Response> {
    const interests = await interestService.getTenantInterests(req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Tenant interests retrieved successfully",
      data: interests,
    });
  }

  static async listListingInterests(req: Request, res: Response): Promise<Response> {
    const interests = await interestService.getListingInterests(req.params.listingId as string, req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Listing interests retrieved successfully",
      data: interests,
    });
  }
}
