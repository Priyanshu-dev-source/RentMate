import { Router } from "express";
import { HealthController } from "../../controllers/health.controller";
import { catchAsync } from "../../utils/catch-async";

const router = Router();

router.get("/health", catchAsync(HealthController.check));
router.get("/ping", HealthController.ping);

export default router;
