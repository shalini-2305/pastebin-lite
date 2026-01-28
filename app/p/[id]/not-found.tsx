import { headers } from 'next/headers';
import { getPasteUnavailabilityReason } from '@/lib/db/pastes';
import { pasteIdSchema } from '@/lib/schemas/paste';
import Unavailable from './unavailable';

/**
 * Custom 404 page for unavailable pastes
 * Returns HTTP 404 with the same design as Unavailable component
 */
export default async function NotFound() {
  // Extract paste ID from headers
  // Try multiple sources: referer header, x-forwarded-uri, or x-invoke-path
  const headersList = await headers();
  const referer = headersList.get('referer') || '';
  const forwardedUri = headersList.get('x-forwarded-uri') || '';
  const invokePath = headersList.get('x-invoke-path') || '';
  
  // Extract ID from any available URL source (format: /p/[uuid])
  let pasteId: string | null = null;
  const uuidPattern = /\/p\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
  
  // Try referer first
  const refererMatch = referer.match(uuidPattern);
  if (refererMatch && refererMatch[1]) {
    pasteId = refererMatch[1];
  } else {
    // Try forwarded URI
    const forwardedMatch = forwardedUri.match(uuidPattern);
    if (forwardedMatch && forwardedMatch[1]) {
      pasteId = forwardedMatch[1];
    } else {
      // Try invoke path
      const invokeMatch = invokePath.match(uuidPattern);
      if (invokeMatch && invokeMatch[1]) {
        pasteId = invokeMatch[1];
      }
    }
  }

  // If we have a valid paste ID, fetch unavailability reason
  let unavailabilityInfo: {
    reason: 'not_found' | 'expired' | 'max_views_reached';
    paste?: any;
  } | null = null;

  if (pasteId) {
    const idValidation = pasteIdSchema.safeParse({ id: pasteId });
    if (idValidation.success) {
      try {
        // Get test time if TEST_MODE is enabled
        const headersListForTest = await headers();
        let testNowMs: number | null = null;
        
        if (process.env.TEST_MODE === '1') {
          const testNowMsHeader = headersListForTest.get('x-test-now-ms');
          if (testNowMsHeader) {
            const parsed = parseInt(testNowMsHeader, 10);
            testNowMs = isNaN(parsed) ? null : parsed;
          }
        }

        unavailabilityInfo = await getPasteUnavailabilityReason(
          pasteId,
          testNowMs ?? undefined
        );
      } catch (error) {
        // If we can't fetch the reason, use default
        console.error('Error fetching unavailability reason:', error);
      }
    }
  }

  // Use the unavailability info if available, otherwise default to 'not_found'
  const reason = unavailabilityInfo?.reason || 'not_found';
  const expiresAt = unavailabilityInfo?.paste?.expires_at;
  const maxViews = unavailabilityInfo?.paste?.max_views;
  const viewCount = unavailabilityInfo?.paste?.view_count;

  return (
    <Unavailable
      reason={reason}
      expiresAt={expiresAt}
      maxViews={maxViews}
      viewCount={viewCount}
    />
  );
}

