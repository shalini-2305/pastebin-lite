import { createServerClient } from '@/lib/supabase/server';
import { CreatePasteInput, Paste } from '@/lib/types/paste';
import { Database } from '@/lib/types/database';
import { DatabaseError, PasteNotFoundError } from '@/lib/utils/errors';

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('pastes').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Create a new paste
export async function createPaste(input: CreatePasteInput): Promise<Paste> {
  const supabase = createServerClient();
  
  const insertPayload = {
    content: input.content,
    ttl_seconds: input.ttl_seconds ?? null,
    max_views: input.max_views ?? null,
  };
  
  const { data, error } = await supabase
    .from('pastes')
    .insert(insertPayload as any)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to create paste: ${error.message}`);
  }

  if (!data) {
    throw new DatabaseError('Failed to create paste: No data returned');
  }

  return data as Paste;
}

// Check if paste is available
export async function checkPasteAvailability(
  id: string,
  testNowMs?: number
): Promise<boolean> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase.rpc('is_paste_available', {
    paste_id: id,
    test_now_ms: testNowMs ?? null,
  } as any);

  if (error) {
    throw new DatabaseError(`Failed to check availability: ${error.message}`);
  }

  return data === true;
}

// Get paste and increment view count atomically
export async function getPasteAndIncrementViews(
  id: string,
  testNowMs?: number
): Promise<Paste | null> {
  const supabase = createServerClient();

  // First increment views (atomic operation)
  const { data: viewCount, error: incrementError } = await supabase.rpc(
    'increment_paste_views',
    {
      paste_id: id,
      test_now_ms: testNowMs ?? null,
    } as any
  );

  if (incrementError) {
    throw new DatabaseError(`Failed to increment views: ${incrementError.message}`);
  }
  
  if (viewCount === -1) {
    return null; // Paste unavailable or doesn't exist
  }

  // Then fetch the paste
  const { data, error } = await supabase
    .from('pastes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Paste;
}

// Get paste without incrementing views (for HTML view)
export async function getPaste(
  id: string,
  testNowMs?: number
): Promise<Paste | null> {
  const supabase = createServerClient();

  // Check availability first
  const isAvailable = await checkPasteAvailability(id, testNowMs);
  if (!isAvailable) {
    return null;
  }

  // Fetch the paste
  const { data, error } = await supabase
    .from('pastes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Paste;
}

// Get paste without availability checks (for determining unavailability reason)
export async function getPasteRaw(
  id: string
): Promise<Paste | null> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('pastes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Paste;
}

// Determine why a paste is unavailable
export async function getPasteUnavailabilityReason(
  id: string,
  testNowMs?: number
): Promise<{ reason: 'not_found' | 'expired' | 'max_views_reached'; paste?: Paste | null }> {
  const paste = await getPasteRaw(id);
  
  // Paste doesn't exist
  if (!paste) {
    return { reason: 'not_found' };
  }

  // Determine current time
  const now = testNowMs ? new Date(testNowMs) : new Date();
  
  // Check if expired
  if (paste.expires_at) {
    const expiresAt = new Date(paste.expires_at);
    if (now >= expiresAt) {
      return { reason: 'expired', paste };
    }
  }

  // Check if max views reached
  if (paste.max_views !== null && paste.view_count >= paste.max_views) {
    return { reason: 'max_views_reached', paste };
  }

  // Should not reach here if paste is unavailable, but return not_found as fallback
  return { reason: 'not_found', paste };
}

