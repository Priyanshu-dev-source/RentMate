import { Compatibility } from "@prisma/client";

export interface ICompatibilityRepository {
  upsertTenantCompatibility(
    tenantProfileId: string,
    targetTenantId: string,
    score: number,
    details?: Record<string, any>
  ): Promise<Compatibility>;

  upsertListingCompatibility(
    tenantProfileId: string,
    targetListingId: string,
    score: number,
    details?: Record<string, any>
  ): Promise<Compatibility>;

  getTenantCompatibility(tenantProfileId: string, targetTenantId: string): Promise<Compatibility | null>;
  getListingCompatibility(tenantProfileId: string, targetListingId: string): Promise<Compatibility | null>;

  // Queries
  getTopMatchesForTenant(tenantProfileId: string, limit: number): Promise<Compatibility[]>;
  getTopListingsForTenant(tenantProfileId: string, limit: number): Promise<Compatibility[]>;
}
