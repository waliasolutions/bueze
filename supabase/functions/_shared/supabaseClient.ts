// Shared Supabase client creation for Edge Functions
// SSOT for Supabase client initialization

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

/**
 * Create a Supabase admin client with service role key
 * @returns Supabase client instance
 */
export function createSupabaseAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get the Supabase URL from environment
 */
export function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }
  return url;
}

/**
 * Get the Supabase Anon Key from environment
 */
export function getSupabaseAnonKey(): string {
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY environment variable is not set');
  }
  return key;
}
