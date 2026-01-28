import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db/pastes';
import { HealthCheckResponse } from '@/lib/types/paste';

/**
 * Health check endpoint for monitoring and load balancers.
 * Always returns HTTP 200 with ok: true/false to reflect database health.
 * 
 * @route GET /api/healthz
 */
export async function GET() {
  try {
    const dbHealthy = await testDatabaseConnection();
    
    const response: HealthCheckResponse = {
      ok: dbHealthy,
    };

    // Always return 200 as per requirements - health status is in the 'ok' field
    return NextResponse.json(response, {
      status: 200,
    });
  } catch (error) {
    console.error('Health check error:', error);
    // Always return 200 even on error - health status is in the 'ok' field
    return NextResponse.json(
      { ok: false },
      { status: 200 }
    );
  }
}

