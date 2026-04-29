/**
 * SSOT for test-data identification and gating.
 *
 * Used by both populate-test-data and reset-test-data.
 *
 * Production gating: we DO NOT use SUPABASE_URL.includes('supabase.co') —
 * that string is present in every Supabase project URL and would block the
 * function unconditionally. Gating relies on:
 *   1. Explicit ENVIRONMENT=production env var (opt-in kill switch).
 *   2. Admin-role check at the call site (already enforced in both functions).
 */

export const TEST_EMAIL_PATTERNS = [
  'email.ilike.%@test.ch',
  'email.ilike.%@handwerk.ch',
  'email.ilike.test@%',
  'email.ilike.%example%',
  'email.ilike.%dummy%',
].join(',');

export function isProductionBlocked(): boolean {
  return Deno.env.get('ENVIRONMENT') === 'production';
}
