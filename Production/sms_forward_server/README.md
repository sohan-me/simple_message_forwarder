# SMS Forward Server

A production-ready Next.js serverless API for relaying SMS messages. Sync HTTP only (no WebSockets). Designed for deployment on Vercel with Redis storage.

## Features

- Serverless-compatible Next.js App Router
- TypeScript for type safety
- Redis for storage (supports any Redis provider via connection string)
- Stores full message (no OTP extraction)
- 1-hour TTL for stored messages
- One-time read: message is marked used when retrieved
- Sync HTTP only; no WebSockets

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (free tier available)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Set Up Redis Connection

**For Local Development:**
1. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

2. Add your Redis connection string:
```env
REDIS_URL=redis://default:password@host:port
```

**For Production on Vercel:**
1. Go to your Vercel project dashboard → **Settings** → **Environment Variables**
2. Add a new environment variable:
   - **Name:** `REDIS_URL`
   - **Value:** Your Redis connection string (e.g., `redis://default:password@host:port`)
3. Save and redeploy

**Note:** You can use any Redis provider (Redis Labs, Upstash, AWS ElastiCache, etc.) - just provide the connection string in the `REDIS_URL` format.

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

The API will be available at `http://localhost:3000/api/otp` (POST) and `http://localhost:3000/api/sms/[number]` (GET).

## API Endpoints

### POST /api/otp

Store the full SMS message for a phone number (no OTP extraction). Messages expire after 1 hour.

**Request Body:**
```json
{
  "phone": "1234567890",
  "message": "Your full SMS body here (any format)"
}
```

**Response (200):**
```json
{
  "status": "stored"
}
```

**Error Responses:**
- `400` - Missing fields, invalid phone, or empty message
- `503` - Database connection error
- `500` - Internal server error

### GET /api/sms/[number]

Check for a stored message for the given phone number. Sync HTTP only (no WebSockets). Path example: `GET /api/sms/1234567890`.

**Response (200) when no message or already used:**
```json
{
  "ok": true,
  "count": 0,
  "messages": [],
  "checkedAt": "2026-02-24T18:32:26.160Z"
}
```

**Response (200) when a message is available (and mark it used):**
```json
{
  "ok": true,
  "count": 1,
  "messages": [{ "message": "full SMS body here" }],
  "checkedAt": "2026-02-24T18:32:26.160Z"
}
```

**Error Responses:**
- `503` - Database connection error
- `500` - Internal server error

## Example Requests

### Using cURL

**Store message:**
```bash
curl -X POST http://localhost:3000/api/otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "message": "Your full SMS body here"}'
```

**Check for message (path-based):**
```bash
curl "http://localhost:3000/api/sms/1234567890"
```

### Using JavaScript/TypeScript

```typescript
// Store message
await fetch('http://localhost:3000/api/otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '1234567890', message: 'Full SMS text' })
});

// Check for message
const res = await fetch('http://localhost:3000/api/sms/1234567890');
const data = await res.json(); // { ok, count, messages, checkedAt }
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add `REDIS_URL` in Project Settings → Environment Variables (Redis connection string)

### Option 2: Deploy via GitHub

1. Push your code to a GitHub repository
2. Import the repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add Redis connection string:
   - Go to **Settings** → **Environment Variables**
   - Add `REDIS_URL` with your Redis connection string
   - Format: `redis://default:password@host:port`
4. Deploy

### Environment Variables

**Required:**
- `REDIS_URL` - Your Redis connection string
  - Format: `redis://default:password@host:port`
  - Example: `redis://default:password@redis.example.com:6379`

**On Vercel:** Add `REDIS_URL` in Project Settings → Environment Variables

**For Local Development:** Add `REDIS_URL` to `.env.local` file

## Project Structure

```
sms_forward_server/
├── app/
│   └── api/
│       ├── otp/
│       │   └── route.ts          # POST: store message
│       └── sms/
│           └── [number]/
│               └── route.ts      # GET: check message by number
├── lib/
│   ├── redis.ts                  # Redis client
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Phone validation, etc.
├── .env.example
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

## How It Works

1. **Store (POST /api/otp):**
   - Accepts `phone` and `message` (full body; no OTP extraction)
   - Stores in Redis with key `sms:{phone}`, TTL 1 hour
   - Marks as unused

2. **Check (GET /api/sms/[number]):**
   - Sync HTTP only (no WebSockets)
   - Fetches stored message for that number
   - If unused: returns it in `messages`, marks as used
   - Always returns `{ ok, count, messages, checkedAt }`

## Performance & Scalability

- ✅ Fully serverless - scales automatically on Vercel
- ✅ No in-memory storage - all data in Redis
- ✅ Concurrent request safe - Redis handles atomic operations
- ✅ Fast response times - Redis optimized for key-value operations
- ✅ Works with any Redis provider (Redis Labs, Upstash, AWS ElastiCache, etc.)

## Security Considerations

- Messages expire after 1 hour (TTL)
- Each message can only be read once (marked used on GET)
- Phone number validation
- Environment variables for credentials

## License

MIT

