

# Fix: Payment History Showing in Admin View on Profile Page

## Root Cause

In `src/pages/Profile.tsx` (line 381-383), the view-aware logic has a bug:

```typescript
const isHandwerker = isAdmin
  ? activeView === 'handwerker' ? !!handwerkerProfile : activeView === 'admin' ? !!handwerkerProfile : false
  : !!handwerkerProfile;
```

When the admin is in **"admin" view**, `isHandwerker` resolves to `!!handwerkerProfile`. Since the admin user has a handwerker profile record in the database, all handwerker-specific tabs (Handwerker-Profil, Abonnement, Rechnungen) incorrectly appear.

**Expected behavior**: These tabs should only appear when the admin switches to "Handwerker-Ansicht".

## Fix

**File: `src/pages/Profile.tsx`** (line 381-383)

Change the logic so admin view never shows handwerker tabs:

```typescript
const isHandwerker = isAdmin
  ? activeView === 'handwerker' && !!handwerkerProfile
  : !!handwerkerProfile;
```

This means:
- **Admin in "admin" view**: No handwerker tabs (correct -- admin context)
- **Admin in "client" view**: No handwerker tabs (correct -- client context)
- **Admin in "handwerker" view**: Handwerker tabs shown if profile data exists (correct -- testing handwerker experience)
- **Non-admin handwerker**: Handwerker tabs shown based on database (unchanged)
- **Non-admin client**: No handwerker tabs (unchanged)

## Scope

| Item | Details |
|------|---------|
| File | `src/pages/Profile.tsx` |
| Lines changed | 1 (line 381-383 simplified) |
| Risk | None -- purely a conditional fix |
| Other files | No changes needed |

