import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db/pastes';
import { HealthCheckResponse } from '@/lib/types/paste';

/**
 * Health check endpoint for monitoring and load balancers.
 * Returns 200 if database is healthy, 503 otherwise.
 * 
 * @route GET /api/healthz
 */
export async function GET() {
  try {
    const dbHealthy = await testDatabaseConnection();
    
    const response: HealthCheckResponse = {
      ok: dbHealthy,
    };

    return NextResponse.json(response, {
      status: dbHealthy ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { ok: false },
      { status: 503 }
    );
  }
}

