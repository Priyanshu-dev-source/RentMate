import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ListingService } from "../services/ListingService";
import { ApiResponse } from "../utils/api-response";
import { PropertyType, RoomType, ListingStatus } from "@prisma/client";

const listingService = new ListingService();

export class ListingController {
  static async create(req: Request, res: Response): Promise<Response> {
    const listing = await listingService.createListing(req.user!.id, req.body);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.CREATED,
      message: "Listing created successfully",
      data: listing,
    });
  }

  static async update(req: Request, res: Response): Promise<Response> {
    const listing = await listingService.updateListing(req.params.id as string, req.user!.id, req.body);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Listing updated successfully",
      data: listing,
    });
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    await listingService.deleteListing(req.params.id as string, req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Listing deleted successfully",
      data: null,
    });
  }

  static async markFilled(req: Request, res: Response): Promise<Response> {
    const listing = await listingService.markFilled(req.params.id as string, req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Listing marked as filled successfully",
      data: listing,
    });
  }

  static async getDetails(req: Request, res: Response): Promise<Response> {
    const listing = await listingService.getListingDetails(req.params.id as string);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Listing details retrieved successfully",
      data: listing,
    });
  }

  static async listOwnerListings(req: Request, res: Response): Promise<Response> {
    const listings = await listingService.getOwnerListings(req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Owner listings retrieved successfully",
      data: listings,
    });
  }

  static async search(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const city = typeof req.query.city === "string" ? req.query.city : undefined;
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;
    const propertyType = req.query.propertyType as PropertyType;
    const roomType = req.query.roomType as RoomType;
    const isFeatured = req.query.isFeatured === "true" ? true : req.query.isFeatured === "false" ? false : undefined;
    const searchQuery = typeof req.query.q === "string" ? req.query.q : undefined;
    const amenities = typeof req.query.amenities === "string" ? req.query.amenities.split(",") : undefined;

    const result = await listingService.searchListings({
      city,
      minPrice,
      maxPrice,
      propertyType,
      roomType,
      status: ListingStatus.ACTIVE, // search defaults to ACTIVE listings
      isFeatured,
      searchQuery,
      amenities,
      page,
      limit,
    });

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Listings retrieved successfully",
      data: {
        listings: result.listings,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      },
    });
  }

  // ── Images ──

  static async addImages(req: Request, res: Response): Promise<Response> {
    const images = await listingService.addImages(req.params.id as string, req.user!.id, req.body.images);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.CREATED,
      message: "Images added successfully",
      data: images,
    });
  }

  static async removeImage(req: Request, res: Response): Promise<Response> {
    await listingService.removeImage(req.params.id as string, req.params.imageId as string, req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Image removed successfully",
      data: null,
    });
  }

  static async setPrimaryImage(req: Request, res: Response): Promise<Response> {
    await listingService.setPrimaryImage(req.params.id as string, req.params.imageId as string, req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Primary image set successfully",
      data: null,
    });
  }

  // ── Bookmarks ──

  static async saveListing(req: Request, res: Response): Promise<Response> {
    const saved = await listingService.saveListing(req.user!.id, req.params.id as string);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.CREATED,
      message: "Listing saved successfully",
      data: saved,
    });
  }

  static async unsaveListing(req: Request, res: Response): Promise<Response> {
    await listingService.unsaveListing(req.user!.id, req.params.id as string);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Listing unsaved successfully",
      data: null,
    });
  }

  static async getSavedListings(req: Request, res: Response): Promise<Response> {
    const saved = await listingService.getSavedListings(req.user!.id);
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Saved listings retrieved successfully",
      data: saved,
    });
  }
}
