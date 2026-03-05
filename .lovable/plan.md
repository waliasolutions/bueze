

# Plan: Make /auth Login-Only, Remove Direct Registration

## Problem
The `/auth` page offers both login and signup. But signup here creates "orphan" users with no lead and no handwerker profile — they land on `/dashboard` with nothing to do. The intended paths are:
- **Clients**: `/auftrag-erstellen` (submit lead) — account created as part of Step 1
- **Handwerker**: `/handwerker-registrierung` — account created as part of Step 1

Direct registration on `/auth` bypasses both flows and caused the B1 bug.

## What to Change

**File**: `src/pages/Auth.tsx`

1. **Remove the signup form entirely** — delete the `isSignUp` state, the signup form JSX, and `handleSignUp`
2. **Replace the "Noch kein Konto?" toggle** with two clear CTAs:
   - "Auftrag erstellen" → links to `/auftrag-erstellen` (client path)
   - "Als Handwerker registrieren" → links to `/handwerker-registrierung` (handwerker path)
3. Keep login form and password reset dialog unchanged

The bottom section becomes:

```tsx
<div className="pt-2 border-t space-y-2">
  <p className="text-sm text-muted-foreground">Noch kein Konto?</p>
  <div className="flex flex-col gap-2">
    <Button variant="outline" onClick={() => navigate('/auftrag-erstellen')} className="w-full">
      Auftrag erstellen (Kunde)
    </Button>
    <Button variant="outline" onClick={() => navigate('/handwerker-registrierung')} className="w-full">
      Als Handwerker registrieren
    </Button>
  </div>
</div>
```

## What This Fixes
- No more orphan registrations without a lead or profile
- Users are guided to the correct flow with built-in account creation
- `/auth` becomes a focused login page — single responsibility
- Eliminates the B1 bug scenario entirely (no authenticated users arriving at SubmitLead via a detour)

## Files Changed
| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Remove signup form, add navigation CTAs to intended registration flows |

