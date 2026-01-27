/**
 * Utility function to extract test time from request headers.
 * Only works when TEST_MODE environment variable is set to '1'.
 * 
 * @param request - The incoming Request object
 * @returns The test time in milliseconds, or null if not in test mode or header is missing
 */
export function getTestTime(request: Request): number | null {
  if (process.env.TEST_MODE !== '1') {
    return null;
  }

  const testNowMs = request.headers.get('x-test-now-ms');
  if (!testNowMs) {
    return null;
  }

  const parsed = parseInt(testNowMs, 10);
  return isNaN(parsed) ? null : parsed;
}

