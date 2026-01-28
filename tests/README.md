# Testing Guide

This directory contains comprehensive tests for the Pastebin-Lite application.

## Test Structure

```
tests/
├── setup.ts                    # Test configuration and setup
├── utils/
│   └── test-helpers.ts         # Reusable test utilities
├── api/
│   ├── healthz.test.ts         # Health check endpoint tests
│   ├── pastes.test.ts          # Create paste endpoint tests
│   └── pastes-[id].test.ts     # Get paste endpoint tests
├── integration/
│   └── paste-lifecycle.test.ts # Integration tests for paste lifecycle
├── e2e/
│   └── paste-workflow.test.ts  # End-to-end workflow tests
└── pages/
    └── paste-page.test.tsx     # Paste view page tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests with UI
```bash
npm run test:ui
```

### Run specific test file
```bash
npm test tests/api/healthz.test.ts
```

## Test Coverage

### API Endpoints

1. **Health Check (`GET /api/healthz`)**
   - ✅ Returns `ok: true` when database is healthy
   - ✅ Returns `ok: false` with 503 when database is unhealthy
   - ✅ Handles database connection errors

2. **Create Paste (`POST /api/pastes`)**
   - ✅ Creates paste with all fields (content, TTL, max_views)
   - ✅ Creates paste with only content
   - ✅ Validates empty content (400)
   - ✅ Validates missing content (400)
   - ✅ Validates invalid TTL (400)
   - ✅ Validates invalid max_views (400)
   - ✅ Handles invalid JSON (400)
   - ✅ Handles database errors (500)

3. **Get Paste (`GET /api/pastes/:id`)**
   - ✅ Returns paste with unlimited views
   - ✅ Returns paste with remaining views calculated
   - ✅ Returns 404 when paste not found
   - ✅ Returns 404 when view limit reached
   - ✅ Returns 404 when TTL expired
   - ✅ Validates UUID format (400)
   - ✅ Supports TEST_MODE with `x-test-now-ms` header
   - ✅ Ignores test header when TEST_MODE disabled
   - ✅ Handles database errors (500)
   - ✅ Calculates remaining_views correctly (including 0)

### Integration Tests

1. **View Limit Functionality**
   - ✅ Prevents access after max_views reached
   - ✅ Tracks remaining views correctly with multiple views

2. **TTL Expiry Functionality**
   - ✅ Prevents access after TTL expires
   - ✅ Allows access before expiry

3. **Combined Constraints**
   - ✅ TTL expiry wins even if views remain
   - ✅ View limit wins even if TTL remains

4. **Edge Cases**
   - ✅ Handles paste with no constraints (unlimited)

### End-to-End Tests

1. **Complete Workflow**
   - ✅ Create → View → View again
   - ✅ View limit exhaustion workflow
   - ✅ TTL expiry workflow

## Test Scenarios from Implementation Guide

All test scenarios from the implementation guide are covered:

1. ✅ **Test Health Check**: `tests/api/healthz.test.ts`
2. ✅ **Test Create Paste**: `tests/api/pastes.test.ts`
3. ✅ **Test Get Paste (API)**: `tests/api/pastes-[id].test.ts`
4. ✅ **Test View Limit**: `tests/integration/paste-lifecycle.test.ts`
5. ✅ **Test TTL**: `tests/integration/paste-lifecycle.test.ts`
6. ✅ **Test View Paste (HTML)**: `tests/pages/paste-page.test.tsx`

## Test Utilities

### `createMockRequest(url, options)`
Creates a mock NextRequest for testing API routes.

```typescript
const request = createMockRequest('http://localhost:3000/api/pastes', {
  method: 'POST',
  body: { content: 'Test' },
  headers: { 'Custom-Header': 'value' },
});
```

### `createTestRequest(url, testNowMs, options)`
Creates a mock NextRequest with test time header for TEST_MODE.

```typescript
const request = createTestRequest(
  'http://localhost:3000/api/pastes/123',
  Date.now(),
  { method: 'GET' }
);
```

### `getJsonResponse<T>(response)`
Extracts and parses JSON from a Response object.

```typescript
const data = await getJsonResponse<CreatePasteResponse>(response);
```

### `getFutureTimestamp(secondsFromNow)`
Calculates a future timestamp in milliseconds.

```typescript
const future = getFutureTimestamp(60); // 60 seconds from now
```

### `getPastTimestamp(secondsAgo)`
Calculates a past timestamp in milliseconds.

```typescript
const past = getPastTimestamp(60); // 60 seconds ago
```

## Mocking

Tests use Vitest's mocking capabilities to mock:
- Database functions (`@/lib/db/pastes`)
- Next.js modules (`next/headers`, `next/navigation`)
- Environment variables

## TEST_MODE Support

Tests can use TEST_MODE to control time deterministically:

```typescript
process.env.TEST_MODE = '1';
const testNowMs = Date.now();

const request = createTestRequest(url, testNowMs);
// Database functions will use testNowMs instead of current time
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Mocking**: Database operations are mocked to avoid external dependencies
3. **Coverage**: All endpoints, edge cases, and error scenarios are tested
4. **Readability**: Tests use descriptive names and clear arrange-act-assert structure
5. **Maintainability**: Reusable test utilities reduce code duplication

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies required (all mocked)
- Fast execution
- Deterministic results
- Comprehensive coverage

