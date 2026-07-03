import { z } from "zod";
import { InterestStatus } from "@prisma/client";

export const createInterestRequestSchema = z.object({
  listingId: z
    .string({ required_error: "Listing ID is required" })
    .uuid("Invalid listing ID format"),
  message: z
    .string()
    .max(500, "Message cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export const updateInterestStatusSchema = z.object({
  status: z.nativeEnum(InterestStatus, {
    errorMap: () => ({ message: "Invalid status transition" }),
  }),
});

export type CreateInterestRequestInput = z.infer<typeof createInterestRequestSchema>;
export type UpdateInterestStatusInput = z.infer<typeof updateInterestStatusSchema>;
