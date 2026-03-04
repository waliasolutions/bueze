

# Updated Plan: 4 Issues + Shared Error Utility

## Change: Extract Error Handling to Shared Utility (DRY/SSOT)

Per feedback, the robust error check should be a reusable utility, not inline. There are 25+ edge functions with inconsistent error handling (`error.message`, `error instanceof Error`, `error as any`, etc.).

**New file**: `supabase/functions/_shared/errorUtils.ts`
```typescript
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  return 'Ein unerwarteter Fehler ist aufgetreten';
}
```

**Usage in Issue 4a**: `validate-password-reset-token/index.ts` imports and uses `getErrorMessage(error)` instead of inline check.

This utility can then be adopted incrementally across other edge functions (not in this PR scope, but foundation is set).

---

## Issue 1: Double Admin Notification Emails
**File**: `src/pages/HandwerkerOnboarding.tsx` — remove the explicit `supabase.functions.invoke('send-admin-registration-notification')` call (~4 lines). DB trigger is SSOT.

## Issue 2: Payrexx Gateway Auth Failure
**File**: `supabase/functions/create-payrexx-gateway/index.ts` — replace non-existent `getClaims(token)` + duplicate `getUser()` with single consolidated `getUser()` call. Null guards on `userData.user` and `userEmail`.

## Issue 3: Reviews Not Displaying
**File**: `src/pages/Dashboard.tsx` — change `.in('id', reviewedIds)` → `.in('user_id', reviewedIds)` and profileMap key `p.id` → `p.user_id`.

## Issue 4a: Error Type Safety
**File**: `supabase/functions/validate-password-reset-token/index.ts` — import `getErrorMessage` from shared utility, replace `error.message` with `getErrorMessage(error)`.

## Issue 4b: Missing Type
**File**: `src/types/entities.ts` — add `delivered_at?: string | null;` to `ProposalListItem.leads`.

## Summary

| File | Change |
|------|--------|
| `supabase/functions/_shared/errorUtils.ts` | **New** — shared `getErrorMessage()` utility |
| `src/pages/HandwerkerOnboarding.tsx` | Remove redundant admin notification call |
| `supabase/functions/create-payrexx-gateway/index.ts` | Replace `getClaims` with `getUser`, null-safe |
| `src/pages/Dashboard.tsx` | Fix `.in('id')` → `.in('user_id')`, fix map key |
| `supabase/functions/validate-password-reset-token/index.ts` | Use shared `getErrorMessage()` |
| `src/types/entities.ts` | Add `delivered_at` to `ProposalListItem.leads` |

No database migrations needed. Edge functions `create-payrexx-gateway` and `validate-password-reset-token` will be redeployed.

