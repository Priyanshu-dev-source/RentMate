import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { socketAuthenticate } from "../middleware/socket.middleware";
import { ChatRoomRepository } from "../repositories/ChatRoomRepository";
import { OnlineTracker } from "./online-tracker";
import { logger } from "../utils/logger";
import { corsOptions } from "../config/cors";
import { AuthUser } from "../types/express.d";

let io: SocketIOServer | null = null;
const chatRoomRepository = new ChatRoomRepository();

export function initSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: corsOptions,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Setup security middleware
  io.use(socketAuthenticate);

  io.on("connection", async (socket) => {
    const socketData = socket.data as { user: AuthUser };
    const userId = socketData.user.id;
    logger.info(`Socket connected: ${socket.id} for user: ${userId}`);

    // Track online state and check if this is the user's first active connection
    const wasAlreadyOnline = OnlineTracker.isOnline(userId);
    OnlineTracker.setOnline(userId, socket.id);
    const isFirstConnection = !wasAlreadyOnline;

    // Fetch user's chat rooms
    const userRooms = await chatRoomRepository.getUserRooms(userId);
    logger.info(`User ${userId} has ${userRooms.length} rooms. Room IDs: ${userRooms.map(r => r.id).join(", ")}`);
    
    // Automatically join all room channels on connect/reconnect
    userRooms.forEach((room) => {
      void socket.join(room.id);
      logger.info(`Socket ${socket.id} joined room: ${room.id}`);
    });

    // Notify other users of online status in all mutual channels
    if (isFirstConnection) {
      userRooms.forEach((room) => {
        socket.to(room.id).emit("user_status", { userId, status: "online" });
      });
    }

    // Event: Explicitly join a new room channel (e.g. newly initialized chats)
    socket.on("join_room", async (payload: { roomId: string }) => {
      try {
        const { roomId } = payload;
        if (!roomId) {
          socket.emit("error", { message: "roomId is required" });
          return;
        }

        // Verify user is a participant of this room
        const participants = await chatRoomRepository.getParticipants(roomId);
        const isParticipant = participants.some((p) => p.userId === userId);
        if (!isParticipant) {
          socket.emit("error", { message: "Access denied: You are not a participant in this room" });
          return;
        }

        void socket.join(roomId);
        logger.info(`Socket ${socket.id} joined room channel: ${roomId}`);
      } catch (err: unknown) {
        logger.error(`Error in join_room: ${err instanceof Error ? err.message : String(err)}`);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Event: Sending a real-time message
    socket.on("send_message", async (payload: { roomId: string; content: string }) => {
      try {
        const { roomId, content } = payload;
        if (!roomId || !content || content.trim() === "") {
          socket.emit("error", { message: "Invalid message payload: roomId and content are required" });
          return;
        }

        // Verify user is in the room
        const participants = await chatRoomRepository.getParticipants(roomId);
        const isParticipant = participants.some((p) => p.userId === userId);
        if (!isParticipant) {
          socket.emit("error", { message: "Access denied: You are not a participant in this room" });
          return;
        }

        // Save message to Postgres database
        const message = await chatRoomRepository.createMessage({
          chatRoomId: roomId,
          senderId: userId,
          content,
        });

        // Broadcast the persistent message to the room channel (including sender)
        io!.to(roomId).emit("new_message", message);
      } catch (err: unknown) {
        logger.error(`Error in send_message: ${err instanceof Error ? err.message : String(err)}`);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Event: User typing indicator
    socket.on("typing", (payload: { roomId: string }) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("typing", { roomId, userId });
      }
    });

    // Event: User stopped typing indicator
    socket.on("stop_typing", (payload: { roomId: string }) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("stop_typing", { roomId, userId });
      }
    });

    // Event: Messages seen status update
    socket.on("mark_read", async (payload: { roomId: string }) => {
      try {
        const { roomId } = payload;
        if (!roomId) return;

        // Verify participant
        const participants = await chatRoomRepository.getParticipants(roomId);
        const isParticipant = participants.some((p) => p.userId === userId);
        if (!isParticipant) return;

        // Update readAt timestamp in DB
        await chatRoomRepository.markMessagesAsRead(roomId, userId);

        const readAt = new Date();
        // Notify others in room of read receipt
        socket.to(roomId).emit("messages_read", { roomId, readBy: userId, readAt });
      } catch (err: unknown) {
        logger.error(`Error in mark_read: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    // Event: Disconnection handling
    socket.on("disconnect", async () => {
      logger.info(`Socket disconnected: ${socket.id} for user: ${userId}`);
      OnlineTracker.setOffline(userId, socket.id);

      const isCompletelyOffline = !OnlineTracker.isOnline(userId);
      if (isCompletelyOffline) {
        // Broadcast offline status to all channels user belongs to
        const userRooms = await chatRoomRepository.getUserRooms(userId);
        userRooms.forEach((room) => {
          socket.to(room.id).emit("user_status", { userId, status: "offline" });
        });
      }
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
}
