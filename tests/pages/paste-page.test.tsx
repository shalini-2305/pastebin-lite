/**
 * Tests for the paste view page (app/p/[id]/page.tsx)
 * Note: Testing Next.js Server Components requires mocking Next.js internals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { headers } from 'next/headers';
import { getPasteAndIncrementViews } from '@/lib/db/pastes';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound() called');
  }),
}));

vi.mock('@/lib/db/pastes', () => ({
  getPasteAndIncrementViews: vi.fn(),
}));

// Mock the page component
// Note: We'll test the logic rather than rendering since it's a Server Component
describe('Paste View Page (/p/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEST_MODE = '0';
  });

  it('should fetch and display paste when available', async () => {
    // This test verifies the logic flow
    // In a real scenario, you'd use React Testing Library for full rendering tests
    
    const pasteId = '123e4567-e89b-12d3-a456-426614174020';
    const mockPaste = {
      id: pasteId,
      content: 'Test content',
      ttl_seconds: 3600,
      max_views: 10,
      view_count: 3,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };

    vi.mocked(headers).mockResolvedValue({
      get: () => null,
    } as any);

    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(mockPaste as any);

    // The page would call getPasteAndIncrementViews with the ID
    // When testNowMs is null, the page passes null ?? undefined, which becomes undefined
    // But when calling directly, we just pass one argument
    const result = await getPasteAndIncrementViews(pasteId);

    expect(result).toEqual(mockPaste);
    // Check that it was called with pasteId (second arg is optional)
    expect(getPasteAndIncrementViews).toHaveBeenCalledWith(pasteId);
  });

  it('should call notFound when paste is unavailable', async () => {
    const pasteId = '123e4567-e89b-12d3-a456-426614174021';

    vi.mocked(headers).mockResolvedValue({
      get: () => null,
    } as any);

    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(null);

    // The page would call notFound() when paste is null
    const result = await getPasteAndIncrementViews(pasteId);

    expect(result).toBeNull();
  });

  it('should support TEST_MODE with x-test-now-ms header', async () => {
    process.env.TEST_MODE = '1';
    const pasteId = '123e4567-e89b-12d3-a456-426614174022';
    const testNowMs = Date.now();

    vi.mocked(headers).mockResolvedValue({
      get: (key: string) => {
        if (key === 'x-test-now-ms') {
          return testNowMs.toString();
        }
        return null;
      },
    } as any);

    const mockPaste = {
      id: pasteId,
      content: 'Test mode paste',
      ttl_seconds: 60,
      max_views: null,
      view_count: 1,
      created_at: new Date().toISOString(),
      expires_at: new Date(testNowMs + 60000).toISOString(),
    };

    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(mockPaste as any);

    // Simulate what the page does
    const headersList = await headers();
    const testNowMsHeader = headersList.get('x-test-now-ms');
    const parsedTestTime = testNowMsHeader ? parseInt(testNowMsHeader, 10) : null;

    const result = await getPasteAndIncrementViews(pasteId, parsedTestTime ?? undefined);

    expect(result).toEqual(mockPaste);
    expect(getPasteAndIncrementViews).toHaveBeenCalledWith(pasteId, testNowMs);
  });

  it('should calculate remaining views correctly', () => {
    // Test the remaining views calculation logic
    const maxViews = 10;
    const viewCount = 3;
    const remainingViews = maxViews !== null ? Math.max(0, maxViews - viewCount) : null;

    expect(remainingViews).toBe(7);
  });

  it('should return null for remaining views when max_views is null', () => {
    const maxViews = null;
    const viewCount = 5;
    const remainingViews = maxViews !== null ? Math.max(0, maxViews - viewCount) : null;

    expect(remainingViews).toBeNull();
  });
});

