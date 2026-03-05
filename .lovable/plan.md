

# Fix: Dashboard Profile Tab — Summary + Redirect, Remove Duplicate Editing

## Problem

The dashboard profile tab has disabled fields with a misleading "contact us to change" message, even though the full edit page (`/handwerker-profile/edit`) allows all changes — including logo upload. This confuses pending handwerkers into thinking their data is locked.

## Verification: Logo Upload

`HandwerkerProfileEdit.tsx` has a complete logo upload implementation (lines 508-550, UI at lines 1396-1450) with the same Supabase storage logic. Removing `handleLogoUpload` from the dashboard is safe — no functionality is lost.

## Fix

### `src/pages/HandwerkerDashboard.tsx`

**Replace profile tab content** (lines ~1809-1955) with:
- Read-only summary card showing: logo (display only), name, company, email, phone
- Single CTA button: "Profil bearbeiten" → `/handwerker-profile/edit`
- Remove the misleading "Kontaktieren Sie uns" alert

**Remove dead code:**
- `profileEditing` state
- `logoUploading` state
- `profileData` state
- `handleLogoUpload` function
- `handleUpdateProfile` function
- Any imports only used by these (check Upload, Pencil usage elsewhere before removing)

## Files Changed

1. **`src/pages/HandwerkerDashboard.tsx`** — simplify profile tab to summary + link, remove duplicate editing code

