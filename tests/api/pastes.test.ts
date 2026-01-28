/**
 * Tests for POST /api/pastes endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/pastes/route';
import { createPaste } from '@/lib/db/pastes';
import { createMockRequest, getJsonResponse } from '../utils/test-helpers';
import { DatabaseError } from '@/lib/utils/errors';

// Mock the database functions
vi.mock('@/lib/db/pastes', () => ({
  createPaste: vi.fn(),
}));

describe('POST /api/pastes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default app URL
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('should create a paste successfully with all fields', async () => {
    // Arrange
    const mockPaste = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      content: 'Hello World',
      ttl_seconds: 60,
      max_views: 3,
      view_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60000).toISOString(),
    };

    vi.mocked(createPaste).mockResolvedValue(mockPaste as any);

    const request = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: 'Hello World',
        ttl_seconds: 60,
        max_views: 3,
      },
    });

    // Act
    const response = await POST(request);
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: mockPaste.id,
      url: expect.stringContaining('/p/'),
    });
    expect(data.url).toBe(`http://localhost:3000/p/${mockPaste.id}`);
    expect(createPaste).toHaveBeenCalledWith({
      content: 'Hello World',
      ttl_seconds: 60,
      max_views: 3,
    });
  });

  it('should create a paste with only content (no TTL or max_views)', async () => {
    // Arrange
    const mockPaste = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      content: 'Simple paste',
      ttl_seconds: null,
      max_views: null,
      view_count: 0,
      created_at: new Date().toISOString(),
      expires_at: null,
    };

    vi.mocked(createPaste).mockResolvedValue(mockPaste as any);

    const request = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: 'Simple paste',
      },
    });

    // Act
    const response = await POST(request);
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: mockPaste.id,
      url: expect.stringContaining('/p/'),
    });
    expect(createPaste).toHaveBeenCalledWith({
      content: 'Simple paste',
    });
  });

  it('should return 400 for empty content', async () => {
    // Arrange
    const request = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: '',
      },
    });

    // Act
    const response = await POST(request);
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Content must be non-empty');
    expect(createPaste).not.toHaveBeenCalled();
  });

  it('should return 400 for missing content', async () => {
    // Arrange
    const request = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {},
    });

    // Act
    const response = await POST(request);
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(createPaste).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid ttl_seconds (negative)', async () => {
    // Arrange
    const request = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: 'Test',
        ttl_seconds: -1,
      },
    });

    // Act
    const response = await POST(request);
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(createPaste).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid max_views (zero)', async () => {
    // Arrange
    const request = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: 'Test',
        max_views: 0,
      },
    });

    // Act
    const response = await POST(request);
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(createPaste).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid JSON', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Act
    const response = await POST(request);
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'Invalid JSON',
      message: 'Request body must be valid JSON',
    });
    expect(createPaste).not.toHaveBeenCalled();
  });

  it('should return 500 for database errors', async () => {
    // Arrange
    vi.mocked(createPaste).mockRejectedValue(
      new DatabaseError('Database connection failed')
    );

    const request = createMockRequest('http://localhost:3000/api/pastes', {
      method: 'POST',
      body: {
        content: 'Test content',
      },
    });

    // Act
    const response = await POST(request);
    const data = await getJsonResponse(response);

    // Assert
    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: 'Database error',
      message: 'Database connection failed',
    });
  });
});

