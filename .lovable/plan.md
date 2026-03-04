
# Fix Handwerker Deactivation, Tab Default, and Deletion

## Issues Found

### 1. Deactivation Error
The `toggleInactive` function (line 441-462) sets `verification_status: 'inactive'`, but the `handwerker_profiles` table has no CHECK constraint blocking this — it's a free text column. The error is likely surfaced generically ("Fehler") without showing the actual error message. The toast at line 458 says `{ title: 'Fehler', variant: 'destructive' }` with no `description`, hiding the root cause. Need to surface the actual error.

After investigation, this may also relate to the `is_verified` being set to `false` while the profile is still `approved` — causing a mismatch for RLS policies that check both `is_verified = true AND verification_status = 'approved'`. When toggling back from inactive to approved, the function correctly sets `is_verified: true`, so the issue is more likely an RLS update policy problem. The admin RLS policy for updates uses `EXISTS(SELECT 1 FROM user_roles WHERE ...)` — this should work. Let me check if the admin's session is valid.

Actually, the most likely cause: the update query succeeds but the subsequent `fetchHandwerkers()` fails or the toast doesn't show success. Need to add proper error description to the catch block.

### 2. Dashboard Card Shows "Ausstehend" First
The `activeTab` state defaults to `'pending'` (line 90). When the admin page loads, the "Ausstehend" tab is selected. Clicking the "Aktiv" stat card correctly switches the tab. However, the user's complaint is likely that on **page load**, the default tab is "Ausstehend" even when clicking from a stat card link. The fix: default `activeTab` to `'all'` or persist the tab from the URL.

### 3. Deletion Fails
The `delete-user` edge function deletes `handwerker_profiles` (line 343-348), and `handwerker_service_areas` has `ON DELETE CASCADE` on `handwerker_profiles(id)`, so that should cascade. However, there's a missing cleanup for `handwerker_service_areas` by `user_id` lookup and the `handwerker_approval_history` might have FK issues. The delete button also uses an `AlertDialog` — the `AlertDialogAction` at line 888 calls `deleteHandwerker(h)`. The error might be that `data?.error` at line 353 catches the edge function's error response format incorrectly.

Looking at the edge function: it uses `successResponse` and `errorResponse` from cors.ts. The frontend checks `if (data?.error)` at line 353 — but `errorResponse` returns the error in the HTTP response body, while `supabase.functions.invoke` puts non-2xx responses in the `error` parameter, not `data`. So the error handling might be misaligned.

## Plan

### A. Fix deactivation error handling
**File: `src/pages/admin/HandwerkerManagement.tsx`**
- Add descriptive error messages in `toggleInactive` catch block
- Surface the actual Supabase error message in the toast

### B. Fix default tab to 'all'
**File: `src/pages/admin/HandwerkerManagement.tsx`**
- Change `useState('pending')` to `useState('all')` for `activeTab` — shows all handwerkers by default, matching the "Gesamt" card

### C. Fix deletion error handling
**File: `src/pages/admin/HandwerkerManagement.tsx`**
- Fix `deleteHandwerker` to properly handle edge function error responses
- The `supabase.functions.invoke` returns `{ data, error }` — when the edge function returns a non-2xx status, `error` contains the error and `data` is null. The current code checks `data?.error` which only catches edge function errors returned as 200 with error in body
- Also add `handwerker_service_areas` deletion to the delete-user edge function (before handwerker_profiles deletion) as a safety measure, even though CASCADE should handle it

### D. Add `handwerker_service_areas` cleanup to delete-user
**File: `supabase/functions/delete-user/index.ts`**
- Add deletion of `handwerker_service_areas` before `handwerker_profiles` deletion (both in guest and full user paths)
- This is a belt-and-suspenders approach since CASCADE exists, but ensures reliability

## Summary

| File | Change |
|------|--------|
| `src/pages/admin/HandwerkerManagement.tsx` | Fix error messages in toggleInactive; change default tab to 'all'; fix deleteHandwerker error handling |
| `supabase/functions/delete-user/index.ts` | Add handwerker_service_areas cleanup before profile deletion |
