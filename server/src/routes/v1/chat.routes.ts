import { Router } from "express";
import { ChatController } from "../../controllers/chat.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catch-async";

const router = Router();

// Protect all chat endpoints with standard HTTP authentication middleware
router.use(authenticate);

router.get("/", catchAsync((req, res) => ChatController.getUserRooms(req, res)));
router.get("/:roomId/messages", catchAsync((req, res) => ChatController.getRoomMessages(req, res)));
router.post("/rooms", catchAsync((req, res) => ChatController.initializeChatRoom(req, res)));

export default router;
