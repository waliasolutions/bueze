

# Fix: Handwerker Profile Save Failure + Edge Function Build Errors

## Root Cause Analysis

**Two issues compound to create the failure:**

1. **Error swallowing in `handleSubmit`** (line 640-645 of `HandwerkerOnboarding.tsx`): The catch block checks `error instanceof Error`, but Supabase PostgrestError is NOT an instance of `Error` — it's a plain object with `message`, `code`, `details`. So the actual database error is hidden behind the generic "Profil konnte nicht gespeichert werden." toast.

2. **`validate_handwerker_data` trigger** (database): Rejects names containing "test", "dummy", "example" etc. The screenshot shows name "Test Amit Walia Test H" and company "test Handwerker" — both would be rejected. This is intentional production protection, but the error message from the trigger is swallowed by issue #1.

**With proper error handling, the user would see:** "Invalid first name detected" — the actual trigger message.

## Implementation Plan

### Fix 1: Proper error handling in handleSubmit
**File:** `src/pages/HandwerkerOnboarding.tsx` (lines 640-645)

Change the catch block to extract PostgrestError messages:
```typescript
} catch (error: any) {
  const message = error?.message || "Profil konnte nicht gespeichert werden.";
  toast({
    title: "Fehler",
    description: message,
    variant: "destructive",
  });
}
```

### Fix 2: dateFormatter.ts — remove invalid `timeZone` option
**File:** `supabase/functions/_shared/dateFormatter.ts` (lines 15, 24)

`date-fns` `format()` does not accept a `timeZone` option. After `toZonedTime()` the date is already adjusted — remove the options object.

### Fix 3: Edge function `error` typing (~15 files)
All catch blocks with `error.message` where `error` is `unknown`. Fix pattern: `(error as Error).message` or use the existing `errorResponse` helper with proper casting.

**Affected files:**
- `check-admin-role/index.ts`
- `generate-sitemap/index.ts`
- `populate-test-data/index.ts` (multiple)
- `send-password-reset/index.ts`
- `submit-to-indexing/index.ts` (multiple)
- `validate-magic-token/index.ts`
- All files using `return errorResponse(error)` — cast to `errorResponse(error as Error)`

### Fix 4: `getUserByEmail` → `listUsers` with filter
**File:** `supabase/functions/guest-user-auto-create/index.ts` (line 42)

`getUserByEmail` doesn't exist on GoTrueAdminApi. Replace with `listUsers({ filter })` or check by querying profiles table instead.

### Fix 5: Supabase join type mismatches (~4 files)
Foreign key joins return arrays, not single objects. Need `[0]` access:
- `send-delivery-emails/index.ts` line 43: `lead.lead_proposals` is array
- `send-rating-notification/index.ts` line 62: `review.leads` is array
- `send-rating-response-notification/index.ts` line 64: `review.leads` is array
- `send-rating-reminder/index.ts` lines 82, 95, 123: `lead_proposals` is array

### Fix 6: cleanup-orphaned-records dynamic property access
**File:** `supabase/functions/cleanup-orphaned-records/index.ts` (line 116)

Cast records to `Record<string, any>[]` for dynamic column access.

## Execution Order
1. Fix 1 (user-facing — unblocks profile creation feedback)
2. Fixes 2-6 (edge function build errors — batch fix)

