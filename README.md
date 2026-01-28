# Pastebin-Lite

A lightweight pastebin application built with Next.js and Supabase. Create, share, and manage text pastes with optional expiration and view limits.

## Features

- Create text pastes with optional TTL (time-to-live) and view count limits
- Share pastes via unique URLs (`/p/:id`)
- Automatic expiry when TTL expires or view limit is reached (whichever comes first)
- Safe HTML rendering with XSS protection
- TEST_MODE support for deterministic testing
- Dark mode support
- Responsive design

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **yarn** or **pnpm**
- A **Supabase** account (free tier works)

## Local Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd pastebin-lite
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application URL (optional - defaults to http://localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Test Mode (optional - set to '1' to enable TEST_MODE)
TEST_MODE=0
```

**How to get Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select an existing one
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Set Up the Database

1. Go to your Supabase Dashboard → **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration

Alternatively, you can use the Supabase CLI:

```bash
# If you have Supabase CLI installed
supabase db push
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 6. Open the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Persistence Layer

This application uses **Supabase (PostgreSQL)** as the persistence layer.

### Database Schema

- **Database:** PostgreSQL (hosted on Supabase)
- **Main Table:** `pastes`
  - `id` (UUID) - Primary key
  - `content` (TEXT) - Paste content (required, non-empty)
  - `ttl_seconds` (INTEGER) - Time-to-live in seconds (optional, min: 1)
  - `max_views` (INTEGER) - Maximum view count (optional, min: 1)
  - `view_count` (INTEGER) - Current view count (default: 0)
  - `created_at` (TIMESTAMPTZ) - Creation timestamp
  - `expires_at` (TIMESTAMPTZ) - Calculated expiration timestamp

### Database Features

- **Row-level data integrity** - Constraints ensure data validity
- **Atomic operations** - Database functions prevent race conditions in view counting
- **Automatic expiry calculation** - Trigger automatically calculates `expires_at` from `ttl_seconds`
- **Performance indexes** - Indexes on `id`, `expires_at`, and `created_at`
- **Availability checking** - `is_paste_available()` function checks TTL and view limits
- **Atomic view increment** - `increment_paste_views()` function atomically increments views

### Database Functions

1. **`is_paste_available(paste_id, test_now_ms)`**
   - Checks if a paste is available (not expired, not at view limit)
   - Supports TEST_MODE via `test_now_ms` parameter

2. **`increment_paste_views(paste_id)`**
   - Atomically increments view count
   - Only increments if paste is still available
   - Returns new view count or -1 if unavailable

## API Endpoints

### Health Check

**GET** `/api/healthz`

Returns the health status of the application and database connection.

**Response:**
```json
{
  "ok": true
}
```

### Create Paste

**POST** `/api/pastes`

Creates a new paste.

**Request Body:**
```json
{
  "content": "string (required, min length: 1)",
  "ttl_seconds": "number (optional, min: 1)",
  "max_views": "number (optional, min: 1)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "url": "https://your-app.com/p/{id}"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `500 Internal Server Error` - Database error

### Get Paste (API)

**GET** `/api/pastes/:id`

Fetches a paste and increments its view count atomically.

**Response:** `200 OK`
```json
{
  "content": "string",
  "remaining_views": "number | null",
  "expires_at": "string | null"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid paste ID format
- `404 Not Found` - Paste not found or unavailable
- `500 Internal Server Error` - Database error

**Headers (TEST_MODE only):**
- `x-test-now-ms` - Test time in milliseconds (only when `TEST_MODE=1`)

### View Paste (HTML)

**GET** `/p/:id`

Renders paste content as an HTML page. Also increments view count.

**Response:** `200 OK` - HTML page with paste content

**Error Response:**
- `404 Not Found` - Custom 404 page for unavailable pastes

## Design Decisions

1. **Supabase/PostgreSQL**
   - Chosen for reliable persistence in serverless environments
   - Built-in connection pooling and scalability
   - Row-level security support (not used in this app, but available)

2. **Atomic View Increment**
   - Database function prevents race conditions
   - Ensures accurate view counting even under concurrent access

3. **Generated Expiry Column**
   - Trigger automatically calculates `expires_at` from `ttl_seconds`
   - Reduces application logic and potential bugs

4. **TEST_MODE Support**
   - Header-based time override (`x-test-now-ms`) for deterministic testing
   - Allows testing expiry logic without waiting for real time to pass

5. **Safe HTML Rendering**
   - React's default escaping prevents XSS attacks
   - Uses `<pre>` tag with `whitespace-pre-wrap` to preserve formatting
   - No `dangerouslySetInnerHTML` usage

6. **Type Safety**
   - TypeScript throughout the codebase
   - Zod schemas for runtime validation
   - Generated database types from Supabase

7. **Error Handling**
   - Custom error classes for better error handling
   - Standardized error response format
   - Proper HTTP status codes

## Project Structure

```
pastebin-lite/
├── app/
│   ├── api/
│   │   ├── healthz/          # Health check endpoint
│   │   └── pastes/
│   │       ├── route.ts       # POST /api/pastes
│   │       └── [id]/
│   │           └── route.ts   # GET /api/pastes/:id
│   ├── p/
│   │   └── [id]/
│   │       ├── page.tsx       # GET /p/:id (HTML view)
│   │       └── not-found.tsx # 404 page
│   └── page.tsx               # Home page (create paste)
├── lib/
│   ├── db/
│   │   └── pastes.ts          # Database query functions
│   ├── schemas/
│   │   └── paste.ts           # Zod validation schemas
│   ├── supabase/
│   │   ├── client.ts          # Browser Supabase client
│   │   └── server.ts          # Server Supabase client
│   ├── types/
│   │   ├── database.ts        # Supabase generated types
│   │   └── paste.ts           # Application types
│   └── utils/
│       ├── errors.ts          # Custom error classes
│       └── test-mode.ts       # TEST_MODE utilities
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── README.md
```

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project → **Settings** → **Environment Variables**
   - Add the following:
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
     - `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
     - `TEST_MODE` - Set to `0` for production, `1` for testing

4. **Ensure Database Migration** has been run in Supabase

5. **Redeploy** if you added environment variables after initial deployment

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- **Netlify**
- **Railway**
- **Render**
- **AWS Amplify**
- Any Node.js hosting platform

Make sure to set all required environment variables in your hosting platform's dashboard.

## Testing

The application supports deterministic testing via the `TEST_MODE` environment variable.

### Enable TEST_MODE

Set `TEST_MODE=1` in your environment variables.

### Using TEST_MODE

Send requests with the `x-test-now-ms` header to override the current time:

```bash
# Example: Test with a specific time
curl -H "x-test-now-ms: 1704067200000" \
     http://localhost:3000/api/pastes/{paste-id}
```

The expiry logic will use the header time instead of the system time, allowing you to:
- Test paste expiration without waiting
- Test concurrent access scenarios
- Create reproducible test cases

### Test Scenarios

1. **TTL Expiry**: Set `x-test-now-ms` to a time after the paste expiration
2. **View Limit**: Create a paste with `max_views=1`, fetch it twice
3. **Concurrent Access**: Test multiple simultaneous requests
4. **Invalid Input**: Test validation with invalid UUIDs, negative numbers, etc.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Prefer server components over client components
- Use Zod for runtime validation
- Follow Next.js App Router conventions

## Troubleshooting

### Database Connection Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Ensure database migration has been run

### 404 Errors on Paste View

- Verify paste ID is a valid UUID
- Check paste hasn't expired or reached view limit
- Ensure database migration includes all functions

### Environment Variables Not Working

- Restart the development server after adding `.env.local`
- Ensure variable names start with `NEXT_PUBLIC_` for client-side access
- Check for typos in variable names

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
