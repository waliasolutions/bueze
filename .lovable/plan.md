

# Fix: Admin Handwerker Deletion, Inaktiv-Toggle, and Directory Contact Details

## Three issues identified and their root causes:

---

## Issue 1: Delete Handwerker fails with `FunctionsFetchError`

**Root cause**: The shared `supabase/functions/_shared/cors.ts` restricts `Access-Control-Allow-Origin` to `FRONTEND_URL || 'https://bueeze.ch'`. Requests from the Lovable preview domain (`*.lovableproject.com`) are blocked by the browser's CORS policy, causing a `NetworkError when attempting to fetch resource`. The `Access-Control-Allow-Headers` also lacks the `x-supabase-client-*` headers the JS SDK sends.

**Fix**: Update `cors.ts` to use `'*'` for origin and include all required Supabase client headers.

| File | Change |
|------|--------|
| `supabase/functions/_shared/cors.ts` | Change `Access-Control-Allow-Origin` to `'*'` and add `x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version` to allowed headers |

---

## Issue 2: Cannot set active Handwerker to "Inaktiv" (temporär)

**Root cause**: There is no "inactive" status in the current `verification_status` CHECK constraint (`pending`, `approved`, `rejected`, `needs_review`). The admin UI only has approve/reject actions, no deactivation toggle.

**Fix**:
1. Add `'inactive'` to the allowed `verification_status` values via migration (drop and recreate CHECK constraint)
2. Add a toggle button in `HandwerkerManagement.tsx` for approved handwerkers to switch between `approved` ↔ `inactive`
3. Update the status badge display to show "Inaktiv" state
4. Add an "inactive" tab to the management page
5. Recreate `handwerker_profiles_public` view to also exclude `inactive` status (already filtered by `is_verified = true AND verification_status = 'approved'`, so inactive will be auto-excluded)

| File | Change |
|------|--------|
| Migration SQL | Drop/recreate CHECK constraint to add `'inactive'`; no view change needed (already filters `approved` only) |
| `src/pages/admin/HandwerkerManagement.tsx` | Add deactivate/reactivate toggle button for approved/inactive handwerkers; add "Inaktiv" tab and count |

---

## Issue 3: Handwerkerverzeichnis missing contact details

**Root cause**: The `handwerker_profiles_public` view intentionally excludes `email`, `phone_number`, `business_address`, and `personal_address` for privacy. Per user decision, these should now be public for all visitors.

**Fix**:
1. Recreate `handwerker_profiles_public` view to include `email`, `phone_number`, `business_address`, `business_zip`
2. Update `HandwerkerVerzeichnis.tsx` to fetch and display these fields

| File | Change |
|------|--------|
| Migration SQL | `DROP VIEW ... CASCADE; CREATE VIEW ...` adding `email, phone_number, business_address` columns |
| `src/pages/HandwerkerVerzeichnis.tsx` | Update interface and card rendering to show email, phone, address |

---

## Summary

| Change | Files |
|--------|-------|
| Fix CORS for all edge functions | `supabase/functions/_shared/cors.ts` |
| Add `inactive` status + admin toggle | Migration + `HandwerkerManagement.tsx` |
| Add contact details to public directory | Migration (view) + `HandwerkerVerzeichnis.tsx` |

Total: 1 migration, 3 files modified. All changes follow SSOT — CORS is centralized, view is the single source for public profile data, verification_status is the single field controlling visibility.

