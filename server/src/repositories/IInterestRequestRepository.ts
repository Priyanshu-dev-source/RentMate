import { InterestRequest, InterestStatus } from "@prisma/client";

export interface IInterestRequestRepository {
  findById(id: string): Promise<InterestRequest | null>;
  findByTenantAndListing(tenantProfileId: string, listingId: string): Promise<InterestRequest | null>;
  create(data: Omit<InterestRequest, "id" | "status" | "createdAt" | "updatedAt">): Promise<InterestRequest>;
  updateStatus(id: string, status: InterestStatus): Promise<InterestRequest>;
  delete(id: string): Promise<void>;

  // Queries
  listByTenant(tenantProfileId: string): Promise<(InterestRequest & { listing: { title: string; price: number } })[]>;
  listByListing(listingId: string): Promise<InterestRequest[]>;
}
