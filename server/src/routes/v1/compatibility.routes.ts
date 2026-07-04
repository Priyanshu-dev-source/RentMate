import { Router } from "express";
import { CompatibilityController } from "../../controllers/compatibility.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catch-async";
import { UserRole } from "@prisma/client";

const router = Router();

// Only authenticated tenants can check compatibility
router.use(authenticate);
router.use(authorize(UserRole.TENANT));

router.post("/search/ai", catchAsync(CompatibilityController.aiSmartSearch));
router.post("/listings/batch", catchAsync(CompatibilityController.assessListingsBatch));
router.post("/listing/:listingId", catchAsync(CompatibilityController.assessListing));
router.post("/tenant/:targetUserId", catchAsync(CompatibilityController.assessTenant));

export default router;
