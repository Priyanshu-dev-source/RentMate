import { Router } from "express";
import { AuthController } from "../../controllers/auth.controller";
import { validate } from "../../middleware/validate";
import { catchAsync } from "../../utils/catch-async";
import { registerSchema, loginSchema, refreshTokenSchema } from "../../validators/auth.validator";
import { authRateLimiter } from "../../config/rate-limit";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { ApiResponse } from "../../utils/api-response";
import { UserRepository } from "../../repositories/UserRepository";

const router = Router();
const userRepository = new UserRepository();

// Apply authRateLimiter (10 requests/15 mins) on endpoints prone to brute forcing
router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  catchAsync(AuthController.register)
);

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  catchAsync(AuthController.login)
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  catchAsync(AuthController.refresh)
);

router.post("/logout", catchAsync(AuthController.logout));

// ── Test/Protected Endpoints for Authentication Verification ──

router.get("/me", authenticate, catchAsync(async (req, res) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, "Authentication required");
  }
  const user = await userRepository.findById(req.user.id);
  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }
  return ApiResponse.ok(
    res,
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    "User details fetched successfully"
  );
}));

router.get("/admin-only", authenticate, authorize(UserRole.ADMIN), (_req, res) => {
  return ApiResponse.ok(res, { adminAccess: true }, "Admin access granted");
});

router.get("/owner-only", authenticate, authorize(UserRole.OWNER), (_req, res) => {
  return ApiResponse.ok(res, { ownerAccess: true }, "Owner access granted");
});

router.get("/tenant-only", authenticate, authorize(UserRole.TENANT), (_req, res) => {
  return ApiResponse.ok(res, { tenantAccess: true }, "Tenant access granted");
});

export default router;
