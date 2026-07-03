import { Router } from "express";
import { ListingController } from "../../controllers/listing.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import { catchAsync } from "../../utils/catch-async";
import { UserRole } from "@prisma/client";
import {
  createListingSchema,
  updateListingSchema,
  addImagesSchema,
} from "../../validators/listing.validator";

const router = Router();

// ═══════════════════════════════════════════════════════════════════
// ROUTE ORDERING NOTE:
// Named routes (e.g. /user/saved, /owner/all) MUST appear BEFORE
// the wildcard /:id route, otherwise Express matches ":id" = "user"
// or ":id" = "owner" and the request never reaches the real handler.
// ═══════════════════════════════════════════════════════════════════

// ── Public Routes (no auth required) ──
router.get("/", catchAsync(ListingController.search));

// ── Authenticated Named Routes (before /:id wildcard) ──
router.get("/user/saved", authenticate, catchAsync(ListingController.getSavedListings));

router.get(
  "/owner/all",
  authenticate,
  authorize(UserRole.OWNER),
  catchAsync(ListingController.listOwnerListings)
);

router.post(
  "/",
  authenticate,
  authorize(UserRole.OWNER),
  validate(createListingSchema),
  catchAsync(ListingController.create)
);

// ── Wildcard :id routes (AFTER named routes) ──
// GET /:id is PUBLIC so anyone can view listing details
router.get("/:id", catchAsync(ListingController.getDetails));

// Bookmarks (authenticated)
router.post("/:id/save", authenticate, catchAsync(ListingController.saveListing));
router.delete("/:id/save", authenticate, catchAsync(ListingController.unsaveListing));

// Owner management (authenticated + OWNER role)
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.OWNER),
  validate(updateListingSchema),
  catchAsync(ListingController.update)
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.OWNER),
  catchAsync(ListingController.delete)
);

router.patch(
  "/:id/fill",
  authenticate,
  authorize(UserRole.OWNER),
  catchAsync(ListingController.markFilled)
);

// Images Management (authenticated + OWNER role)
router.post(
  "/:id/images",
  authenticate,
  authorize(UserRole.OWNER),
  validate(addImagesSchema),
  catchAsync(ListingController.addImages)
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize(UserRole.OWNER),
  catchAsync(ListingController.removeImage)
);

router.patch(
  "/:id/images/:imageId/primary",
  authenticate,
  authorize(UserRole.OWNER),
  catchAsync(ListingController.setPrimaryImage)
);

export default router;
