import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthUser } from "../types/express.d";

export function socketAuthenticate(socket: Socket, next: (err?: Error) => void): void {
  const auth = socket.handshake.auth as Record<string, unknown> | undefined;
  const token = (auth?.token || socket.handshake.headers.authorization) as string | undefined;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  const tokenString = token.startsWith("Bearer ") 
    ? token.substring(7) 
    : token;

  try {
    const decoded = jwt.verify(tokenString, env.JWT_SECRET) as AuthUser;
    
    // Attach credentials to socket.data for access inside events
    const socketData = socket.data as { user?: AuthUser };
    socketData.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch {
    return next(new Error("Authentication error: Invalid or expired token"));
  }
}
