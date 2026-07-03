import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env from project root (monorepo root)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/**
 * Environment variable schema.
 *
 * WHY ZOD VALIDATION:
 * Fail fast at startup if any required env var is missing or malformed.
 * This prevents runtime crashes from undefined config values deep in
 * the call stack where they're harder to debug.
 */
const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(5000),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid connection string").optional(),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Logging
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "debug"])
    .default("info"),

  // AI compatibility
  OPENAI_API_KEY: z.string().optional(),

  // Email Notification System
  RESEND_API_KEY: z.string().default("mock_api_key"),
  RESEND_FROM_EMAIL: z.string().default("RentMate <onboarding@resend.dev>"),
});

/**
 * Parse and validate environment variables.
 * Throws a descriptive error at startup if validation fails.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `\n❌ Environment validation failed:\n${formatted}\n\nCheck your .env file against .env.example\n`
    );
  }

  return result.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
