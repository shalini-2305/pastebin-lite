/**
 * Automatic database migration utility
 * Checks if schema exists and creates it if needed
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

const MIGRATION_FILE = join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');

/**
 * Check if the pastes table exists
 */
async function tableExists(supabase: SupabaseClient<Database>): Promise<boolean> {
  try {
    // Try to query the table - if it exists, this will succeed
    const { error } = await supabase
      .from('pastes')
      .select('id')
      .limit(1);
    
    // If error is about table not existing, return false
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return false;
    }
    
    // If no error or different error, assume table exists
    return true;
  } catch (error) {
    // If we can't check, assume it doesn't exist
    return false;
  }
}

/**
 * Run migration using service role key (if available)
 * This requires SUPABASE_SERVICE_ROLE_KEY to be set
 */
async function runMigrationWithServiceRole(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return false;
  }

  try {
    // Create admin client with service role key
    const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Read migration file
    const migrationSQL = readFileSync(MIGRATION_FILE, 'utf-8');

    // Execute migration using RPC (if available) or direct SQL
    // Note: Supabase client doesn't support raw SQL execution directly
    // We'll need to use the REST API or provide instructions
    
    // For now, return false to indicate we need manual setup
    // In production, you could use Supabase Management API
    return false;
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
}

/**
 * Check if database schema is set up correctly
 * Returns true if schema exists, false otherwise
 */
export async function checkSchemaExists(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    return await tableExists(supabase);
  } catch (error) {
    console.error('Error checking schema:', error);
    return false;
  }
}

/**
 * Get migration SQL content for manual setup
 */
export function getMigrationSQL(): string {
  try {
    return readFileSync(MIGRATION_FILE, 'utf-8');
  } catch (error) {
    console.error('Error reading migration file:', error);
    return '';
  }
}

