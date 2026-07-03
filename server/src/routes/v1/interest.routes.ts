import { Router } from "express";
import { InterestController } from "../../controllers/interest.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import { catchAsync } from "../../utils/catch-async";
import { UserRole } from "@prisma/client";
import {
  createInterestRequestSchema,
  updateInterestStatusSchema,
} from "../../validators/interest.validator";

const router = Router();

router.use(authenticate);

// Tenant specific
router.post(
  "/",
  authorize(UserRole.TENANT),
  validate(createInterestRequestSchema),
  catchAsync(InterestController.create)
);

router.get(
  "/tenant/all",
  authorize(UserRole.TENANT),
  catchAsync(InterestController.listTenantInterests)
);

router.delete(
  "/:id",
  authorize(UserRole.TENANT),
  catchAsync(InterestController.delete)
);

// Shared / Role checked inside service
router.patch(
  "/:id/status",
  validate(updateInterestStatusSchema),
  catchAsync(InterestController.updateStatus)
);

router.get(
  "/listing/:listingId",
  catchAsync(InterestController.listListingInterests)
);

export default router;
