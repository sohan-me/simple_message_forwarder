# SMS Forward Server - OTP Relay API

A production-ready Next.js serverless API for relaying and managing OTP (One-Time Password) codes. Designed for deployment on Vercel with Vercel KV as the storage backend.

## Features

- ✅ Serverless-compatible Next.js App Router
- ✅ TypeScript for type safety
- ✅ Vercel KV for serverless storage (no external Redis needed)
- ✅ OTP extraction from SMS messages (4-8 digits)
- ✅ Automatic expiration (2 minutes TTL)
- ✅ One-time use validation
- ✅ Production-ready error handling
- ✅ Proper HTTP status codes

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

### 2. Set Up Vercel KV (Simple!)

**On Vercel (Production):**
1. Deploy your project to Vercel
2. Go to your project dashboard → **Storage** → **Create** → **KV Database**
3. Link the KV database to your project
4. **That's it!** Environment variables are automatically configured ✅

**For Local Development (Optional):**
1. Create a KV database in your Vercel project dashboard
2. Copy the KV REST API URL and Token
3. Create `.env.local` file:
```bash
cp .env.example .env.local
```
4. Add your credentials:
```env
KV_REST_API_URL=https://your-kv-instance.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token-here
```

**Note:** For local testing, you can skip this step and the API will show a helpful error message. For production on Vercel, just link the KV database - it's automatic!

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

The API will be available at `http://localhost:3000/api/otp`

## API Endpoints

### POST /api/otp

Store an OTP extracted from an SMS message.

**Request Body:**
```json
{
  "phone": "1234567890",
  "message": "Your OTP is 123456"
}
```

**Response (200):**
```json
{
  "status": "stored"
}
```

**Error Responses:**
- `400` - Missing fields, invalid phone, or no OTP found
- `503` - Database connection error
- `500` - Internal server error

### GET /api/otp?phone=1234567890

Retrieve and mark an OTP as used.

**Query Parameters:**
- `phone` (required) - Phone number to retrieve OTP for

**Response (200):**
```json
{
  "otp": "123456"
}
```

**Error Responses:**
- `400` - Missing or invalid phone parameter
- `404` - OTP not found, expired, or already used
- `503` - Database connection error
- `500` - Internal server error

## Example Requests

### Using cURL

**Store OTP:**
```bash
curl -X POST http://localhost:3000/api/otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "message": "Your verification code is 123456"
  }'
```

**Retrieve OTP:**
```bash
curl "http://localhost:3000/api/otp?phone=1234567890"
```

### Using JavaScript/TypeScript

```typescript
// Store OTP
const storeResponse = await fetch('http://localhost:3000/api/otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '1234567890',
    message: 'Your OTP is 123456'
  })
});

// Retrieve OTP
const retrieveResponse = await fetch('http://localhost:3000/api/otp?phone=1234567890');
const { otp } = await retrieveResponse.json();
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

4. Create a KV database in Vercel:
   - Go to your project dashboard
   - Navigate to "Storage" → "Create" → "KV Database"
   - Environment variables are automatically configured when you link the KV database

### Option 2: Deploy via GitHub

1. Push your code to a GitHub repository
2. Import the repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Create and link KV database:
   - In your project dashboard → **Storage** → **Create** → **KV Database**
   - Link it to your project
   - **Done!** Environment variables are automatically set ✅
4. Deploy

### Environment Variables

**On Vercel:** Automatically configured when you link a KV database - **no manual setup needed!** ✅

**For Local Development:** Optional - only needed if you want to test with real KV storage locally. Otherwise, you'll see a helpful error message explaining how to set it up.

## Project Structure

```
sms_forward_server/
├── app/
│   └── api/
│       └── otp/
│           └── route.ts          # API route handlers
├── lib/
│   ├── redis.ts                   # Vercel KV client setup
│   ├── types.ts                   # TypeScript type definitions
│   └── utils.ts                   # Utility functions (OTP extraction, validation)
├── .env.example                   # Environment variables template
├── .gitignore
├── next.config.js                 # Next.js configuration
├── package.json
├── README.md
└── tsconfig.json                  # TypeScript configuration
```

## How It Works

1. **OTP Storage (POST):**
   - Accepts phone number and SMS message
   - Extracts 4-8 digit OTP using regex
   - Stores in Vercel KV with key format: `otp:{phone}`
   - Sets 2-minute expiration (TTL)
   - Marks OTP as unused

2. **OTP Retrieval (GET):**
   - Validates phone number parameter
   - Fetches OTP from Vercel KV
   - Checks if OTP exists and is unused
   - Marks OTP as used
   - Returns OTP value

## Performance & Scalability

- ✅ Fully serverless - scales automatically on Vercel
- ✅ No in-memory storage - all data in Vercel KV
- ✅ Concurrent request safe - Vercel KV handles atomic operations
- ✅ Fast response times - Vercel KV optimized for serverless
- ✅ No external services needed - integrated with Vercel platform

## Security Considerations

- OTPs expire after 2 minutes
- OTPs can only be used once
- Phone number validation prevents injection
- No sensitive data in logs (no console.log in production)
- Environment variables for credentials

## License

MIT

