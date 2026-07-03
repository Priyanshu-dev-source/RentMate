import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse } from "../utils/api-response";
import { AppError } from "../helpers/app-error";
import { UserRole } from "@prisma/client";
import { UpdateProfileInput } from "../validators/profile.validator";

export class ProfileController {
  /**
   * Get the current user's profile details.
   */
  static async getProfile(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        bio: true,
        role: true,
      },
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    let tenantProfile = null;
    let ownerProfile = null;

    if (user.role === UserRole.TENANT) {
      tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: user.id },
      });
    } else if (user.role === UserRole.OWNER) {
      ownerProfile = await prisma.ownerProfile.findUnique({
        where: { userId: user.id },
      });
    }

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Profile retrieved successfully",
      data: {
        user,
        tenantProfile,
        ownerProfile,
      },
    });
  }

  /**
   * Update the current user's profile details.
   */
  static async updateProfile(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const input: UpdateProfileInput = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Prepare user update data
      const userUpdateData: any = {};
      if (input.firstName !== undefined) userUpdateData.firstName = input.firstName;
      if (input.lastName !== undefined) userUpdateData.lastName = input.lastName;
      if (input.phone !== undefined) userUpdateData.phone = input.phone;
      if (input.bio !== undefined) userUpdateData.bio = input.bio;
      if (input.avatar !== undefined) userUpdateData.avatar = input.avatar;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: userUpdateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          bio: true,
          role: true,
        },
      });

      let updatedProfile = null;

      // 2. Prepare and update role-specific profiles
      if (userRole === UserRole.TENANT) {
        const tenantData: any = {};
        if (input.cleanliness !== undefined) tenantData.cleanliness = input.cleanliness;
        if (input.sleepSchedule !== undefined) tenantData.sleepSchedule = input.sleepSchedule;
        if (input.smoking !== undefined) tenantData.smoking = input.smoking;
        if (input.pets !== undefined) tenantData.pets = input.pets;
        if (input.drinking !== undefined) tenantData.drinking = input.drinking;
        if (input.guestPolicy !== undefined) tenantData.guestPolicy = input.guestPolicy;
        if (input.noiseLevel !== undefined) tenantData.noiseLevel = input.noiseLevel;
        if (input.diet !== undefined) tenantData.diet = input.diet;
        if (input.workSchedule !== undefined) tenantData.workSchedule = input.workSchedule;
        if (input.budgetMin !== undefined) tenantData.budgetMin = input.budgetMin;
        if (input.budgetMax !== undefined) tenantData.budgetMax = input.budgetMax;

        updatedProfile = await tx.tenantProfile.upsert({
          where: { userId },
          update: tenantData,
          create: {
            ...tenantData,
            userId,
          },
        });
      } else if (userRole === UserRole.OWNER) {
        const ownerData: any = {};
        if (input.companyName !== undefined) ownerData.companyName = input.companyName;
        if (input.taxId !== undefined) ownerData.taxId = input.taxId;

        updatedProfile = await tx.ownerProfile.upsert({
          where: { userId },
          update: ownerData,
          create: {
            ...ownerData,
            userId,
          },
        });
      }

      return { user: updatedUser, profile: updatedProfile };
    });

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Profile updated successfully",
      data: {
        user: result.user,
        tenantProfile: userRole === UserRole.TENANT ? result.profile : null,
        ownerProfile: userRole === UserRole.OWNER ? result.profile : null,
      },
    });
  }

  static async getProfileById(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string;

    // 1. Try to find user directly by ID
    let user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        bio: true,
        role: true,
      },
    });

    let tenantProfile = null;
    let ownerProfile = null;

    if (user) {
      if (user.role === UserRole.TENANT) {
        tenantProfile = await prisma.tenantProfile.findUnique({
          where: { userId: user.id },
        });
      } else if (user.role === UserRole.OWNER) {
        ownerProfile = await prisma.ownerProfile.findUnique({
          where: { userId: user.id },
        });
      }
    } else {
      // 2. If not found by user ID, try finding in tenant profiles by profile ID
      tenantProfile = await prisma.tenantProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              bio: true,
              role: true,
            },
          },
        },
      });

      if (tenantProfile) {
        user = (tenantProfile as any).user;
        // Clean the circular reference before returning
        delete (tenantProfile as any).user;
      } else {
        // 3. Try finding in owner profiles by profile ID
        ownerProfile = await prisma.ownerProfile.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
                bio: true,
                role: true,
              },
            },
          },
        });

        if (ownerProfile) {
          user = (ownerProfile as any).user;
          // Clean the circular reference before returning
          delete (ownerProfile as any).user;
        }
      }
    }

    if (!user) {
      throw AppError.notFound("Profile not found");
    }

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Profile details retrieved successfully",
      data: {
        user,
        tenantProfile,
        ownerProfile,
      },
    });
  }
}
