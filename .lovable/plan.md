

# Hide View Switcher for Pure Admin Users

## Problem

The `info@bueeze.ch` admin account has no handwerker or client profile. The view switcher lets them switch to "Kunden-Ansicht" or "Handwerker-Ansicht", which is confusing — they land on dashboards with no data and no meaningful context. The switcher should only be shown to admins who also hold handwerker/client roles (for testing purposes).

## Fix

**`src/components/AdminViewSwitcher.tsx`**: Add a check using `useUserRole()` — only render the switcher if the admin also has `handwerker` or `client` in their `allRoles` array. Pure admins (only admin/super_admin roles) see no switcher.

**`src/components/Header.tsx`**: No changes needed — it already conditionally renders `<AdminViewSwitcher />` only when `isAdmin` is true. The hide logic moves inside the component itself.

### Logic

```typescript
// Inside AdminViewSwitcher
const { allRoles } = useUserRole();
const hasOtherRoles = allRoles.some(r => r === 'handwerker' || r === 'client' || r === 'user');

// If pure admin with no other roles, don't render
if (!hasOtherRoles) return null;
```

This is role-based (not email-based), so it works correctly for any pure admin account while still showing the switcher for admins who also have testing profiles.

## Files Changed

1. **`src/components/AdminViewSwitcher.tsx`** — add early return when admin has no client/handwerker roles

