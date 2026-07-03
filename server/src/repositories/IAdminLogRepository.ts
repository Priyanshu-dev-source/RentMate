import { AdminLog } from "@prisma/client";

export interface IAdminLogRepository {
  create(data: Omit<AdminLog, "id" | "createdAt">): Promise<AdminLog>;
  
  // Queries
  listLogs(options: {
    adminId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    page: number;
    limit: number;
  }): Promise<{ logs: AdminLog[]; total: number }>;
}
