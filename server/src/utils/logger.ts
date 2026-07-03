import winston from "winston";
import path from "path";

/**
 * Application Logger.
 *
 * WHY WINSTON:
 * - Structured JSON logging for production (machine-parseable by log aggregators)
 * - Pretty console output for development (human-readable)
 * - Log levels: error > warn > info > http > debug
 * - File rotation can be added via winston-daily-rotate-file when needed
 *
 * WHY NOT console.log:
 * - No log levels, no timestamps, no structured output
 * - Can't route to files or external services
 * - No way to filter by severity in production
 */

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Development: colorized, human-readable
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ts} ${level}: ${stack || message}${metaStr}`;
  })
);

// Production: structured JSON for log aggregators
const prodFormat = combine(
  timestamp({ format: "ISO" }),
  errors({ stack: true }),
  json()
);

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  format: isDevelopment ? devFormat : prodFormat,
  defaultMeta: { service: "rentmate-api" },
  transports: [
    new winston.transports.Console(),
    // Production: also write errors to file for persistence
    ...(isDevelopment
      ? []
      : [
          new winston.transports.File({
            filename: path.join(__dirname, "../../../logs/error.log"),
            level: "error",
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join(__dirname, "../../../logs/combined.log"),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
        ]),
  ],
});
