

# Fix Lead Filtering & UX in BrowseLeads

## Issues

1. **BrowseLeads (`/search`) shows ALL active leads** — no profile-based matching. The HandwerkerDashboard already has proper `checkCategoryMatch` + `checkServiceAreaMatch` logic, but BrowseLeads ignores the handwerker's categories and service areas entirely.

2. **"Noch nicht angesehen" label is confusing** — on the HandwerkerDashboard proposals tab, the label doesn't clarify *who* hasn't viewed. It should say "Vom Kunden noch nicht angesehen" (not yet viewed by the client) to make it clear.

## Plan

### 1. Add profile-based matching to BrowseLeads

**File: `src/pages/BrowseLeads.tsx`**

- After fetching the user, also fetch their `handwerker_profiles` record (categories, service_areas) — same as HandwerkerDashboard does
- Extract the `checkCategoryMatch` and `checkServiceAreaMatch` helper functions into a shared utility (`src/lib/leadHelpers.ts`) to avoid duplication (DRY/SSOT)
- Apply matching as the default filter: only show leads that match the handwerker's categories AND service areas
- Add toggle buttons ("Alle Kategorien" / "Alle Regionen") like the HandwerkerDashboard has, so handwerkers can optionally browse all leads
- Filter out leads where the handwerker already submitted a proposal

### 2. Extract matching helpers to shared module

**File: `src/lib/leadHelpers.ts`** (already exists — extend it)

- Move `checkCategoryMatch` and `checkServiceAreaMatch` from `HandwerkerDashboard.tsx` into this file
- Update `HandwerkerDashboard.tsx` to import from `leadHelpers.ts`
- Import in `BrowseLeads.tsx` as well

### 3. Fix "Noch nicht angesehen" label

**File: `src/pages/HandwerkerDashboard.tsx`**

- Change `"Noch nicht angesehen"` to `"Vom Kunden noch nicht angesehen"` — one line change

## Summary

| File | Change |
|------|--------|
| `src/lib/leadHelpers.ts` | Add `checkCategoryMatch` and `checkServiceAreaMatch` exports |
| `src/pages/HandwerkerDashboard.tsx` | Import matching helpers from leadHelpers; fix label text |
| `src/pages/BrowseLeads.tsx` | Fetch handwerker profile; apply matching filters; add toggle buttons; exclude already-proposed leads |

