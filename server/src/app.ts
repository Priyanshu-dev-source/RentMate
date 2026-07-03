import express from "express";
import helmet from "helmet";
import cors from "cors";
import { corsOptions } from "./config/cors";
import { globalRateLimiter } from "./config/rate-limit";
import { notFoundHandler } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/error-handler";
import v1Router from "./routes/v1";

/**
 * Express Application Factory.
 *
 * WHY FACTORY PATTERN:
 * Separating app creation from server.listen() enables:
 * 1. Testing: import the app without starting the server
 * 2. Serverless: export the app as a handler
 * 3. Multiple instances: create isolated apps for integration tests
 *
 * MIDDLEWARE ORDER MATTERS:
 * 1. Security (helmet, cors) — applied first to every request
 * 2. Rate limiting — reject excess requests early
 * 3. Body parsing — parse JSON/urlencoded before routes
 * 4. Routes — handle business logic
 * 5. 404 handler — catch unmatched routes
 * 6. Error handler — catch all thrown/forwarded errors (must be last)
 */
export function createApp(): express.Application {
  const app = express();

  // ── Security ────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors(corsOptions));

  // ── Rate Limiting ───────────────────────────────────────────────
  app.use(globalRateLimiter);

  // ── Body Parsing ────────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ── API Routes ──────────────────────────────────────────────────
  app.use("/api/v1", v1Router);

  // ── Error Handling ──────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
