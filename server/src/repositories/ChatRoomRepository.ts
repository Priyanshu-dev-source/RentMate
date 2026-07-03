import { ChatRoom, ChatRoomParticipant, Message } from "@prisma/client";
import { IChatRoomRepository } from "./IChatRoomRepository";
import { prisma } from "../config/database";

export class ChatRoomRepository implements IChatRoomRepository {
  async createRoom(name?: string): Promise<ChatRoom> {
    return prisma.chatRoom.create({
      data: {
        name: name || null,
      },
    });
  }

  async findRoomById(id: string): Promise<ChatRoom | null> {
    return prisma.chatRoom.findUnique({
      where: { id },
    });
  }

  async addParticipant(chatRoomId: string, userId: string): Promise<ChatRoomParticipant> {
    return prisma.chatRoomParticipant.create({
      data: {
        chatRoomId,
        userId,
      },
    });
  }

  async removeParticipant(chatRoomId: string, userId: string): Promise<void> {
    await prisma.chatRoomParticipant.delete({
      where: {
        chatRoomId_userId: {
          chatRoomId,
          userId,
        },
      },
    });
  }

  async getParticipants(chatRoomId: string): Promise<ChatRoomParticipant[]> {
    return prisma.chatRoomParticipant.findMany({
      where: { chatRoomId },
    });
  }

  async getUserRooms(userId: string): Promise<(ChatRoom & { participants: any[] })[]> {
    return prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async createMessage(data: Omit<Message, "id" | "readAt" | "createdAt" | "updatedAt">): Promise<Message> {
    return prisma.message.create({
      data,
    });
  }

  async getRoomMessages(
    chatRoomId: string,
    options: { page: number; limit: number }
  ): Promise<{ messages: Message[]; total: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where = { chatRoomId };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.message.count({ where }),
    ]);

    // Return the slice reversed so it is in chronological order (oldest to newest)
    return { messages: messages.reverse(), total };
  }

  async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    await prisma.message.updateMany({
      where: {
        chatRoomId,
        senderId: {
          not: userId,
        },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}
