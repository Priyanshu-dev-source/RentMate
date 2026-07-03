import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ChatService } from "../services/ChatService";
import { ApiResponse } from "../utils/api-response";

const chatService = new ChatService();

export class ChatController {
  /**
   * Fetch all rooms the logged-in user is participating in.
   */
  static async getUserRooms(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const rooms = await chatService.getUserRooms(userId);

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Chat rooms retrieved successfully",
      data: rooms,
    });
  }

  /**
   * Fetch paginated message history for a specific room.
   */
  static async getRoomMessages(req: Request, res: Response): Promise<Response> {
    const roomId = req.params.roomId as string;
    const userId = req.user!.id;
    const page = typeof req.query.page === "string" ? parseInt(req.query.page) : 1;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit) : 20;

    const { messages, total } = await chatService.getRoomMessages(roomId, userId, page, limit);

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Messages retrieved successfully",
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }

  /**
   * Create or fetch a private room with another user.
   */
  static async initializeChatRoom(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { targetUserId } = req.body as { targetUserId: string };

    const room = await chatService.initializeChatRoom(userId, targetUserId);

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Chat room initialized successfully",
      data: room,
    });
  }
}
