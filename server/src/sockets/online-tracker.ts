export class OnlineTracker {
  private static onlineUsers = new Map<string, Set<string>>();

  static setOnline(userId: string, socketId: string): void {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
  }

  static setOffline(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
      }
    }
  }

  static isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  static getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}
