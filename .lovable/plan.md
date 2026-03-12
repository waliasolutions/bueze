

# Deep QA: Routing & URL Issues Found

## Issues Identified

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | **Medium** | `/auth?mode=reset` link is dead — Auth.tsx ignores query params, so the reset dialog never auto-opens | `HandwerkerOnboarding.tsx` line 755 |
| 2 | **Low** | AGB route inconsistency — Impressum and Datenschutz are top-level (`/impressum`, `/datenschutz`) but AGB is nested at `/legal/agb` with no top-level redirect | `App.tsx`, `contentDefaults.ts` |
| 3 | **Info** | Sitemap generator comments reference deprecated `/browse-leads` and `/lead-submission-success` paths (comments only, no functional impact) | `generate-sitemap/index.ts` |

---

## Fix 1: `/auth?mode=reset` — Make it work or fix the link

**Problem**: `HandwerkerOnboarding.tsx` links to `/auth?mode=reset` for "Passwort vergessen?", but `Auth.tsx` never reads `searchParams`. The user lands on the login page with no reset dialog.

**Fix**: Read `mode` from search params in `Auth.tsx` and auto-open the reset dialog when `mode=reset`.

**File**: `src/pages/Auth.tsx`
- Add `useSearchParams` import
- Read `mode` param on mount
- If `mode === 'reset'`, set `isDialogOpen` to `true`

```tsx
const [searchParams] = useSearchParams();

useEffect(() => {
  if (searchParams.get('mode') === 'reset') {
    setIsDialogOpen(true);
  }
}, [searchParams]);
```

---

## Fix 2: AGB route — Add top-level `/agb` with redirect

**Problem**: `/impressum` and `/datenschutz` are top-level routes, but AGB lives at `/legal/agb`. Inconsistent URL structure. No redirect from `/agb` exists.

**Fix**: Add `/agb` as a redirect to `/legal/agb` for consistency, matching the pattern already used for Impressum/Datenschutz redirects.

**File**: `src/App.tsx`
- Add: `<Route path="/agb" element={<Navigate to="/legal/agb" replace />} />`

---

## Fix 3: Stale comments in sitemap generator (optional)

**Problem**: Comments reference `/browse-leads` and `/lead-submission-success` — both deprecated. No functional impact but misleading for future maintenance.

**File**: `supabase/functions/generate-sitemap/index.ts`
- Update comments to reflect current routes (`/search`, `/auftrag-erfolgreich`)

---

## Summary

| # | Fix | Files | Effort |
|---|-----|-------|--------|
| 1 | Auto-open reset dialog via `?mode=reset` | `Auth.tsx` | 2 min |
| 2 | Add `/agb` → `/legal/agb` redirect | `App.tsx` | 1 min |
| 3 | Update stale route comments | `generate-sitemap/index.ts` | 1 min |

No other broken routes found. All `navigate()`, `<Link to=...>`, and `href=...` references point to valid routes defined in `App.tsx`.

