

# Force Fresh Start on Handwerker Onboarding

## Problem
1. Some registrants see a cached/old version of the onboarding form due to localStorage draft recovery
2. The "Weitermachen" / "Fortsetzen" recovery dialog adds confusion — onboarding should always start fresh

## Fix

### File: `src/pages/HandwerkerOnboarding.tsx`

**1. Remove all draft save/load/recovery logic:**
- Delete the auto-save `useEffect` (lines 236-254) that calls `saveVersionedData`
- Delete the load-from-localStorage `useEffect` (lines 256-304) that calls `loadVersionedData` and sets `showRecoveryDialog`
- Delete the entire recovery dialog JSX (lines 1382-1481)
- Remove unused state: `showRecoveryDialog`, `recoveryData`, `lastSaved`
- Remove unused imports: `saveVersionedData`, `loadVersionedData`, `STORAGE_KEYS`, `STORAGE_VERSIONS`, `Clock`

**2. Clear any existing stale drafts on mount:**
- Add a one-time `useEffect` that clears `localStorage.removeItem('handwerker-onboarding-draft')` and `sessionStorage.removeItem('pending-recovery-data')` so returning users with old cached data get a clean slate

**3. Keep `clearVersionedData` import** only if used elsewhere in the file (e.g., on successful submission). If only used in recovery dialog, remove it too.

### Files Changed

| File | Change |
|---|---|
| `src/pages/HandwerkerOnboarding.tsx` | Remove draft save/load/recovery logic, clear stale cache on mount |

