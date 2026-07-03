import { User, OwnerProfile, TenantProfile, UserRole } from "@prisma/client";

export interface IUserRepository {
  // User CRUD
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Omit<User, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<User>;
  update(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User>;
  softDelete(id: string): Promise<User>;
  
  // Profile Management
  getOwnerProfile(userId: string): Promise<OwnerProfile | null>;
  getOrCreateOwnerProfile(userId: string): Promise<OwnerProfile>;
  createOwnerProfile(userId: string, data: Omit<OwnerProfile, "id" | "userId" | "createdAt" | "updatedAt">): Promise<OwnerProfile>;
  updateOwnerProfile(userId: string, data: Partial<Omit<OwnerProfile, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<OwnerProfile>;

  getTenantProfile(userId: string): Promise<TenantProfile | null>;
  createTenantProfile(userId: string, data: Omit<TenantProfile, "id" | "userId" | "createdAt" | "updatedAt">): Promise<TenantProfile>;
  updateTenantProfile(userId: string, data: Partial<Omit<TenantProfile, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<TenantProfile>;

  // Listing / Administrative Queries
  listUsers(filters: { role?: UserRole; isActive?: boolean; page: number; limit: number }): Promise<{ users: User[]; total: number }>;
}
