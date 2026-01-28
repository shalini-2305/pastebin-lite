/**
 * Test helper utilities for API route testing
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(url, requestInit);
}

/**
 * Create a mock NextRequest with test time header
 */
export function createTestRequest(
  url: string,
  testNowMs: number,
  options: {
    method?: string;
    body?: any;
    additionalHeaders?: Record<string, string>;
  } = {}
): NextRequest {
  return createMockRequest(url, {
    ...options,
    headers: {
      'x-test-now-ms': testNowMs.toString(),
      ...options.additionalHeaders,
    },
  });
}

/**
 * Extract JSON response from NextResponse
 */
export async function getJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T;
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a valid UUID for testing
 */
export function generateTestUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Calculate future timestamp in milliseconds
 */
export function getFutureTimestamp(secondsFromNow: number): number {
  return Date.now() + secondsFromNow * 1000;
}

/**
 * Calculate past timestamp in milliseconds
 */
export function getPastTimestamp(secondsAgo: number): number {
  return Date.now() - secondsAgo * 1000;
}

