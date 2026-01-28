import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db/pastes';
import { healthCheckResponseSchema } from '@/lib/schemas/paste';

export async function GET() {
  try {
    // Test database connection
    const isConnected = await testDatabaseConnection();

    const response = {
      ok: isConnected,
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };

    // Validate response with schema (ensures response matches expected format)
    healthCheckResponseSchema.parse({
      ok: response.ok,
    });

    return NextResponse.json(response, {
      status: isConnected ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        ok: false,
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

