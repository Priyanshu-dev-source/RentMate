import { z } from "zod";

export const updatePreferencesSchema = z.object({
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
    .nonnegative("Budget cannot be negative")
    .optional(),
  budgetMax: z
    .number()
    .nonnegative("Budget cannot be negative")
    .optional(),
}).refine((data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
}, {
  message: "budgetMin cannot be greater than budgetMax",
  path: ["budgetMax"],
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
