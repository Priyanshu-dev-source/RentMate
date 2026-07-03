import { ChatRoomRepository } from "../repositories/ChatRoomRepository";
import { UserRepository } from "../repositories/UserRepository";
import { prisma } from "../config/database";
import { OnlineTracker } from "../sockets/online-tracker";
import { AppError } from "../helpers/app-error";

export class ChatService {
  private chatRoomRepository: ChatRoomRepository;
  private userRepository: UserRepository;

  constructor() {
    this.chatRoomRepository = new ChatRoomRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Retrieve all chat rooms for a user with participants, latest message, and unread counts.
   */
  async getUserRooms(userId: string) {
    const rooms = await this.chatRoomRepository.getUserRooms(userId);

    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const otherParticipantRecord = room.participants.find((p) => p.userId !== userId);
        let otherParticipant = null;

        if (otherParticipantRecord) {
          const user = await this.userRepository.findById(otherParticipantRecord.userId);
          if (user) {
            otherParticipant = {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
              isOnline: OnlineTracker.isOnline(user.id),
            };
          }
        }

        const lastMessage = await prisma.message.findFirst({
          where: { chatRoomId: room.id },
          orderBy: { createdAt: "desc" },
        });

        const unreadCount = await prisma.message.count({
          where: {
            chatRoomId: room.id,
            senderId: { not: userId },
            readAt: null,
          },
        });

        return {
          id: room.id,
          name: room.name,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          participants: room.participants,
          otherParticipant,
          lastMessage,
          unreadCount,
        };
      })
    );

    // Sort rooms so that those with the most recent messages appear first
    return enrichedRooms.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }

  /**
   * Fetch historical messages inside a room, ensuring the user is a participant.
   */
  async getRoomMessages(chatRoomId: string, userId: string, page: number = 1, limit: number = 20) {
    const participants = await this.chatRoomRepository.getParticipants(chatRoomId);
    const isParticipant = participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw AppError.forbidden("Access denied: You are not a participant in this chat room");
    }

    return this.chatRoomRepository.getRoomMessages(chatRoomId, { page, limit });
  }

  /**
   * Create or retrieve a chat room with another user.
   */
  async initializeChatRoom(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw AppError.badRequest("You cannot start a chat room with yourself");
    }

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw AppError.notFound("Target user not found");
    }

    // Look for an existing room containing both participants
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
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

    if (existingRoom && existingRoom.participants.length === 2) {
      const otherParticipantRecord = existingRoom.participants.find((p) => p.userId !== userId);
      let otherParticipant = null;
      if (otherParticipantRecord && otherParticipantRecord.user) {
        otherParticipant = {
          id: otherParticipantRecord.user.id,
          firstName: otherParticipantRecord.user.firstName,
          lastName: otherParticipantRecord.user.lastName,
          email: otherParticipantRecord.user.email,
          avatar: otherParticipantRecord.user.avatar,
          role: otherParticipantRecord.user.role,
          isOnline: OnlineTracker.isOnline(otherParticipantRecord.user.id),
        };
      }
      return {
        ...existingRoom,
        otherParticipant,
      };
    }

    // Create a new room with participants inside a transaction
    return prisma.$transaction(async (tx) => {
      const room = await tx.chatRoom.create({
        data: {},
      });

      await tx.chatRoomParticipant.createMany({
        data: [
          { chatRoomId: room.id, userId },
          { chatRoomId: room.id, userId: targetUserId },
        ],
      });

      const fullRoom = await tx.chatRoom.findUnique({
        where: { id: room.id },
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

      if (!fullRoom) {
        throw AppError.internal("Failed to retrieve newly created chat room");
      }

      const otherParticipantRecord = fullRoom.participants.find((p) => p.userId !== userId);
      let otherParticipant = null;
      if (otherParticipantRecord && otherParticipantRecord.user) {
        otherParticipant = {
          id: otherParticipantRecord.user.id,
          firstName: otherParticipantRecord.user.firstName,
          lastName: otherParticipantRecord.user.lastName,
          email: otherParticipantRecord.user.email,
          avatar: otherParticipantRecord.user.avatar,
          role: otherParticipantRecord.user.role,
          isOnline: OnlineTracker.isOnline(otherParticipantRecord.user.id),
        };
      }

      return {
        ...fullRoom,
        otherParticipant,
        lastMessage: null,
        unreadCount: 0,
      };
    });
  }
}
