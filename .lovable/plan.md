# Fix: "Testdaten löschen" always returns 403

## Root cause (verified)

`supabase/functions/reset-test-data/index.ts:30`:
```ts
const isProduction = Deno.env.get('ENVIRONMENT') === 'production' || supabaseUrl.includes('supabase.co');
```

Every Supabase project URL is `https://<ref>.supabase.co` — so `.includes('supabase.co')` is **always true**. The function returns 403 "Test data functions disabled in production" 100% of the time. That's the "Edge Function returned a non-2xx status code" the user sees.

The same broken check exists in `supabase/functions/populate-test-data/index.ts:16-17`. The test-user email patterns are also duplicated between the two functions.

## Fix (SSOT + DRY)

One new shared helper, two consumers updated. No SQL, no schema change.

### 1. NEW `supabase/functions/_shared/testData.ts`
Owns both pieces of duplicated knowledge:
- `TEST_EMAIL_PATTERNS` — the `.or()` filter string used to identify test users
- `isProductionBlocked()` — opt-in kill switch via `ENVIRONMENT=production` env var only. The admin-role check at the call site (already present in both functions) is the real gate.

```ts
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
```

### 2. `supabase/functions/reset-test-data/index.ts`
- Import the helper.
- Replace the broken `supabaseUrl.includes('supabase.co')` guard with `isProductionBlocked()`.
- Replace the inline email-pattern string at line 84 with `TEST_EMAIL_PATTERNS`.

### 3. `supabase/functions/populate-test-data/index.ts`
- Import `isProductionBlocked`.
- Replace the broken guard at lines 16-17 with `isProductionBlocked()`.
- (No email-pattern usage here — only the gate change.)

## Verification

1. Click **Testdaten löschen** in admin dashboard → function returns 200, deletes test users + cascading data, toast shows counts.
2. Edge logs show `Found N test users` then per-table delete counts.
3. Setting `ENVIRONMENT=production` in Supabase function secrets re-enables the 403 lockout (intentional kill switch).
4. Admin-role check (lines 55-63) still rejects non-admin callers → no privilege regression.

## Out of scope
- Auth-user deletion loop (line 212) keeps its current per-user try/catch; not the failure path here.
- No change to which patterns count as "test data" — same emails as before, now in one place.
