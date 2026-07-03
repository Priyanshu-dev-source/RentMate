import { Notification } from "@prisma/client";

export interface INotificationRepository {
  create(data: Omit<Notification, "id" | "readAt" | "createdAt" | "updatedAt">): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  
  // Queries
  listByUser(userId: string, options: { page: number; limit: number; unreadOnly?: boolean }): Promise<{ notifications: Notification[]; total: number }>;
}
