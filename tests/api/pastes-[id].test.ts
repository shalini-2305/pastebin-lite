/**
 * Tests for GET /api/pastes/:id endpoint
 * Includes tests for view limit and TTL expiry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/pastes/[id]/route';
import { getPasteAndIncrementViews, getPasteUnavailabilityReason } from '@/lib/db/pastes';
import { createMockRequest, createTestRequest, getJsonResponse } from '../utils/test-helpers';
import { DatabaseError } from '@/lib/utils/errors';

// Mock the database functions
vi.mock('@/lib/db/pastes', () => ({
  getPasteAndIncrementViews: vi.fn(),
  getPasteUnavailabilityReason: vi.fn(),
}));

describe('GET /api/pastes/:id', () => {
  const pasteId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEST_MODE = '0';
  });

  it('should return paste successfully with unlimited views', async () => {
    // Arrange
    const mockPaste = {
      id: pasteId,
      content: 'Hello World',
      ttl_seconds: null,
      max_views: null,
      view_count: 5,
      created_at: new Date().toISOString(),
      expires_at: null,
    };

    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(mockPaste as any);

    const request = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      content: 'Hello World',
      remaining_views: null,
      expires_at: null,
    });
    expect(getPasteAndIncrementViews).toHaveBeenCalledWith(pasteId, undefined);
  });

  it('should return paste with remaining views calculated correctly', async () => {
    // Arrange
    const mockPaste = {
      id: pasteId,
      content: 'Test content',
      ttl_seconds: 3600,
      max_views: 10,
      view_count: 3,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };

    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(mockPaste as any);

    const request = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      content: 'Test content',
      remaining_views: 7, // 10 - 3 = 7
      expires_at: mockPaste.expires_at,
    });
  });

  it('should return 404 when paste is not found', async () => {
    // Arrange
    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(null);
    vi.mocked(getPasteUnavailabilityReason).mockResolvedValue({
      reason: 'not_found',
    });

    const request = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(404);
    expect(data).toMatchObject({
      error: 'Paste not found',
      reason: 'not_found',
      message: expect.stringContaining('does not exist or has been deleted'),
    });
  });

  it('should return 404 when view limit is reached', async () => {
    // Arrange
    // When view limit is reached, the function returns null
    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(null);
    vi.mocked(getPasteUnavailabilityReason).mockResolvedValue({
      reason: 'max_views_reached',
      paste: {
        id: pasteId,
        max_views: 5,
        view_count: 5,
      } as any,
    });

    const request = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(404);
    expect(data).toMatchObject({
      error: 'Paste unavailable',
      reason: 'max_views_reached',
      message: expect.stringContaining('maximum view limit'),
    });
  });

  it('should return 404 when TTL has expired', async () => {
    // Arrange
    // When TTL expires, the function returns null
    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(null);
    vi.mocked(getPasteUnavailabilityReason).mockResolvedValue({
      reason: 'expired',
      paste: {
        id: pasteId,
        expires_at: new Date(Date.now() - 1000).toISOString(),
      } as any,
    });

    const request = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(404);
    expect(data).toMatchObject({
      error: 'Paste unavailable',
      reason: 'expired',
      message: expect.stringContaining('expired'),
    });
  });

  it('should return 400 for invalid UUID format', async () => {
    // Arrange
    const invalidId = 'not-a-uuid';
    const request = createMockRequest(`http://localhost:3000/api/pastes/${invalidId}`);

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: invalidId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Validation failed',
      message: expect.stringContaining('Invalid paste ID format'),
    });
    expect(getPasteAndIncrementViews).not.toHaveBeenCalled();
  });

  it('should support TEST_MODE with x-test-now-ms header', async () => {
    // Arrange
    process.env.TEST_MODE = '1';
    const testNowMs = Date.now();

    const mockPaste = {
      id: pasteId,
      content: 'Test content',
      ttl_seconds: 60,
      max_views: null,
      view_count: 1,
      created_at: new Date().toISOString(),
      expires_at: new Date(testNowMs + 60000).toISOString(),
    };

    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(mockPaste as any);

    const request = createTestRequest(
      `http://localhost:3000/api/pastes/${pasteId}`,
      testNowMs
    );

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(200);
    expect(data.content).toBe('Test content');
    expect(getPasteAndIncrementViews).toHaveBeenCalledWith(pasteId, testNowMs);
  });

  it('should ignore x-test-now-ms header when TEST_MODE is not enabled', async () => {
    // Arrange
    process.env.TEST_MODE = '0';
    const testNowMs = Date.now();

    const mockPaste = {
      id: pasteId,
      content: 'Test content',
      ttl_seconds: null,
      max_views: null,
      view_count: 1,
      created_at: new Date().toISOString(),
      expires_at: null,
    };

    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(mockPaste as any);

    const request = createTestRequest(
      `http://localhost:3000/api/pastes/${pasteId}`,
      testNowMs
    );

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(200);
    // Should be called with undefined, not testNowMs
    expect(getPasteAndIncrementViews).toHaveBeenCalledWith(pasteId, undefined);
  });

  it('should return 500 for database errors', async () => {
    // Arrange
    vi.mocked(getPasteAndIncrementViews).mockRejectedValue(
      new DatabaseError('Database connection failed')
    );

    const request = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: 'Database error',
      message: 'Failed to fetch paste',
    });
  });

  it('should return remaining_views as 0 when view_count equals max_views', async () => {
    // Arrange
    const mockPaste = {
      id: pasteId,
      content: 'Last view',
      ttl_seconds: null,
      max_views: 5,
      view_count: 5, // Already at max
      created_at: new Date().toISOString(),
      expires_at: null,
    };

    vi.mocked(getPasteAndIncrementViews).mockResolvedValue(mockPaste as any);

    const request = createMockRequest(`http://localhost:3000/api/pastes/${pasteId}`);

    // Act
    const response = await GET(request, { params: Promise.resolve({ id: pasteId }) });
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(200);
    expect(data.remaining_views).toBe(0);
  });
});

