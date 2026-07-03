# Architecture Decisions — Rent & Flatmate Finder

This document explains **every architectural decision** made in Phase 1.

---

## 1. Monorepo Strategy: npm Workspaces

**Decision**: Use npm workspaces (built into Node.js 20+) instead of Turborepo, Nx, or Lerna.

**Why**:
- **Zero dependencies**: npm workspaces ship with Node.js. No extra tooling to install, configure, or maintain.
- **Sufficient for our scale**: We have exactly 2 packages (client + server). We don't need Turborepo's remote caching or Nx's computation graph — those solve problems at 20+ packages scale.
- **Simpler mental model**: `npm install` at root installs everything. `npm run dev --workspace=client` runs the client. No magic.
- **Escape hatch**: If we outgrow npm workspaces, migrating to Turborepo is a 15-minute config addition — the workspace structure is identical.

---

## 2. Backend Architecture: Layered (Controller → Service → Repository)

**Decision**: Strict 3-layer separation with dependency flowing one direction.

```
HTTP Request
  → Route (URL mapping)
    → Validator (Zod schema)
      → Controller (HTTP concerns: req, res)
        → Service (business logic)
          → Repository (data access: Prisma)
            → Database
```

**Why**:
- **Controllers** handle HTTP — extracting params, calling services, sending responses. They never touch the database directly. This means we can swap Express for Fastify without rewriting business logic.
- **Services** contain business rules — "can this user edit this listing?", "calculate match score". They never import `Request` or `Response`. This means we can call the same logic from REST, WebSocket, or a cron job.
- **Repositories** are the only layer that imports Prisma. If we ever migrate from Prisma to Drizzle or raw SQL, only repositories change.

**Anti-pattern avoided**: "Fat controllers" that do validation, business logic, DB queries, and response formatting all in one function. These become unmaintainable at 50+ endpoints.

---

## 3. Express App Factory Pattern

**Decision**: `app.ts` creates and configures the Express app. `server.ts` starts it.

**Why**:
- **Testability**: Import `createApp()` in tests without starting an HTTP server.
- **Serverless**: Export the app as a Lambda/Cloud Function handler.
- **Multiple instances**: Create isolated apps for parallel integration tests.

---

## 4. API Versioning from Day 1

**Decision**: All routes live under `/api/v1/`.

**Why**:
- **Cost of adding later**: Retrofitting versioning onto an existing API breaks all clients. Adding it from day 1 costs nothing.
- **Migration path**: When v2 is needed, mount a `v2/` router at `/api/v2/`. Old clients continue using v1 until deprecated.

---

## 5. Zod-Validated Environment Variables

**Decision**: All env vars are validated at startup using a Zod schema.

**Why**:
- **Fail fast**: A missing `DATABASE_URL` throws at startup, not 30 minutes later when the first DB query runs.
- **Type safety**: `env.PORT` is a `number`, not `string | undefined`. No need for `parseInt` everywhere.
- **Documentation**: The schema IS the documentation for required env vars.

---

## 6. Prisma Client Singleton with globalThis

**Decision**: Store the Prisma client on `globalThis` in development.

**Why**:
- In development, `tsx watch` hot-reloads files on every save. Each reload would create a new `PrismaClient`, opening a new connection pool. After 5-10 saves, PostgreSQL runs out of connections.
- `globalThis` persists across hot-reloads, so we reuse the same client instance.
- In production, this isn't needed (no hot-reload), but the code is harmless.

---

## 7. Custom AppError Class with isOperational Flag

**Decision**: All expected errors extend `AppError` with an `isOperational` flag.

**Why**:
- **Operational errors** (bad input, not found, unauthorized): Send the error message to the client. The user can fix these.
- **Programming errors** (null pointer, syntax error): Send a generic "Internal server error". Log the full stack for developers. The user can't fix these.
- Without this distinction, you either leak internal details to users (security risk) or hide useful error messages (bad UX).

---

## 8. Standardized API Response Format

**Decision**: Every response follows `{ success, statusCode, message, data, errors }`.

**Why**:
- **Frontend contract**: The client team can write ONE response handler. No guessing "is the error in `error`, `message`, or `detail`?"
- **Error granularity**: The `errors` field carries field-level validation details. The `message` field carries a human-readable summary.
- **Tooling**: API documentation, testing, and monitoring tools can rely on a consistent shape.

---

## 9. UUID Primary Keys

**Decision**: Use UUIDs (`@default(uuid())`) instead of auto-incrementing integers.

**Why**:
- **Security**: Sequential IDs leak information ("there are ~10,000 users"). UUIDs don't.
- **Distributed safety**: Two services can generate IDs independently without collision.
- **Client-side generation**: The frontend can generate an ID before sending the request, enabling optimistic UI updates.
- **Trade-off**: UUIDs are larger (36 chars vs 4 bytes). For our scale, this is negligible.

---

## 10. Soft Deletes

**Decision**: `deletedAt` field instead of `DELETE FROM`.

**Why**:
- **Audit trail**: Know when and (eventually) who deleted a record.
- **Recovery**: "I accidentally deleted my listing" → restore from `deletedAt`.
- **Referential integrity**: Hard-deleting a user would cascade-delete their reviews, messages, etc. Soft-delete preserves the data graph.
- **Implementation**: Repositories filter `WHERE deletedAt IS NULL` by default.

---

## 11. Winston Logger (not console.log)

**Decision**: Winston with environment-aware formatting.

**Why**:
- **Development**: Colorized, timestamped, human-readable output.
- **Production**: Structured JSON logs parseable by CloudWatch, Datadog, ELK, etc.
- **Log levels**: Filter noise. `LOG_LEVEL=error` in production silences info/debug.
- **File transport**: Production errors persist to disk as a safety net.

---

## 12. Security Middleware Stack

**Decision**: Helmet + CORS whitelist + rate limiting on every request.

- **Helmet**: Sets 15+ HTTP security headers (CSP, HSTS, X-Frame-Options, etc.). One line, massive security improvement.
- **CORS whitelist**: Only our frontend origin can make requests. Not `origin: '*'`.
- **Rate limiting**: 100 requests/15 minutes globally. 10/15 minutes for auth endpoints. Prevents brute-force and DoS.
- **Body limit**: 10MB max. Prevents memory exhaustion from oversized payloads.

---

## 13. Graceful Shutdown

**Decision**: Handle SIGTERM/SIGINT with a shutdown sequence.

**Why**:
- Docker/Kubernetes send SIGTERM before killing a container. Without a handler, in-flight requests are dropped.
- Our shutdown: stop accepting connections → wait for in-flight requests → disconnect database → exit.
- 10-second timeout prevents hanging if a request is stuck.

---

## 14. Husky + lint-staged

**Decision**: Pre-commit hook running ESLint + Prettier on staged files only.

**Why**:
- **Staged files only**: Running on the entire codebase would be slow. lint-staged runs only on files you're committing.
- **Catches before push**: Formatting issues and lint errors are caught locally, not in CI (faster feedback loop).
- **Husky v9**: Uses native Git hooks. No `.huskyrc` magic.

---

## 15. Prisma Schema Design Choices

- **Explicit join tables** (ConversationParticipant): Implicit many-to-many can't store metadata like `lastReadAt`. Explicit tables give full control.
- **Indexes on FKs**: PostgreSQL doesn't auto-index foreign keys. Without explicit indexes, JOINs and WHERE clauses on FKs do full table scans.
- **`@@map("table_name")`**: Model names are PascalCase (TypeScript convention). Table names are snake_case (PostgreSQL convention). `@@map` bridges the two.
- **`String[]` for amenities/rules**: Simple string arrays avoid the complexity of a separate Amenity table + join table. Good enough until amenities need their own metadata.
