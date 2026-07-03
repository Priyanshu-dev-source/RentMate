import { Compatibility } from "@prisma/client";
import { ICompatibilityRepository } from "./ICompatibilityRepository";
import { prisma } from "../config/database";

export class CompatibilityRepository implements ICompatibilityRepository {
  async getTenantCompatibility(
    tenantProfileId: string,
    targetTenantId: string
  ): Promise<Compatibility | null> {
    return prisma.compatibility.findFirst({
      where: {
        tenantProfileId,
        targetTenantId,
      },
    });
  }

  async getListingCompatibility(
    tenantProfileId: string,
    targetListingId: string
  ): Promise<Compatibility | null> {
    return prisma.compatibility.findFirst({
      where: {
        tenantProfileId,
        targetListingId,
      },
    });
  }

  async upsertTenantCompatibility(
    tenantProfileId: string,
    targetTenantId: string,
    score: number,
    details?: Record<string, any>
  ): Promise<Compatibility> {
    const existing = await this.getTenantCompatibility(tenantProfileId, targetTenantId);
    if (existing) {
      return prisma.compatibility.update({
        where: { id: existing.id },
        data: {
          score,
          details: details ?? existing.details ?? {},
        },
      });
    }

    return prisma.compatibility.create({
      data: {
        tenantProfileId,
        targetTenantId,
        score,
        details: details ?? {},
      },
    });
  }

  async upsertListingCompatibility(
    tenantProfileId: string,
    targetListingId: string,
    score: number,
    details?: Record<string, any>
  ): Promise<Compatibility> {
    const existing = await this.getListingCompatibility(tenantProfileId, targetListingId);
    if (existing) {
      return prisma.compatibility.update({
        where: { id: existing.id },
        data: {
          score,
          details: details ?? existing.details ?? {},
        },
      });
    }

    return prisma.compatibility.create({
      data: {
        tenantProfileId,
        targetListingId,
        score,
        details: details ?? {},
      },
    });
  }

  async getTopMatchesForTenant(
    tenantProfileId: string,
    limit: number
  ): Promise<Compatibility[]> {
    return prisma.compatibility.findMany({
      where: {
        tenantProfileId,
        targetTenantId: { not: null },
      },
      orderBy: {
        score: "desc",
      },
      take: limit,
    });
  }

  async getTopListingsForTenant(
    tenantProfileId: string,
    limit: number
  ): Promise<Compatibility[]> {
    return prisma.compatibility.findMany({
      where: {
        tenantProfileId,
        targetListingId: { not: null },
      },
      orderBy: {
        score: "desc",
      },
      take: limit,
    });
  }
}
