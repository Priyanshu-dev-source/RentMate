# 🏠 RentMate: Rent & Flatmate Finder

A full-stack platform for finding rooms and compatible flatmates based on lifestyle habits and budget. Built with Next.js, Express, Prisma, and PostgreSQL.

---

## 1. Setup & Installation Guide

### Prerequisites
- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0
- **PostgreSQL** ≥ 15
- **OpenAI/Gemini API Key** (for compatibility evaluation)
- **Resend API Key** (for transactional emails)
- **Cloudinary Account** (for room images uploads)

### Setup Steps
1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repo-url>
   cd rentmate
   npm install
   ```
2. **Configure Environment Variables**:
   Create a `.env` file in `server/` and a `.env.local` file in `client/` based on the configuration schemas below.
3. **Database Migration & Seeding**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations to update PostgreSQL schema
   npm run db:migrate
   
   # Seed default database records (creates default owner and tenant accounts)
   npm run db:seed
   ```
4. **Run Development Server**:
   ```bash
   # Start client and server concurrently
   npm run dev
   
   # Or run individually
   npm run dev:client # client runs on http://localhost:3000
   npm run dev:server # server runs on http://localhost:5000
   ```

---

## 2. Environment Variables Configuration

### Backend Server (`server/.env`)
```ini
# Application Port and Node Environment
NODE_ENV=development
PORT=5000

# PostgreSQL Connection Strings (Neon DB or Local)
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/dbname?sslmode=require"

# Authentication JWT Configuration
JWT_SECRET="jwt-auth-secure-signing-secret"
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET="jwt-refresh-token-signing-secret"
JWT_REFRESH_EXPIRES_IN=30d

# CORS Allowed Origin
CORS_ORIGIN=http://localhost:3000

# OpenAI API Key (Set to mock-key-for-fallback-testing to bypass and use rule engine)
OPENAI_API_KEY="your-openai-api-key"

# Resend Transactional Email API Key
RESEND_API_KEY="re_yourApiKey"
RESEND_FROM_EMAIL="RentMate <onboarding@resend.dev>"

# Cloudinary Storage Credentials
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### Frontend Client (`client/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 3. Database Schema

The relational database consists of the following key tables managed by Prisma:

```prisma
// User accounts
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  firstName   String
  lastName    String
  role        UserRole @default(TENANT) // TENANT, OWNER, ADMIN
  avatar      String?
}

// Landlord Profiles
model OwnerProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  companyName String?
  listings    Listing[]
}

// Tenant Preference Profiles
model TenantProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  cleanliness   Int?     @default(3) // 1-5 Scale
  sleepSchedule String?              // early_bird, night_owl, flexible
  smoking       Boolean  @default(false)
  pets          Boolean  @default(false)
  drinking      Boolean  @default(false)
  guestPolicy   String?              // never, occasionally, frequently
  noiseLevel    String?              // quiet, moderate, lively
  diet          String?              // vegetarian, vegan, non_vegetarian, any
  workSchedule  String?              // wfh, office, hybrid
  budgetMin     Int?
  budgetMax     Int?
}

// Property Listings
model Listing {
  id           String        @id @default(uuid())
  ownerId      String
  title        String
  description  String
  price        Int           // Monthly rent in dollars
  city         String
  state        String
  propertyType PropertyType  // APARTMENT, HOUSE, STUDIO, CONDO, VILLA
  roomType     RoomType      // ENTIRE, PRIVATE, SHARED
  rules        String[]
  amenities    String[]
  status       ListingStatus @default(ACTIVE)
}

// Expressions of Interest
model InterestRequest {
  id              String         @id @default(uuid())
  tenantProfileId String
  listingId       String
  message         String?
  status          InterestStatus @default(PENDING) // PENDING, ACCEPTED, REJECTED
}

// Chat Rooms & Direct Messages
model ChatRoom {
  id           String   @id @default(uuid())
}

model ChatRoomParticipant {
  id         String   @id @default(uuid())
  chatRoomId String
  userId     String
}

model Message {
  id         String    @id @default(uuid())
  chatRoomId String
  senderId   String
  content    String
  readAt     DateTime?
}
```

---

## 4. LLM Compatibility Prompts & I/O

Compatibility analysis uses a structured system prompt prompting the LLM to output a direct JSON response.

### System Prompt
```
You are a highly analytical AI Compatibility Engine designed to assess residential compatibility.
Your objective is to compare a tenant's lifestyle habits and budget with either a property listing's rules/amenities or another tenant's lifestyle habits.

CRITICAL INSTRUCTIONS:
1. Assess compatibility on a strict scale of 0 to 100.
2. You must output ONLY a valid JSON object. Do not include markdown backticks (e.g. ```json), comments, or surrounding text.
3. The JSON object must strictly match this structure:
   {
     "score": 85,
     "explanation": "Provide a concise 2-3 sentence explanation summarizing the matching points (e.g. budget, cleanliness) and potential friction areas (e.g. guests policy)."
   }
```

### Batch Prompt Template
```
Tenant Attributes:
- Cleanliness: 4/5
- Sleep Schedule: flexible
- Smoking Habit: Non-Smoker
- Has Pets: No
- Drinks Alcohol: No
- Guest Policy Preference: occasionally
- Monthly Budget Range: INR 800 to INR 1500

List of Listings to assess:
Listing 1:
- ID: "list-uuid-1"
- Title: "Cozy Studio in Bangalore"
- Rent Price: INR 1200 per month
- House Rules: "No Smoking, No Pets, Quiet Hours after 10PM"

Listing 2:
- ID: "list-uuid-2"
- Title: "Spacious Private Room"
- Rent Price: INR 2200 per month
- House Rules: "Smoking allowed, Pets OK"

Please evaluate and output a single JSON object where the keys are the listing IDs, and values are objects conforming strictly to:
{
  "score": number (0 to 100),
  "explanation": "Provide a concise 2-3 sentence explanation."
}
```

### Example Output JSON
```json
{
  "list-uuid-1": {
    "score": 95,
    "explanation": "Excellent match. The rent fits within the tenant's budget range, and property house rules prohibiting smoking and pets perfectly align with the tenant's lifestyle habits."
  },
  "list-uuid-2": {
    "score": 40,
    "explanation": "Low compatibility. The rent price exceeds the tenant's maximum monthly budget by 46%. Furthermore, rules permitting smoking conflict with the non-smoker tenant's profile."
  }
}
```

---

## 5. API Documentation

### Authentication Routes
- `POST /api/v1/auth/register` - Create new user account.
- `POST /api/v1/auth/login` - User login (returns JWT credentials).

### Listing Routes
- `GET /api/v1/listings` - Search listings (filter by city, propertyType, roomType, price).
- `POST /api/v1/listings` - Create new room listing (Owner only).
- `GET /api/v1/listings/:id` - Fetch room details.

### Compatibility Matching Routes
- `POST /api/v1/compatibility/listings/batch` - Batch check listing compatibility for a tenant.
- `POST /api/v1/compatibility/search/ai` - AI compatibility ranking based on custom user inputs.

### Expressions of Interest
- `POST /api/v1/interests` - Tenant expresses interest in a listing (triggers email alert if score ≥ 80%).
- `PATCH /api/v1/interests/:id/status` - Owner accepts/declines interest (triggers alert to tenant).

### Chat Rooms
- `GET /api/v1/chat` - Fetch chat conversations list.
- `POST /api/v1/chat/rooms` - Initialize direct chat conversation thread.
- `GET /api/v1/chat/:roomId/messages` - Retrieve message history.

---

## 6. Hosting Platforms Deployment Setup

### Client (Frontend) - Vercel / Netlify
- Build Command: `npm run build --workspace=client`
- Output Directory: `client/.next`
- Environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

### Server (Backend) - Railway / Render / Heroku
- Build Command: `npm run build --workspace=server`
- Start Command: `npm start --workspace=server`
- Port: `PORT` variable is injected dynamically by the cloud host provider.
- Database: Configure environment variables for direct connecting to Neon DB PostgreSQL instance.
