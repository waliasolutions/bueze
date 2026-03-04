

# Fix: Allow Pending Handwerkers to Edit Their Profile

## Root Cause

When a user registers as a handwerker, their role in `user_roles` remains `user` until an admin approves them and upgrades the role to `handwerker`. The `useUserRole` hook returns `isHandwerker: false` for pending users, which means:

1. **`UserDropdown`** shows client navigation (no "Profil bearbeiten" or "Dashboard" links for handwerker)
2. **`Profile.tsx`** page's `isHandwerker` check (line 443) uses `!!handwerkerProfile` from a DB query — this actually works, but the user may not know to go to `/profile` or `/handwerker-profile/edit`

The pages themselves (`HandwerkerDashboard`, `HandwerkerProfileEdit`) correctly handle pending users. The problem is **navigation/discoverability** — pending handwerkers see client menu items and can't find the handwerker pages.

## Fix Plan

### 1. Add handwerker profile awareness to `UserDropdown` (src/components/UserDropdown.tsx)

After fetching the user profile, also check if a `handwerker_profiles` record exists (regardless of `user_roles`). If it does, treat the user as a handwerker for navigation purposes.

- Query `handwerker_profiles` for the current user (same pattern as `Profile.tsx` line 183-187)
- If a profile exists with `verification_status` in `['pending', 'approved']`, show handwerker navigation items in the dropdown
- This ensures pending handwerkers see "Dashboard", "Profil bearbeiten" etc.

### 2. Update `useUserRole` to expose pending handwerker state (src/hooks/useUserRole.ts)

Add a `hasPendingHandwerkerProfile` flag to the hook's return value. This queries `handwerker_profiles` to check if the user has a profile with `verification_status = 'pending'`. This avoids duplicating the check in multiple components.

**Alternative (simpler):** Instead of modifying the shared hook, just add the handwerker profile check directly in `UserDropdown.tsx` since that's the only place the navigation issue manifests. This keeps the change minimal and follows SSOT (the `handwerker_profiles` table is the source of truth for whether someone is a handwerker, not just `user_roles`).

### Recommended: Option 2 (simpler)

Only modify `UserDropdown.tsx`:
- After fetching the profile, also fetch `handwerker_profiles` for the user
- If a handwerker profile exists (any status except null), use handwerker navigation
- This is ~10 lines of additional code in the existing `fetchProfile` function

### Files Changed

1. **`src/components/UserDropdown.tsx`** — Add handwerker profile check to determine navigation items for pending handwerkers

No database changes needed. RLS policies already allow pending handwerkers to read their own profile.

