import { NextRequest, NextResponse } from 'next/server';
import { createPasteSchema } from '@/lib/schemas/paste';
import { createPaste } from '@/lib/db/pastes';
import { CreatePasteResponse } from '@/lib/types/paste';
import { ValidationError, DatabaseError } from '@/lib/utils/errors';

/**
 * Create a new paste.
 * 
 * @route POST /api/pastes
 * @body { content: string, ttl_seconds?: number, max_views?: number }
 * @returns { id: string, url: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate input using Zod schema
    const validationResult = createPasteSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: firstError.message,
          field: firstError.path.join('.'),
        },
        { status: 400 }
      );
    }

    const input = validationResult.data;

    // Create paste in database
    let paste;
    try {
      paste = await createPaste(input);
    } catch (error) {
      // Handle database errors
      if (error instanceof DatabaseError) {
        return NextResponse.json(
          { error: 'Database error', message: error.message },
          { status: 500 }
        );
      }
      // Re-throw unexpected errors
      throw error;
    }

    // Generate paste URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${appUrl}/p/${paste.id}`;

    const response: CreatePasteResponse = {
      id: paste.id,
      url,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    // Log unexpected errors for debugging
    console.error('Error creating paste:', error);
    
    // Return generic error to client (don't expose internal details)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

