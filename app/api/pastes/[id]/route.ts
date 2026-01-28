import { NextRequest, NextResponse } from 'next/server';
import { getPasteAndIncrementViews } from '@/lib/db/pastes';
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
      return NextResponse.json(
        {
          error: 'Paste not found',
          message: 'Paste not found or unavailable (expired or view limit reached)',
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

