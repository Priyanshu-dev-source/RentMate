import { CorsOptions } from "cors";
import { env } from "./env";

/**
 * CORS Configuration.
 *
 * WHY EXPLICIT ORIGIN LIST:
 * Using `origin: true` or `origin: '*'` in production is a security risk.
 * We whitelist only our frontend origin(s). The CORS_ORIGIN env var
 * supports multiple origins separated by commas for staging/preview deploys.
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours — browsers cache preflight responses
};
