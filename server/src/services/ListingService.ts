import { Listing, ListingImage, SavedListing, ListingStatus } from "@prisma/client";
import { ListingRepository } from "../repositories/ListingRepository";
import { UserRepository } from "../repositories/UserRepository";
import { CreateListingInput, UpdateListingInput, AddImageInput } from "../validators/listing.validator";
import { AppError } from "../helpers/app-error";
import { ListingFilters } from "../repositories/IListingRepository";

export class ListingService {
  private listingRepository: ListingRepository;
  private userRepository: UserRepository;

  constructor() {
    this.listingRepository = new ListingRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Create a new room/apartment listing.
   */
  async createListing(userId: string, input: CreateListingInput): Promise<Listing> {
    const ownerProfile = await this.userRepository.getOrCreateOwnerProfile(userId);

    return this.listingRepository.create({
      ownerId: ownerProfile.id,
      title: input.title,
      description: input.description,
      price: input.price,
      deposit: input.deposit ?? null,
      propertyType: input.propertyType,
      roomType: input.roomType,
      status: ListingStatus.DRAFT, // default status
      address: input.address,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode ?? null,
      country: input.country,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area ?? null,
      furnishing: input.furnishing ?? null,
      availableFrom: input.availableFrom ?? new Date(),
      maxOccupants: input.maxOccupants,
      amenities: input.amenities,
      rules: input.rules,
    });
  }

  /**
   * Update listing details.
   */
  async updateListing(
    listingId: string,
    userId: string,
    input: UpdateListingInput
  ): Promise<Listing> {
    await this.verifyOwnership(listingId, userId);

    return this.listingRepository.update(listingId, {
      title: input.title,
      description: input.description,
      price: input.price,
      deposit: input.deposit,
      propertyType: input.propertyType,
      roomType: input.roomType,
      status: input.status,
      address: input.address,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      country: input.country,
      latitude: input.latitude,
      longitude: input.longitude,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area,
      furnishing: input.furnishing,
      availableFrom: input.availableFrom,
      maxOccupants: input.maxOccupants,
      amenities: input.amenities,
      rules: input.rules,
    });
  }

  /**
   * Delete a listing.
   */
  async deleteListing(listingId: string, userId: string): Promise<Listing> {
    await this.verifyOwnership(listingId, userId);
    return this.listingRepository.softDelete(listingId);
  }

  /**
   * Mark listing status as FILLED.
   */
  async markFilled(listingId: string, userId: string): Promise<Listing> {
    await this.verifyOwnership(listingId, userId);
    return this.listingRepository.update(listingId, {
      status: ListingStatus.FILLED,
    });
  }

  /**
   * Upload and attach images to a listing.
   */
  async addImages(
    listingId: string,
    userId: string,
    images: AddImageInput[]
  ): Promise<ListingImage[]> {
    await this.verifyOwnership(listingId, userId);
    
    const formattedImages = images.map((img) => ({
      url: img.url,
      altText: img.altText ?? null,
      isPrimary: img.isPrimary,
      order: img.order,
    }));

    return this.listingRepository.addImages(listingId, formattedImages);
  }

  /**
   * Remove an image from a listing.
   */
  async removeImage(listingId: string, imageId: string, userId: string): Promise<void> {
    await this.verifyOwnership(listingId, userId);
    await this.listingRepository.removeImage(imageId);
  }

  /**
   * Mark an image as the listing's primary cover image.
   */
  async setPrimaryImage(listingId: string, imageId: string, userId: string): Promise<void> {
    await this.verifyOwnership(listingId, userId);
    await this.listingRepository.setPrimaryImage(listingId, imageId);
  }

  /**
   * Get single listing details (increments views).
   */
  async getListingDetails(listingId: string): Promise<Listing & { images: ListingImage[] }> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw AppError.notFound("Listing not found");
    }

    // Fire-and-forget view count increment
    this.listingRepository.incrementViewCount(listingId).catch((err) => {
      console.error(`Failed to increment viewCount for listing ${listingId}:`, err);
    });

    return listing;
  }

  /**
   * Search / Filter listings with pagination.
   */
  async searchListings(
    filters: ListingFilters & { page: number; limit: number }
  ): Promise<{ listings: (Listing & { images: ListingImage[] })[]; total: number }> {
    return this.listingRepository.listListings(filters);
  }

  /**
   * List all listings created by a specific owner.
   */
  async getOwnerListings(userId: string): Promise<(Listing & { images: ListingImage[] })[]> {
    const ownerProfile = await this.userRepository.getOrCreateOwnerProfile(userId);
    return this.listingRepository.listByOwner(ownerProfile.id);
  }

  // ── Saved Listings (Bookmarks) ──

  async saveListing(userId: string, listingId: string): Promise<SavedListing> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw AppError.notFound("Listing not found");
    }

    const alreadySaved = await this.listingRepository.isListingSaved(userId, listingId);
    if (alreadySaved) {
      throw AppError.conflict("Listing is already bookmarked");
    }

    return this.listingRepository.saveListing(userId, listingId);
  }

  async unsaveListing(userId: string, listingId: string): Promise<void> {
    const alreadySaved = await this.listingRepository.isListingSaved(userId, listingId);
    if (!alreadySaved) {
      throw AppError.notFound("Bookmark not found");
    }

    await this.listingRepository.unsaveListing(userId, listingId);
  }

  async getSavedListings(userId: string): Promise<(SavedListing & { listing: Listing & { images: ListingImage[] } })[]> {
    return this.listingRepository.listSavedListings(userId);
  }

  // ── Helper Verification ──

  private async verifyOwnership(listingId: string, userId: string): Promise<Listing> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw AppError.notFound("Listing not found");
    }

    const ownerProfile = await this.userRepository.getOrCreateOwnerProfile(userId);
    if (listing.ownerId !== ownerProfile.id) {
      throw AppError.forbidden("Access denied: You do not own this listing");
    }

    return listing;
  }
}
