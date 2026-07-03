import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import listingRoutes from "./listing.routes";
import tenantRoutes from "./tenant.routes";
import profileRoutes from "./profile.routes";
import interestRoutes from "./interest.routes";
import compatibilityRoutes from "./compatibility.routes";
import chatRoutes from "./chat.routes";
import uploadRoutes from "./upload.routes";

/**
 * API v1 Router Aggregator.
 *
 * WHY API VERSIONING:
 * All routes are prefixed with /api/v1/. When breaking changes are needed,
 * we create a v2/ directory and mount it at /api/v2/ — old clients continue
 * working against v1 until they migrate.
 *
 * USAGE (in app.ts):
 *   app.use("/api/v1", v1Router);
 *
 * Add new route files here as features are built:
 */
const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/listings", listingRoutes);
router.use("/tenants", tenantRoutes);
router.use("/profile", profileRoutes);
router.use("/interests", interestRoutes);
router.use("/compatibility", compatibilityRoutes);
router.use("/chat", chatRoutes);
router.use("/upload", uploadRoutes);

export default router;
