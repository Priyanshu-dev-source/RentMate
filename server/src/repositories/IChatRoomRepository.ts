import { ChatRoom, ChatRoomParticipant, Message } from "@prisma/client";

export interface IChatRoomRepository {
  // Rooms
  createRoom(name?: string): Promise<ChatRoom>;
  findRoomById(id: string): Promise<ChatRoom | null>;
  addParticipant(chatRoomId: string, userId: string): Promise<ChatRoomParticipant>;
  removeParticipant(chatRoomId: string, userId: string): Promise<void>;
  getParticipants(chatRoomId: string): Promise<ChatRoomParticipant[]>;
  getUserRooms(userId: string): Promise<(ChatRoom & { participants: ChatRoomParticipant[] })[]>;

  // Messages
  createMessage(data: Omit<Message, "id" | "readAt" | "createdAt" | "updatedAt">): Promise<Message>;
  getRoomMessages(chatRoomId: string, options: { page: number; limit: number }): Promise<{ messages: Message[]; total: number }>;
  markMessagesAsRead(chatRoomId: string, userId: string): Promise<void>;
}
