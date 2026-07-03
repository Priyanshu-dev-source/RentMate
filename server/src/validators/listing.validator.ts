import { z } from "zod";
import { PropertyType, RoomType, ListingStatus } from "@prisma/client";

export const createListingSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(5, "Title must be at least 5 characters long")
    .max(100, "Title must not exceed 100 characters")
    .trim(),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters long")
    .max(1000, "Description must not exceed 1000 characters")
    .trim(),
  price: z
    .number({ required_error: "Price is required" })
    .positive("Price must be a positive number"),
  deposit: z
    .number()
    .nonnegative("Deposit cannot be negative")
    .optional(),
  propertyType: z.nativeEnum(PropertyType, {
    errorMap: () => ({ message: "Invalid property type" }),
  }),
  roomType: z.nativeEnum(RoomType, {
    errorMap: () => ({ message: "Invalid room type" }),
  }),
  address: z
    .string({ required_error: "Address is required" })
    .min(5, "Address must be at least 5 characters")
    .trim(),
  city: z
    .string({ required_error: "City is required" })
    .min(2, "City name must be at least 2 characters")
    .trim(),
  state: z
    .string({ required_error: "State is required" })
    .min(2, "State name must be at least 2 characters")
    .trim(),
  zipCode: z
    .string()
    .min(4, "Invalid ZIP code format")
    .optional(),
  country: z
    .string()
    .trim()
    .default("India"),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional(),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .optional(),
  bedrooms: z
    .number()
    .int()
    .positive("Bedrooms count must be at least 1")
    .default(1),
  bathrooms: z
    .number()
    .int()
    .positive("Bathrooms count must be at least 1")
    .default(1),
  area: z
    .number()
    .positive()
    .optional(),
  furnishing: z
    .string()
    .optional(),
  availableFrom: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  maxOccupants: z
    .number()
    .int()
    .positive()
    .default(1),
  amenities: z
    .array(z.string())
    .default([]),
  rules: z
    .array(z.string())
    .default([]),
});

export const updateListingSchema = createListingSchema.partial().extend({
  status: z.nativeEnum(ListingStatus).optional(),
});

export const addImageSchema = z.object({
  url: z
    .string({ required_error: "Image URL is required" })
    .url("Invalid URL format"),
  altText: z
    .string()
    .optional(),
  isPrimary: z
    .boolean()
    .default(false),
  order: z
    .number()
    .int()
    .nonnegative()
    .default(0),
});

export const addImagesSchema = z.object({
  images: z.array(addImageSchema).min(1, "At least one image is required"),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type AddImageInput = z.infer<typeof addImageSchema>;
export type AddImagesInput = z.infer<typeof addImagesSchema>;
