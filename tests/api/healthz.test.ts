/**
 * Tests for GET /api/healthz endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/healthz/route';
import { testDatabaseConnection } from '@/lib/db/pastes';

// Mock the database connection function
vi.mock('@/lib/db/pastes', () => ({
  testDatabaseConnection: vi.fn(),
}));

describe('GET /api/healthz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ok: true when database is healthy', async () => {
    // Arrange
    vi.mocked(testDatabaseConnection).mockResolvedValue(true);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(testDatabaseConnection).toHaveBeenCalledOnce();
  });

  it('should return ok: false with 503 status when database is unhealthy', async () => {
    // Arrange
    vi.mocked(testDatabaseConnection).mockResolvedValue(false);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(503);
    expect(data).toEqual({ ok: false });
    expect(testDatabaseConnection).toHaveBeenCalledOnce();
  });

  it('should return ok: false with 503 status when database connection throws error', async () => {
    // Arrange
    vi.mocked(testDatabaseConnection).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(503);
    expect(data).toEqual({ ok: false });
  });
});

