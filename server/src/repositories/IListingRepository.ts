import { Listing, ListingImage, ListingStatus, PropertyType, RoomType, SavedListing } from "@prisma/client";

export interface ListingFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  roomType?: RoomType;
  status?: ListingStatus;
  isFeatured?: boolean;
  searchQuery?: string;
  amenities?: string[];
}

export interface IListingRepository {
  findById(id: string): Promise<(Listing & { images: ListingImage[] }) | null>;
  create(data: Omit<Listing, "id" | "viewCount" | "isFeatured" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Listing>;
  update(id: string, data: Partial<Omit<Listing, "id" | "ownerId" | "createdAt" | "updatedAt">>): Promise<Listing>;
  softDelete(id: string): Promise<Listing>;
  incrementViewCount(id: string): Promise<void>;

  // Listing Images
  addImages(listingId: string, images: Omit<ListingImage, "id" | "listingId" | "createdAt" | "updatedAt">[]): Promise<ListingImage[]>;
  removeImage(imageId: string): Promise<void>;
  setPrimaryImage(listingId: string, imageId: string): Promise<void>;

  // Listing Queries
  listListings(filters: ListingFilters & { page: number; limit: number }): Promise<{ listings: (Listing & { images: ListingImage[] })[]; total: number }>;
  listByOwner(ownerId: string): Promise<(Listing & { images: ListingImage[] })[]>;

  // Saved Listings (Bookmarks)
  saveListing(userId: string, listingId: string): Promise<SavedListing>;
  unsaveListing(userId: string, listingId: string): Promise<void>;
  listSavedListings(userId: string): Promise<(SavedListing & { listing: Listing & { images: ListingImage[] } })[]>;
  isListingSaved(userId: string, listingId: string): Promise<boolean>;
}
