import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Prisma Client Singleton.
 *
 * WHY SINGLETON:
 * PrismaClient manages a connection pool internally. Creating multiple
 * instances would exhaust database connections. In development, hot-reload
 * (tsx watch) would create a new instance on every file change, leaking
 * connections. Storing the instance on `globalThis` prevents this.
 *
 * WHY LOGGING CONFIG:
 * - In development: log queries for debugging slow/incorrect queries.
 * - In production: log only errors and warnings to reduce noise.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "info" },
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ],
  });

  // Log slow queries in development
  if (env.NODE_ENV === "development") {
    (client.$on as Function)("query", (e: { duration: number; query: string }) => {
      if (e.duration > 100) {
        logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
      }
    });
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful database disconnect.
 * Called during server shutdown to cleanly close all connections.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database connection closed");
}
