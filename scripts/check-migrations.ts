#!/usr/bin/env node

/**
 * Migration check script
 * Verifies database schema exists and provides setup instructions if needed
 * 
 * Usage: npm run check-migrations
 * Or: tsx scripts/check-migrations.ts
 */

import { checkSchemaExists, getMigrationSQL } from '../lib/db/migrations';

async function main() {
  console.log('🔍 Checking database schema...\n');

  const schemaExists = await checkSchemaExists();

  if (schemaExists) {
    console.log('✅ Database schema is set up correctly!');
    process.exit(0);
  } else {
    console.log('❌ Database schema not found.');
    console.log('\n📋 To set up the database:');
    console.log('\nOption 1: Use Supabase Dashboard (Recommended)');
    console.log('1. Go to your Supabase Dashboard → SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Copy and paste the migration SQL from: supabase/migrations/001_initial_schema.sql');
    console.log('4. Run the query');
    
    console.log('\nOption 2: Use Supabase CLI');
    console.log('1. Install Supabase CLI: npm install -g supabase');
    console.log('2. Link your project: supabase link --project-ref YOUR_PROJECT_REF');
    console.log('3. Run migration: supabase db push');
    
    console.log('\nOption 3: Automatic setup (if SUPABASE_SERVICE_ROLE_KEY is set)');
    console.log('Set SUPABASE_SERVICE_ROLE_KEY in your environment and run this script again.');
    
    console.log('\n📄 Migration SQL location: supabase/migrations/001_initial_schema.sql');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

