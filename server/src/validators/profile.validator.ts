import { z } from "zod";

export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must not exceed 50 characters")
      .trim()
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must not exceed 50 characters")
      .trim()
      .optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    bio: z
      .string()
      .max(500, "Bio must not exceed 500 characters")
      .optional()
      .nullable(),
    avatar: z
      .string()
      .url("Invalid avatar URL format")
      .optional()
      .nullable()
      .or(z.literal("").transform(() => undefined)),

    // Tenant Profile fields
    cleanliness: z
      .number()
      .int()
      .min(1, "Cleanliness rating must be between 1 and 5")
      .max(5, "Cleanliness rating must be between 1 and 5")
      .optional(),
    sleepSchedule: z
      .enum(["early_bird", "night_owl", "flexible"])
      .optional(),
    smoking: z
      .boolean()
      .optional(),
    pets: z
      .boolean()
      .optional(),
    drinking: z
      .boolean()
      .optional(),
    guestPolicy: z
      .enum(["never", "occasionally", "frequently"])
      .optional(),
    noiseLevel: z
      .enum(["quiet", "moderate", "lively"])
      .optional(),
    diet: z
      .enum(["vegetarian", "vegan", "non_vegetarian", "any"])
      .optional(),
    workSchedule: z
      .enum(["wfh", "office", "hybrid"])
      .optional(),
    budgetMin: z
      .number()
      .nonnegative("Minimum budget cannot be negative")
      .optional(),
    budgetMax: z
      .number()
      .nonnegative("Maximum budget cannot be negative")
      .optional(),

    // Owner Profile fields
    companyName: z
      .string()
      .max(100, "Company name must not exceed 100 characters")
      .optional()
      .nullable()
      .or(z.literal("").transform(() => undefined)),
    taxId: z
      .string()
      .max(50, "Tax ID must not exceed 50 characters")
      .optional()
      .nullable()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine(
    (data) => {
      if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
        return data.budgetMin <= data.budgetMax;
      }
      return true;
    },
    {
      message: "Minimum budget cannot be greater than maximum budget",
      path: ["budgetMax"],
    }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
