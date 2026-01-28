/**
 * End-to-end workflow tests
 * Simulates real user scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/pastes/route';
import { GET } from '@/app/api/pastes/[id]/route';
import { createPaste, getPasteAndIncrementViews } from '@/lib/db/pastes';
import { createMockRequest, getJsonResponse } from '../utils/test-helpers';

// Mock the database functions
vi.mock('@/lib/db/pastes', () => ({
  createPaste: vi.fn(),
  getPasteAndIncrementViews: vi.fn(),
}));

describe('End-to-End Paste Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('should complete full workflow: create -> view -> view again', async () => {
    const pasteId = '123e4567-e89b-12d3-a456-426614174010';

    // Step 1: Create a paste
    const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: 'Hello, World!',
        ttl_seconds: 3600,
        max_views: 5,
      },
    });

    const mockPaste = {
      id: pasteId,
      content: 'Hello, World!',
      ttl_seconds: 3600,
      max_views: 5,
      view_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };

    vi.mocked(createPaste).mockResolvedValue(mockPaste as any);

    const createResponse = await POST(createRequest);
    const createData = await getJsonResponse(createResponse);

    expect(createResponse.status).toBe(201);
    expect(createData).toMatchObject({
      id: pasteId,
      url: `http://localhost:3000/p/${pasteId}`,
    });

    // Step 2: View the paste (first time)
    vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce({
      ...mockPaste,
      view_count: 1,
    } as any);

    const firstViewRequest = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);
    const firstViewResponse = await GET(firstViewRequest, { params: { id: pasteId } });
    const firstViewData = await getJsonResponse(firstViewResponse);

    expect(firstViewResponse.status).toBe(200);
    expect(firstViewData).toMatchObject({
      content: 'Hello, World!',
      remaining_views: 4, // 5 - 1 = 4
      expires_at: mockPaste.expires_at,
    });

    // Step 3: View the paste again (second time)
    vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce({
      ...mockPaste,
      view_count: 2,
    } as any);

    const secondViewRequest = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);
    const secondViewResponse = await GET(secondViewRequest, { params: { id: pasteId } });
    const secondViewData = await getJsonResponse(secondViewResponse);

    expect(secondViewResponse.status).toBe(200);
    expect(secondViewData).toMatchObject({
      content: 'Hello, World!',
      remaining_views: 3, // 5 - 2 = 3
    });
  });

  it('should handle workflow with view limit exhaustion', async () => {
    const pasteId = '123e4567-e89b-12d3-a456-426614174011';

    // Create paste with max_views: 2
    const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: 'Limited views',
        max_views: 2,
      },
    });

    const mockPaste = {
      id: pasteId,
      content: 'Limited views',
      ttl_seconds: null,
      max_views: 2,
      view_count: 0,
      created_at: new Date().toISOString(),
      expires_at: null,
    };

    vi.mocked(createPaste).mockResolvedValue(mockPaste as any);
    await POST(createRequest);

    // First view
    vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce({
      ...mockPaste,
      view_count: 1,
    } as any);

    const firstView = await GET(
      createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`),
      { params: { id: pasteId } }
    );
    expect(firstView.status).toBe(200);

    // Second view (last one)
    vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce({
      ...mockPaste,
      view_count: 2,
    } as any);

    const secondView = await GET(
      createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`),
      { params: { id: pasteId } }
    );
    expect(secondView.status).toBe(200);

    // Third view should fail
    vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce(null);

    const thirdView = await GET(
      createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`),
      { params: { id: pasteId } }
    );
    const thirdViewData = await getJsonResponse(thirdView);

    expect(thirdView.status).toBe(404);
    expect(thirdViewData.error).toBe('Paste not found');
  });

  it('should handle workflow with TTL expiry', async () => {
    process.env.TEST_MODE = '1';
    const pasteId = '123e4567-e89b-12d3-a456-426614174012';
    const testNowMs = Date.now();

    // Create paste with TTL: 2 seconds
    const createRequest = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: 'Short TTL',
        ttl_seconds: 2,
      },
    });

    const mockPaste = {
      id: pasteId,
      content: 'Short TTL',
      ttl_seconds: 2,
      max_views: null,
      view_count: 0,
      created_at: new Date(testNowMs).toISOString(),
      expires_at: new Date(testNowMs + 2000).toISOString(),
    };

    vi.mocked(createPaste).mockResolvedValue(mockPaste as any);
    await POST(createRequest);

    // View before expiry
    vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce({
      ...mockPaste,
      view_count: 1,
    } as any);

    const beforeExpiryRequest = new NextRequest(
      `http://localhost:3000/api/pastes/${pasteId}`,
      {
        headers: {
          'x-test-now-ms': (testNowMs + 1000).toString(),
        },
      }
    );

    const beforeExpiry = await GET(beforeExpiryRequest, { params: { id: pasteId } });
    expect(beforeExpiry.status).toBe(200);

    // View after expiry
    vi.mocked(getPasteAndIncrementViews).mockResolvedValueOnce(null);

    const afterExpiryRequest = new NextRequest(
      `http://localhost:3000/api/pastes/${pasteId}`,
      {
        headers: {
          'x-test-now-ms': (testNowMs + 3000).toString(),
        },
      }
    );

    const afterExpiry = await GET(afterExpiryRequest, { params: { id: pasteId } });
    const afterExpiryData = await getJsonResponse(afterExpiry);

    expect(afterExpiry.status).toBe(404);
    expect(afterExpiryData.error).toBe('Paste not found');
  });
});

