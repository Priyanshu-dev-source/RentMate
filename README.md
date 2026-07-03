# 🏠 Rent & Flatmate Finder

A full-stack platform for finding rooms and compatible flatmates. Built with Next.js, Express, Prisma, and PostgreSQL.

## Architecture

```
rentmate/
├── client/              # Next.js 15 frontend (React 19, TailwindCSS, Shadcn UI)
├── server/              # Express 5 backend (TypeScript, Prisma ORM)
├── docs/                # Architecture documentation
├── .env.example         # Environment variable template
├── .prettierrc          # Shared Prettier config
├── .lintstagedrc.json   # lint-staged config
└── package.json         # npm workspaces root
```

### Backend Structure

```
server/src/
├── config/          # Environment, database, CORS, rate-limit configs
├── controllers/     # HTTP handlers (thin — delegate to services)
├── services/        # Business logic layer
├── repositories/    # Data access layer (Prisma calls)
├── routes/v1/       # Express routers with API versioning
├── middleware/       # Auth, error handler, validation, rate limiting
├── validators/      # Zod request schemas
├── helpers/         # Domain-specific utilities (AppError, etc.)
├── utils/           # Generic utilities (logger, API response, catchAsync)
├── sockets/         # Socket.IO real-time events
├── emails/          # Email templates and service
├── prompts/         # AI prompt templates
├── types/           # Shared TypeScript types
├── prisma/          # Schema and migrations
├── app.ts           # Express app factory
└── server.ts        # Entry point with graceful shutdown
```

## Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0
- **PostgreSQL** ≥ 15

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd rentmate
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secrets
```

### 3. Set up the database

```bash
# Create the database
createdb rentmate_dev

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### 4. Start development

```bash
# Start both client and server
npm run dev

# Or individually
npm run dev:client    # http://localhost:3000
npm run dev:server    # http://localhost:5000
```

### 5. Verify

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Expected response:
# {
#   "success": true,
#   "statusCode": 200,
#   "message": "Success",
#   "data": {
#     "status": "healthy",
#     "database": "connected",
#     ...
#   }
# }
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server in development |
| `npm run dev:client` | Start Next.js dev server (port 3000) |
| `npm run dev:server` | Start Express dev server with hot-reload (port 5000) |
| `npm run build` | Build both client and server |
| `npm run lint` | Lint both workspaces |
| `npm run format` | Format all files with Prettier |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:seed` | Seed the database |

## API Response Format

All API responses follow this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "errors": null
}
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, Shadcn UI |
| Backend | Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Logging | Winston |
| Real-time | Socket.IO |

## Documentation

- [Architecture Decisions](./docs/architecture.md) — Explains every design choice with rationale

## License

Private — All rights reserved.
