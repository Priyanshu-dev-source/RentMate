import { Listing, ListingImage, SavedListing } from "@prisma/client";
import { IListingRepository, ListingFilters } from "./IListingRepository";
import { prisma } from "../config/database";

export class ListingRepository implements IListingRepository {
  async findById(id: string): Promise<(Listing & { images: ListingImage[] }) | null> {
    return prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: { images: true },
    });
  }

  async create(
    data: Omit<Listing, "id" | "viewCount" | "isFeatured" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<Listing> {
    return prisma.listing.create({
      data,
    });
  }

  async update(id: string, data: Partial<Omit<Listing, "id" | "ownerId" | "createdAt" | "updatedAt">>): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Listing> {
    return prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async addImages(listingId: string, images: Omit<ListingImage, "id" | "listingId" | "createdAt" | "updatedAt">[]): Promise<ListingImage[]> {
    return prisma.$transaction(async (tx) => {
      const createdImages = [];
      for (const img of images) {
        const created = await tx.listingImage.create({
          data: {
            ...img,
            listingId,
          },
        });
        createdImages.push(created);
      }
      return createdImages;
    });
  }

  async removeImage(imageId: string): Promise<void> {
    await prisma.listingImage.delete({
      where: { id: imageId },
    });
  }

  async setPrimaryImage(listingId: string, imageId: string): Promise<void> {
    await prisma.$transaction([
      prisma.listingImage.updateMany({
        where: { listingId },
        data: { isPrimary: false },
      }),
      prisma.listingImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
  }

  async listListings(
    filters: ListingFilters & { page: number; limit: number }
  ): Promise<{ listings: (Listing & { images: ListingImage[] })[]; total: number }> {
    const {
      city,
      minPrice,
      maxPrice,
      propertyType,
      roomType,
      status,
      isFeatured,
      searchQuery,
      amenities,
      page,
      limit,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(status && { status }),
      ...(city && { city: { equals: city, mode: "insensitive" } }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(propertyType && { propertyType }),
      ...(roomType && { roomType }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
      ...(amenities && amenities.length > 0 && {
        amenities: { hasEvery: amenities },
      }),
      ...(searchQuery && {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
          { address: { contains: searchQuery, mode: "insensitive" } },
        ],
      }),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { images: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count({ where }),
    ]);

    return { listings, total };
  }

  async listByOwner(ownerId: string): Promise<(Listing & { images: ListingImage[] })[]> {
    return prisma.listing.findMany({
      where: { ownerId, deletedAt: null },
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Saved Listings (Bookmarks)
  async saveListing(userId: string, listingId: string): Promise<SavedListing> {
    return prisma.savedListing.create({
      data: {
        userId,
        listingId,
      },
    });
  }

  async unsaveListing(userId: string, listingId: string): Promise<void> {
    await prisma.savedListing.deleteMany({
      where: {
        userId,
        listingId,
      },
    });
  }

  async listSavedListings(userId: string): Promise<(SavedListing & { listing: Listing & { images: ListingImage[] } })[]> {
    return prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }) as any;
  }

  async isListingSaved(userId: string, listingId: string): Promise<boolean> {
    const saved = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });
    return !!saved;
  }
}
