import rateLimit from "express-rate-limit";
import { env } from "./env";

/**
 * Rate Limiter Configuration.
 *
 * WHY RATE LIMITING:
 * Protects against brute-force attacks, credential stuffing, and DoS.
 * The default (100 requests per 15 minutes) is reasonable for an API.
 * Auth endpoints should use a stricter limiter (configured separately).
 *
 * WHY standardHeaders + legacyHeaders:
 * - standardHeaders: sends `RateLimit-*` headers per IETF draft
 * - legacyHeaders: disabled to avoid sending deprecated X-RateLimit-* headers
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests. Please try again later.",
    data: null,
    errors: null,
  },
});

/**
 * Stricter rate limiter for authentication endpoints.
 * 10 attempts per 15 minutes to prevent brute-force.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many authentication attempts. Please try again later.",
    data: null,
    errors: null,
  },
});
