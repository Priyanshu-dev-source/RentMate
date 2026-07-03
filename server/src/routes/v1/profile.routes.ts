import { Router } from "express";
import { ProfileController } from "../../controllers/profile.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate";
import { catchAsync } from "../../utils/catch-async";
import { updateProfileSchema } from "../../validators/profile.validator";

const router = Router();

// Retrieve own profile
router.get("/", authenticate, catchAsync(ProfileController.getProfile));
router.get("/me", authenticate, catchAsync(ProfileController.getProfile));

// Update own profile
router.put("/", authenticate, validate(updateProfileSchema), catchAsync(ProfileController.updateProfile));
router.put("/me", authenticate, validate(updateProfileSchema), catchAsync(ProfileController.updateProfile));

// Retrieve user/tenant profile by ID
router.get("/:id", authenticate, catchAsync(ProfileController.getProfileById));

export default router;
