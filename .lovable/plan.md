

# Fix: Auth Page Broken Navigation Links (404s)

## Problem

The Auth page has two "Noch kein Konto?" buttons that link to non-existent routes:

| Button | Current (404) | Correct route |
|--------|--------------|---------------|
| "Auftrag erstellen (Kunde)" | `/auftrag-erstellen` | `/submit-lead` |
| "Als Handwerker registrieren" | `/handwerker-registrierung` | `/handwerker-onboarding` |

## Fix

**File**: `src/pages/Auth.tsx` (lines ~282-287)

Change the two `navigate()` calls:
- `navigate('/auftrag-erstellen')` → `navigate('/submit-lead')`
- `navigate('/handwerker-registrierung')` → `navigate('/handwerker-onboarding')`

One file, two lines. No other changes needed.

