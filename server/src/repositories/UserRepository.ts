import { User, OwnerProfile, TenantProfile, UserRole } from "@prisma/client";
import { IUserRepository } from "./IUserRepository";
import { prisma } from "../config/database";

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<User> {
    // We execute user creation and profile creation in a transaction to guarantee data integrity
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data,
      });

      // Automatically create a profile based on role
      if (user.role === UserRole.OWNER) {
        await tx.ownerProfile.create({
          data: {
            userId: user.id,
            isVerified: false,
          },
        });
      } else if (user.role === UserRole.TENANT) {
        await tx.tenantProfile.create({
          data: {
            userId: user.id,
          },
        });
      }

      return user;
    });
  }

  async update(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getOwnerProfile(userId: string): Promise<OwnerProfile | null> {
    return prisma.ownerProfile.findUnique({
      where: { userId },
    });
  }

  async getOrCreateOwnerProfile(userId: string): Promise<OwnerProfile> {
    const user = await this.findById(userId);
    if (!user || user.role !== UserRole.OWNER) {
      throw new Error("Cannot create owner profile for non-owner user");
    }

    return prisma.ownerProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        isVerified: false,
      },
    });
  }

  async createOwnerProfile(
    userId: string,
    data: Omit<OwnerProfile, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<OwnerProfile> {
    return prisma.ownerProfile.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateOwnerProfile(
    userId: string,
    data: Partial<Omit<OwnerProfile, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<OwnerProfile> {
    return prisma.ownerProfile.update({
      where: { userId },
      data,
    });
  }

  async getTenantProfile(userId: string): Promise<TenantProfile | null> {
    return prisma.tenantProfile.findUnique({
      where: { userId },
    });
  }

  async createTenantProfile(
    userId: string,
    data: Omit<TenantProfile, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<TenantProfile> {
    return prisma.tenantProfile.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateTenantProfile(
    userId: string,
    data: Partial<Omit<TenantProfile, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<TenantProfile> {
    return prisma.tenantProfile.update({
      where: { userId },
      data,
    });
  }

  async listUsers(filters: {
    role?: UserRole;
    isActive?: boolean;
    page: number;
    limit: number;
  }): Promise<{ users: User[]; total: number }> {
    const { role, isActive, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }
}
