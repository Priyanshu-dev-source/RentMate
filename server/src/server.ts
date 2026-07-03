import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { disconnectDatabase } from "./config/database";
import { initSocketServer } from "./sockets";
import { NotificationService } from "./services/NotificationService";

/**
 * Server Entry Point.
 *
 * WHY SEPARATE FROM app.ts:
 * - app.ts creates the Express app (importable for testing)
 * - server.ts starts listening and handles process lifecycle
 * - This separation is standard in production Node.js architectures
 *
 * GRACEFUL SHUTDOWN:
 * On SIGTERM/SIGINT, we:
 * 1. Stop accepting new connections
 * 2. Wait for in-flight requests to complete
 * 3. Disconnect from the database
 * 4. Exit cleanly
 *
 * This prevents data corruption and ensures zero-downtime deploys
 * when running behind a process manager (PM2, Docker, Kubernetes).
 */

const app = createApp();
const httpServer = createServer(app);

// Initialize Socket.io Server attached to the HTTP server instance
initSocketServer(httpServer);

// Start the background email notification queue worker
NotificationService.startQueueWorker();

const server = httpServer.listen(env.PORT, () => {
  logger.info(`
  ┌─────────────────────────────────────────────┐
  │                                             │
  │   🏠  RentMate API Server                   │
  │                                             │
  │   Environment : ${env.NODE_ENV.padEnd(12)}            │
  │   Port        : ${String(env.PORT).padEnd(12)}            │
  │   Health      : http://localhost:${env.PORT}/api/v1/health │
  │                                             │
  └─────────────────────────────────────────────┘
  `);
});

// ── Graceful Shutdown ──────────────────────────────────────────────

function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop background email queue worker
  NotificationService.stopQueueWorker();

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      await disconnectDatabase();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if graceful fails
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ── Unhandled Error Safety Net ─────────────────────────────────────

process.on("unhandledRejection", (reason: Error) => {
  logger.error("UNHANDLED REJECTION:", reason);
  // In production, let the process crash and restart via PM2/K8s
  // This prevents the app from continuing in a corrupt state
  gracefulShutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error: Error) => {
  logger.error("UNCAUGHT EXCEPTION:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});
