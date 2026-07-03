import { TenantProfile } from "@prisma/client";
import { UserRepository } from "../repositories/UserRepository";
import { UpdatePreferencesInput } from "../validators/tenant.validator";
import { AppError } from "../helpers/app-error";

export class TenantService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Fetch a Tenant's lifestyle preferences profile.
   */
  async getPreferences(userId: string): Promise<TenantProfile> {
    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    if (!tenantProfile) {
      throw AppError.notFound("Tenant profile not found");
    }
    return tenantProfile;
  }

  /**
   * Create or update a Tenant's lifestyle preferences profile.
   */
  async updatePreferences(userId: string, input: UpdatePreferencesInput): Promise<TenantProfile> {
    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    if (!tenantProfile) {
      throw AppError.notFound("Tenant profile not found");
    }

    return this.userRepository.updateTenantProfile(userId, {
      cleanliness: input.cleanliness,
      sleepSchedule: input.sleepSchedule,
      smoking: input.smoking,
      pets: input.pets,
      drinking: input.drinking,
      guestPolicy: input.guestPolicy,
      noiseLevel: input.noiseLevel,
      diet: input.diet,
      workSchedule: input.workSchedule,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
    });
  }
}
