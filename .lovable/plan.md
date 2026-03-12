

# Restrict "Wartung" Section to Super Admin Only

## What changes

The "Wartung" nav section (containing "Verwaiste Daten") in the admin sidebar will only be visible to the `super_admin` role. Additionally, the `/admin/orphaned-records` route itself will be protected so only super admins can access it.

## Implementation

### 1. `src/components/admin/AdminSidebar.tsx`
- Import `useAdminAuth` from `AdminAuthContext`
- Move the "Wartung" section out of the static `navSections` array
- Conditionally add it only when `role === 'super_admin'` (the context already provides the role)

### 2. `src/pages/admin/OrphanedRecordsCleanup.tsx`
- Add a super_admin check at the top of the component using `useAdminAuth()` — if role is not `super_admin`, redirect to `/admin` or show an unauthorized message
- This prevents direct URL access by regular admins

No database or edge function changes needed — the role is already stored in `user_roles` and the context already distinguishes between `admin` and `super_admin`.

