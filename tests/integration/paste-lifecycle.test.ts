/**
 * Integration tests for complete paste lifecycle
 * Tests view limits, TTL expiry, and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/pastes/route';
import { GET } from '@/app/api/pastes/[id]/route';
import { createPaste, getPasteAndIncrementViews, getPasteUnavailabilityReason } from '@/lib/db/pastes';
import { createMockRequest, createTestRequest, getJsonResponse } from '../utils/test-helpers';

// Mock the database functions
vi.mock('@/lib/db/pastes', () => ({
  createPaste: vi.fn(),
  getPasteAndIncrementViews: vi.fn(),
  getPasteUnavailabilityReason: vi.fn(),
}));

describe('Paste Lifecycle Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEST_MODE = '0';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('View Limit Functionality', () => {
    it('should prevent access after max_views is reached', async () => {
      const pasteId = '123e4567-e89b-12d3-a456-426614174000';

      // Step 1: Create paste with max_views: 1
      const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
        method: 'POST',
        body: {
          content: 'One view only',
          max_views: 1,
        },
      });

      const mockPaste = {
        id: pasteId,
        content: 'One view only',
        ttl_seconds: null,
        max_views: 1,
        view_count: 0,
        created_at: new Date().toISOString(),
        expires_at: null,
      };

      vi.mocked(createPaste).mockResolvedValue(mockPaste as any);

      const createResponse = await POST(createRequest);
      const createData = await getJsonResponse<{ id: string; url: string }>(createResponse);

      expect(createResponse.status).toBe(201);
      expect(createData.id).toBe(pasteId);

      // Step 2: First view should succeed
      const firstViewPaste = {
        ...mockPaste,
        view_count: 1, // Incremented
      };

      vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce(firstViewPaste as any);

      const firstGetRequest = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);
      const firstGetResponse = await GET(firstGetRequest, { params: Promise.resolve({ id: pasteId }) });
      const firstGetData = await getJsonResponse<{ content: string; remaining_views: number | null; expires_at: string | null }>(firstGetResponse);

      expect(firstGetResponse.status).toBe(200);
      expect(firstGetData.content).toBe('One view only');
      expect(firstGetData.remaining_views).toBe(0); // 1 - 1 = 0

      // Step 3: Second view should fail (404)
      vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce(null);
      vi.mocked(getPasteUnavailabilityReason).mockResolvedValueOnce({
        reason: 'max_views_reached',
        paste: {
          id: pasteId,
          max_views: 1,
          view_count: 1,
        } as any,
      });

      const secondGetRequest = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);
      const secondGetResponse = await GET(secondGetRequest, { params: Promise.resolve({ id: pasteId }) });
      const secondGetData = await getJsonResponse<{ error: string; message?: string; reason?: string }>(secondGetResponse);

      expect(secondGetResponse.status).toBe(404);
      expect(secondGetData.error).toBe('Paste unavailable');
    });

    it('should track remaining views correctly with multiple views', async () => {
      const pasteId = '123e4567-e89b-12d3-a456-426614174001';

      // Create paste with max_views: 5
      const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
        method: 'POST',
        body: {
          content: 'Multiple views',
          max_views: 5,
        },
      });

      const mockPaste = {
        id: pasteId,
        content: 'Multiple views',
        ttl_seconds: null,
        max_views: 5,
        view_count: 0,
        created_at: new Date().toISOString(),
        expires_at: null,
      };

      vi.mocked(createPaste).mockResolvedValue(mockPaste as any);
      await POST(createRequest);

      // Simulate 3 views
      for (let viewCount = 1; viewCount <= 3; viewCount++) {
        const viewPaste = {
          ...mockPaste,
          view_count: viewCount,
        };

        vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce(viewPaste as any);

        const getRequest = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);
        const getResponse = await GET(getRequest, { params: Promise.resolve({ id: pasteId }) });
        const getData = await getJsonResponse<{ content: string; remaining_views: number | null; expires_at: string | null }>(getResponse);

        expect(getResponse.status).toBe(200);
        expect(getData.remaining_views).toBe(5 - viewCount);
      }
    });
  });

  describe('TTL Expiry Functionality', () => {
    it('should prevent access after TTL expires', async () => {
      process.env.TEST_MODE = '1';
      const pasteId = '123e4567-e89b-12d3-a456-426614174002';
      const testNowMs = Date.now();

      // Create paste with TTL: 5 seconds
      const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
        method: 'POST',
        body: {
          content: 'Expires soon',
          ttl_seconds: 5,
        },
      });

      const mockPaste = {
        id: pasteId,
        content: 'Expires soon',
        ttl_seconds: 5,
        max_views: null,
        view_count: 0,
        created_at: new Date(testNowMs).toISOString(),
        expires_at: new Date(testNowMs + 5000).toISOString(),
      };

      vi.mocked(createPaste).mockResolvedValue(mockPaste as any);
      await POST(createRequest);

      // View before expiry should succeed
      vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce({
        ...mockPaste,
        view_count: 1,
      } as any);

      const beforeExpiryRequest = createTestRequest(
        `http://localhost:3000/api/pastes/${pasteId}`,
        testNowMs + 3000 // 3 seconds later, still valid
      );

      const beforeExpiryResponse = await GET(beforeExpiryRequest, { params: Promise.resolve({ id: pasteId }) });
      const beforeExpiryData = await getJsonResponse<{ content: string; remaining_views: number | null; expires_at: string | null }>(beforeExpiryResponse);

      expect(beforeExpiryResponse.status).toBe(200);
      expect(beforeExpiryData.content).toBe('Expires soon');

      // View after expiry should fail (404)
      vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce(null);
      vi.mocked(getPasteUnavailabilityReason).mockResolvedValueOnce({
        reason: 'expired',
        paste: {
          id: pasteId,
          expires_at: new Date(testNowMs + 5000).toISOString(),
        } as any,
      });

      const afterExpiryRequest = createTestRequest(
        `http://localhost:3000/api/pastes/${pasteId}`,
        testNowMs + 6000 // 6 seconds later, expired
      );

      const afterExpiryResponse = await GET(afterExpiryRequest, { params: Promise.resolve({ id: pasteId }) });
      const afterExpiryData = await getJsonResponse<{ error: string; message?: string; reason?: string }>(afterExpiryResponse);

      expect(afterExpiryResponse.status).toBe(404);
      expect(afterExpiryData.error).toBe('Paste unavailable');
    });
  });

  describe('Combined Constraints', () => {
    it('should expire when TTL is reached even if views remain', async () => {
      process.env.TEST_MODE = '1';
      const pasteId = '123e4567-e89b-12d3-a456-426614174003';
      const testNowMs = Date.now();

      // Create paste with TTL: 3 seconds and max_views: 10
      const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
        method: 'POST',
        body: {
          content: 'TTL wins',
          ttl_seconds: 3,
          max_views: 10,
        },
      });

      const mockPaste = {
        id: pasteId,
        content: 'TTL wins',
        ttl_seconds: 3,
        max_views: 10,
        view_count: 0,
        created_at: new Date(testNowMs).toISOString(),
        expires_at: new Date(testNowMs + 3000).toISOString(),
      };

      vi.mocked(createPaste).mockResolvedValue(mockPaste as any);
      await POST(createRequest);

      // After TTL expires, should return 404 even though views remain
      vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce(null);
      vi.mocked(getPasteUnavailabilityReason).mockResolvedValueOnce({
        reason: 'expired',
        paste: {
          id: pasteId,
          expires_at: new Date(testNowMs + 3000).toISOString(),
        } as any,
      });

      const expiredRequest = createTestRequest(
        `http://localhost:3000/api/pastes/${pasteId}`,
        testNowMs + 4000 // 4 seconds later, expired
      );

      const expiredResponse = await GET(expiredRequest, { params: Promise.resolve({ id: pasteId }) });
      const expiredData = await getJsonResponse<{ error: string; message?: string; reason?: string }>(expiredResponse);

      expect(expiredResponse.status).toBe(404);
      expect(expiredData.error).toBe('Paste unavailable');
    });

    it('should expire when view limit is reached even if TTL remains', async () => {
      const pasteId = '123e4567-e89b-12d3-a456-426614174004';

      // Create paste with TTL: 3600 seconds and max_views: 1
      const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
        method: 'POST',
        body: {
          content: 'Views win',
          ttl_seconds: 3600,
          max_views: 1,
        },
      });

      const mockPaste = {
        id: pasteId,
        content: 'Views win',
        ttl_seconds: 3600,
        max_views: 1,
        view_count: 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      vi.mocked(createPaste).mockResolvedValue(mockPaste as any);
      await POST(createRequest);

      // First view succeeds
      vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce({
        ...mockPaste,
        view_count: 1,
      } as any);

      const firstRequest = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);
      const firstResponse = await GET(firstRequest, { params: Promise.resolve({ id: pasteId }) });
      expect(firstResponse.status).toBe(200);

      // Second view fails (view limit reached) even though TTL is still valid
      vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce(null);
      vi.mocked(getPasteUnavailabilityReason).mockResolvedValueOnce({
        reason: 'max_views_reached',
        paste: {
          id: pasteId,
          max_views: 1,
          view_count: 1,
        } as any,
      });

      const secondRequest = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);
      const secondResponse = await GET(secondRequest, { params: Promise.resolve({ id: pasteId }) });
      const secondData = await getJsonResponse<{ error: string; message?: string; reason?: string }>(secondResponse);

      expect(secondResponse.status).toBe(404);
      expect(secondData.error).toBe('Paste unavailable');
    });
  });

  describe('Edge Cases', () => {
    it('should handle paste with no constraints (unlimited)', async () => {
      const pasteId = '123e4567-e89b-12d3-a456-426614174005';

      // Create paste with no TTL and no max_views
      const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
        method: 'POST',
        body: {
          content: 'Unlimited paste',
        },
      });

      const mockPaste = {
        id: pasteId,
        content: 'Unlimited paste',
        ttl_seconds: null,
        max_views: null,
        view_count: 100, // Can be viewed many times
        created_at: new Date().toISOString(),
        expires_at: null,
      };

      vi.mocked(createPaste).mockResolvedValue(mockPaste as any);
      await POST(createRequest);

      // Should be viewable multiple times
      for (let i = 0; i < 5; i++) {
        vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce({
          ...mockPaste,
          view_count: 100 + i,
        } as any);

        const getRequest = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);
        const getResponse = await GET(getRequest, { params: Promise.resolve({ id: pasteId }) });
        const getData = await getJsonResponse<{ content: string; remaining_views: number | null; expires_at: string | null }>(getResponse);

        expect(getResponse.status).toBe(200);
        expect(getData.remaining_views).toBe(null);
        expect(getData.expires_at).toBe(null);
      }
    });
  });
});

