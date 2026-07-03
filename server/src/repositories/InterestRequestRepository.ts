import { InterestRequest, InterestStatus } from "@prisma/client";
import { IInterestRequestRepository } from "./IInterestRequestRepository";
import { prisma } from "../config/database";

export class InterestRequestRepository implements IInterestRequestRepository {
  async findById(id: string): Promise<InterestRequest | null> {
    return prisma.interestRequest.findUnique({
      where: { id },
    });
  }

  async findByTenantAndListing(tenantProfileId: string, listingId: string): Promise<InterestRequest | null> {
    return prisma.interestRequest.findUnique({
      where: {
        tenantProfileId_listingId: {
          tenantProfileId,
          listingId,
        },
      },
    });
  }

  async create(data: Omit<InterestRequest, "id" | "status" | "createdAt" | "updatedAt">): Promise<InterestRequest> {
    return prisma.interestRequest.create({
      data,
    });
  }

  async updateStatus(id: string, status: InterestStatus): Promise<InterestRequest> {
    return prisma.interestRequest.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.interestRequest.delete({
      where: { id },
    });
  }

  async listByTenant(
    tenantProfileId: string
  ): Promise<(InterestRequest & { listing: { title: string; price: number } })[]> {
    return prisma.interestRequest.findMany({
      where: { tenantProfileId },
      include: {
        listing: {
          select: {
            title: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listByListing(listingId: string): Promise<any[]> {
    const interests = await prisma.interestRequest.findMany({
      where: { listingId },
      include: {
        tenant: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true,
                bio: true,
              },
            },
          },
        },
        listing: {
          select: {
            title: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const tenantProfileIds = interests.map((i) => i.tenantProfileId);
    const compatibilities = await prisma.compatibility.findMany({
      where: {
        tenantProfileId: { in: tenantProfileIds },
        targetListingId: listingId,
      },
      select: {
        tenantProfileId: true,
        score: true,
      },
    });

    const compMap = new Map(compatibilities.map((c) => [c.tenantProfileId, c.score]));

    return interests.map((i) => ({
      ...i,
      matchScore: compMap.get(i.tenantProfileId) || 0,
    }));
  }
}
