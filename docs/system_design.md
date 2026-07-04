# RentMate System Design

This document details the architectural design and implementation strategies for RentMate's key systems.

---

## 1. Compatibility Matching Engine & LLM Integration

The compatibility system uses a three-tier execution hierarchy: **Prisma DB Cache-First**, **LLM-Second**, and **Rule-Based Engine-Third**.

### Data Flow Pipeline
1. **Cache Lookup**: When a tenant requests room matches, the backend checks the `compatibilities` table for cached scores between `tenantProfileId` and `listingId` (or `targetTenantId`). If found, it returns the cached score instantly, avoiding computational overhead and latency.
2. **LLM Batching (Primary Compute)**: On cache misses, the `CompatibilityService` queries the Gemini/OpenAI API via `OpenAiService`. 
   - **Optimization**: Instead of making $N$ parallel HTTP calls (which causes network congestion and API rate-limiting), listings are evaluated using the batch endpoint (`POST /listings/batch`). This packages the tenant profile and all listing details into a single unified prompt. The model returns a single structured JSON mapping listing IDs to scores and explanations, reducing token costs and overhead from $N$ calls to $1$.
3. **Structured Response Formatting**: The LLM system prompt enforces a strict JSON schema (`{ score: number, explanation: string }`). It outputs raw JSON without markdown formatting, which is parsed and cached immediately in the database.

### Local Rule Engine (Fallback)
If the LLM call fails (due to network timeout, API key expiration, or rate-limiting), the controller triggers a local deterministic `RuleEngine`. 
- **Heuristics & Deductions**:
  - **Budget Constraint**: Deducts up to 50 points based on the percentage by which rent exceeds the tenant's max budget.
  - **Lifestyle Misalignments**: Deducts 40 points if a smoker applies to a smoke-free listing; deducts 35 points for pet mismatches; deducts points for sleep schedule and cleanliness differences.
- The fallback guarantees 100% service uptime while maintaining logical alignment scores.

---

## 2. Real-Time Chat System

The chat system is built using **Socket.IO** (WebSockets) on top of Express, backed by Prisma and PostgreSQL.

### Architecture & Room Management
- **Persistent Rooms**: Chat rooms are saved in the `chat_rooms` table. Participants are joined via the `chat_room_participants` table.
- **Deduplication**: Room initialization (`POST /api/v1/chat/rooms`) uses a transaction with matching checks to ensure only one active chat room exists between any two users. The client utilizes an `initializingRef` flag to throttle concurrent duplicate mounting requests.
- **Connection Lifecycle**:
  - Upon connection, the socket joins the client to room channels (`socket.join(roomId)`).
  - When a message is sent (`send_message`), it is saved to the database, and emitted to all active room sockets (`new_message`).
  - Read receipts (`mark_read`) are emitted dynamically, updating the database (`readAt` timestamp) and propagating status updates (`messages_read`) to all active participants in real time.
- **State Management**: The client utilizes `activeRoomRef` (a React ref) to maintain the selected room state inside the socket callbacks. This prevents React state closure problems, ensuring messages append correctly.

---

## 3. Notification & Email Pipeline

RentMate uses an asynchronous transactional notification queue to deliver email alerts.

### Pipeline Details
1. **Triggering Events**: 
   - **High-Compatibility Expressed Interest**: When a tenant submits an interest request (`POST /api/v1/interests`) and their matching compatibility score is $\ge 80\%$, an email alert is queued for the property owner.
   - **Request Accepted/Declined**: When an owner updates an interest status (`PATCH /api/v1/interests/:id/status`), a transactional status email is queued for the tenant.
2. **Email Queue & Worker**:
   - Notifications are stored in a relational `notifications` table, acting as an outbox queue.
   - A background queue worker ticks at defined intervals (e.g. 10 seconds), fetching pending unsent emails.
   - Sent emails utilize the **Resend API SDK** for secure SMTP delivery.
   - If Resend returns an error, the queue worker updates the failure count and schedules retries with exponential backoff, ensuring reliable transactional email delivery.
