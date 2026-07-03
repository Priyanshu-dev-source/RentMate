import { InterestRequest, InterestStatus } from "@prisma/client";
import { InterestRequestRepository } from "../repositories/InterestRequestRepository";
import { ListingRepository } from "../repositories/ListingRepository";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../helpers/app-error";
import { CompatibilityService } from "./CompatibilityService";
import { NotificationService } from "./NotificationService";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";

export class InterestRequestService {
  private interestRepository: InterestRequestRepository;
  private listingRepository: ListingRepository;
  private userRepository: UserRepository;
  private compatibilityService: CompatibilityService;

  constructor() {
    this.interestRepository = new InterestRequestRepository();
    this.listingRepository = new ListingRepository();
    this.userRepository = new UserRepository();
    this.compatibilityService = new CompatibilityService();
  }

  /**
   * Submit an interest request from a tenant to a listing.
   */
  async createInterestRequest(
    userId: string,
    listingId: string,
    message?: string
  ): Promise<InterestRequest> {
    // 1. Fetch tenant profile
    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    if (!tenantProfile) {
      throw AppError.forbidden("You must have a Tenant Profile to send interest requests");
    }

    // 2. Fetch target listing
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw AppError.notFound("Listing not found");
    }

    if (listing.status !== "ACTIVE") {
      throw AppError.badRequest("You can only express interest in active listings");
    }

    // 3. Prevent duplicate requests
    const existing = await this.interestRepository.findByTenantAndListing(
      tenantProfile.id,
      listingId
    );
    if (existing) {
      throw AppError.conflict("You have already sent an interest request for this listing");
    }

    // 4. Create the request
    const request = await this.interestRepository.create({
      tenantProfileId: tenantProfile.id,
      listingId,
      message: message || null,
    });

    // 5. Check compatibility and trigger alert if score >= 80
    try {
      const listingWithOwner = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          owner: {
            include: {
              user: true,
            },
          },
        },
      });

      const tenantUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (listingWithOwner && tenantUser) {
        const ownerEmail = listingWithOwner.owner.user.email;
        const tenantName = `${tenantUser.firstName} ${tenantUser.lastName}`;
        const listingTitle = listingWithOwner.title;

        const comp = await this.compatibilityService.getTenantListingCompatibility(userId, listingId);
        if (comp.score >= 80) {
          const detailsUrl = `http://localhost:3000/dashboard/compatibility/${comp.id}`;
          await NotificationService.enqueueHighCompatibilityAlert(
            tenantName,
            ownerEmail,
            listingTitle,
            comp.score,
            message || null,
            detailsUrl
          );
        }
      }
    } catch (err: unknown) {
      logger.error(`Error queueing high compatibility alert: ${err instanceof Error ? err.message : String(err)}`);
    }

    return request;
  }

  /**
   * Update interest request status (accept, reject, withdraw).
   */
  async updateInterestStatus(
    interestId: string,
    userId: string,
    status: InterestStatus
  ): Promise<InterestRequest> {
    const interest = await this.interestRepository.findById(interestId);
    if (!interest) {
      throw AppError.notFound("Interest request not found");
    }

    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    const ownerProfile = await this.userRepository.getOwnerProfile(userId);

    // Case 1: Tenant withdrawing their own request
    if (status === InterestStatus.WITHDRAWN) {
      if (!tenantProfile || interest.tenantProfileId !== tenantProfile.id) {
        throw AppError.forbidden("Only the sender can withdraw this interest request");
      }
      return this.interestRepository.updateStatus(interestId, InterestStatus.WITHDRAWN);
    }

    // Case 2: Owner accepting/rejecting the request
    if (status === InterestStatus.ACCEPTED || status === InterestStatus.REJECTED) {
      const listing = await this.listingRepository.findById(interest.listingId);
      if (!listing || !ownerProfile || listing.ownerId !== ownerProfile.id) {
        throw AppError.forbidden("Only the owner of the listing can accept/reject interest requests");
      }
      
      const updatedRequest = await this.interestRepository.updateStatus(interestId, status);

      // Trigger status update alert
      try {
        const tenant = await prisma.tenantProfile.findUnique({
          where: { id: interest.tenantProfileId },
          include: { user: true },
        });

        const ownerUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (tenant && ownerUser) {
          const tenantEmail = tenant.user.email;
          const tenantName = `${tenant.user.firstName} ${tenant.user.lastName}`;
          const ownerName = `${ownerUser.firstName} ${ownerUser.lastName}`;
          const listingTitle = listing.title;
          const chatUrl = `http://localhost:3000/chat`;

          await NotificationService.enqueueInterestStatusAlert(
            tenantName,
            tenantEmail,
            ownerName,
            listingTitle,
            status,
            chatUrl
          );
        }
      } catch (err: unknown) {
        logger.error(`Error queueing interest status update alert: ${err instanceof Error ? err.message : String(err)}`);
      }

      return updatedRequest;
    }

    throw AppError.badRequest("Invalid interest request status update");
  }

  /**
   * Delete an interest request.
   */
  async deleteInterestRequest(interestId: string, userId: string): Promise<void> {
    const interest = await this.interestRepository.findById(interestId);
    if (!interest) {
      throw AppError.notFound("Interest request not found");
    }

    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    if (!tenantProfile || interest.tenantProfileId !== tenantProfile.id) {
      throw AppError.forbidden("Only the tenant who created the request can delete it");
    }

    await this.interestRepository.delete(interestId);
  }

  /**
   * List interest requests submitted by a specific tenant.
   */
  async getTenantInterests(
    userId: string
  ): Promise<(InterestRequest & { listing: { title: string; price: number } })[]> {
    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    if (!tenantProfile) {
      throw AppError.forbidden("You must have a Tenant Profile to view interests");
    }
    return this.interestRepository.listByTenant(tenantProfile.id);
  }

  /**
   * List all interest requests received by a listing (Owner only).
   */
  async getListingInterests(listingId: string, userId: string): Promise<InterestRequest[]> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw AppError.notFound("Listing not found");
    }

    const ownerProfile = await this.userRepository.getOwnerProfile(userId);
    if (!ownerProfile || listing.ownerId !== ownerProfile.id) {
      throw AppError.forbidden("Access denied: You do not own this listing");
    }

    return this.interestRepository.listByListing(listingId);
  }
}
