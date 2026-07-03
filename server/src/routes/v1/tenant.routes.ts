import { Router } from "express";
import { TenantController } from "../../controllers/tenant.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import { catchAsync } from "../../utils/catch-async";
import { UserRole } from "@prisma/client";
import { updatePreferencesSchema } from "../../validators/tenant.validator";

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.TENANT));

router.get("/preferences", catchAsync(TenantController.getPreferences));
router.put(
  "/preferences",
  validate(updatePreferencesSchema),
  catchAsync(TenantController.updatePreferences)
);

export default router;
