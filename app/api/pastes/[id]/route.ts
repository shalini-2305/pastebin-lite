import { NextRequest, NextResponse } from 'next/server';
import { getPasteAndIncrementViews, getPasteUnavailabilityReason } from '@/lib/db/pastes';
import { PasteResponse } from '@/lib/types/paste';
import { getTestTime } from '@/lib/utils/test-mode';
import { pasteIdSchema } from '@/lib/schemas/paste';
import { DatabaseError, PasteNotFoundError } from '@/lib/utils/errors';

/**
 * Get a paste by ID and increment its view count atomically.
 * 
 * @route GET /api/pastes/:id
 * @param id - UUID of the paste
 * @header x-test-now-ms - Optional test time in milliseconds (only when TEST_MODE=1)
 * @returns { content: string, remaining_views: number | null, expires_at: string | null }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format using Zod schema
    const idValidation = pasteIdSchema.safeParse({ id });
    if (!idValidation.success) {
      const firstError = idValidation.error.errors[0];
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: firstError.message,
        },
        { status: 400 }
      );
    }

    // Get test time if TEST_MODE is enabled
    const testNowMs = getTestTime(request);

    // Get paste and increment views atomically
    let paste;
    try {
      paste = await getPasteAndIncrementViews(id, testNowMs ?? undefined);
    } catch (error) {
      // Handle database errors
      if (error instanceof DatabaseError) {
        console.error('Database error fetching paste:', error);
        return NextResponse.json(
          {
            error: 'Database error',
            message: 'Failed to fetch paste',
          },
          { status: 500 }
        );
      }
      // Re-throw unexpected errors
      throw error;
    }

    // Check if paste was found and is available
    if (!paste) {
      // Determine the specific reason why paste is unavailable
      const unavailabilityInfo = await getPasteUnavailabilityReason(
        id,
        testNowMs ?? undefined
      );

      let errorMessage: string;
      switch (unavailabilityInfo.reason) {
        case 'expired':
          errorMessage = unavailabilityInfo.paste?.expires_at
            ? `This paste expired on ${new Date(unavailabilityInfo.paste.expires_at).toLocaleString()}`
            : 'This paste has expired and is no longer available.';
          break;
        case 'max_views_reached':
          errorMessage = unavailabilityInfo.paste?.max_views !== null && unavailabilityInfo.paste?.view_count !== undefined
            ? `This paste has reached its maximum view limit of ${unavailabilityInfo.paste.max_views} views (currently at ${unavailabilityInfo.paste.view_count} views).`
            : 'This paste has reached its maximum view limit.';
          break;
        case 'not_found':
        default:
          errorMessage = 'This paste does not exist or has been deleted.';
          break;
      }

      return NextResponse.json(
        {
          error: unavailabilityInfo.reason === 'not_found' ? 'Paste not found' : 'Paste unavailable',
          message: errorMessage,
          reason: unavailabilityInfo.reason,
        },
        { status: 404 }
      );
    }

    // Calculate remaining views
    // If max_views is null, remaining_views is null (unlimited)
    // Otherwise, calculate: max_views - view_count (ensure non-negative)
    const remaining_views =
      paste.max_views !== null
        ? Math.max(0, paste.max_views - paste.view_count)
        : null;

    // Build response
    const response: PasteResponse = {
      content: paste.content,
      remaining_views,
      expires_at: paste.expires_at,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof PasteNotFoundError) {
      return NextResponse.json(
        {
          error: 'Paste not found',
          message: error.message,
        },
        { status: 404 }
      );
    }

    // Log unexpected errors for debugging
    console.error('Error fetching paste:', error);

    // Return generic error to client (don't expose internal details)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching the paste',
      },
      { status: 500 }
    );
  }
}

