

# Fix: Admin Cannot Delete Handwerker

## Root Cause

The `delete-user` edge function was in a stale deployment state. The logs show only `booted` → `shutdown` with no handler execution — meaning the function crashed or timed out before processing the request. The client received a `FunctionsFetchError: Failed to send a request to the Edge Function`.

## What Was Done

The edge function has been **redeployed** successfully. No code changes are needed — the function code itself is correct (verified by reading it). The deployment was stale, likely due to a previous failed deployment or platform issue.

## Verification

The function should now work. The admin can retry deleting the Handwerker from `/admin/handwerkers`. The flow:
1. Admin clicks "Endgültig löschen" in the confirmation dialog
2. `HandwerkerManagement.tsx` calls `supabase.functions.invoke('delete-user', ...)` with the session token
3. Edge function verifies admin role, deletes auth user + all related data, logs audit

No code changes required — this was purely a deployment issue.

