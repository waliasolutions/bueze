

# Updated Plan: Deep QA — Lead Submission & 404 Fixes

Feedback incorporated: AbortSignal pattern for fetchWithTimeout, Deno-only shared file constraint, orphan recovery safeguards.

---

## Issue 1 (CRITICAL): Stale category mapping in `send-lead-notification`

The edge function's `majorCategorySubcategories` (lines 12-52) is completely out of sync with the frontend SSOT (`src/config/majorCategories.ts`).

**Missing categories** (leads here produce ZERO notifications):
- `heizung_klima` with subcategories: `waermepumpen`, `fussbodenheizung`, `boiler`, `klimaanlage_lueftung`, `cheminee_kamin_ofen`, `photovoltaik`, `solarheizung`, `heizung_sonstige`
- `kueche`: `kuechenbau`, `kuechenplanung`, `kuechengeraete`, `arbeitsplatten`, `kueche_sonstige`
- `innenausbau_schreiner`: `schreiner`, `moebelbau`, `fenster_tueren`, `treppen`, `holzarbeiten_innen`, `metallarbeiten_innen`, `innenausbau_sonstige`
- `garten_umgebung`: `gartenbau`, `pflasterarbeiten`, `zaun_torbau`, `aussenarbeiten_sonstige`
- `reinigung_hauswartung`: `reinigung`, `reinigung_hauswartung`
- `raeumung_entsorgung`: `aufloesung_entsorgung`, `umzug`, `reinigung`, `reinigung_hauswartung`

**Stale entries** still present: `sanitaer_heizung`, `maler_gipser`, `schreiner_holzbau`, `dach_fassade`, `garten_aussen`, `umzug_reinigung`, `badumbau`

**Fix**: Create `supabase/functions/_shared/majorCategoryMapping.ts` — a pure data file (no React, no Node imports) that mirrors the subcategory arrays from `majorCategories.ts`. Import it in `send-lead-notification/index.ts`, replacing the hardcoded mapping.

The shared file will contain only a `Record<string, string[]>` export and pure helper functions — fully Deno-compatible.

**Files**: new `supabase/functions/_shared/majorCategoryMapping.ts`, `supabase/functions/send-lead-notification/index.ts`

---

## Issue 2 (HIGH): `fetchWithTimeout` doesn't actually timeout

The current `fetchWithTimeout` creates an `AbortController` but never passes the signal to `fetchFn`. The `controller.abort()` fires into the void.

**The nuance**: `fetchWithRetry` and `supabaseQuery` wrap Supabase client calls (`supabase.from(...)`), not raw `fetch()`. The Supabase JS client doesn't accept an `AbortSignal` on its query builder. So the AbortSignal approach can't be used directly here.

**Fix**: Use `Promise.race` for the timeout (since we can't pass signal to Supabase client), but restructure `fetchWithTimeout` to properly clean up:

```typescript
async function fetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  timeout: number
): Promise<T> {
  return Promise.race([
    fetchFn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
    ),
  ]);
}
```

This is a known trade-off: the underlying Supabase request may continue, but the caller unblocks and can retry. Document this limitation with a comment. If we later add raw `fetch()` calls, those callers should use the AbortSignal pattern directly at the call site.

**File**: `src/lib/fetchHelpers.ts`

---

## Issue 3 (HIGH): Client-side 404s from RLS

**Server routing is fine** — `vercel.json` has the SPA rewrite.

**The real 404s are client-side**:

1. **`LeadDetails.tsx`** (line 103-107): Uses `.single()` which throws if RLS blocks access. The catch block (line 121-123) silently swallows the error. The `!lead` UI (line 221-234) shows "Auftrag nicht gefunden" with a link to `/search` — but gives no explanation of *why* (RLS block vs deleted vs expired).

2. **`OpportunityView.tsx`** (line 54-59): Filters `.eq('status', 'active')`. If a handwerker clicks a magic link for an expired lead, they get the "Anfrage nicht gefunden" page (line 215-236) — which already has decent UX ("nicht mehr aktiv"). However, the `.eq('status', 'active')` filter is redundant since RLS already controls access, and it prevents showing a proper "expired" message vs "not found."

**Fix**:
- `OpportunityView.tsx`: Remove `.eq('status', 'active')` from the query. After fetching, check `lead.status` and show a specific "Frist abgelaufen" message if expired, vs "Nicht gefunden" if null.
- `LeadDetails.tsx`: Add guidance text to the not-found state: "Dieser Auftrag existiert nicht mehr oder Sie haben keinen Zugriff darauf."

**Files**: `src/pages/OpportunityView.tsx`, `src/pages/LeadDetails.tsx`

---

## Issue 4 (MEDIUM): Orphaned lead recovery

After fixing Issue 1, existing orphaned leads need re-processing.

**Safeguard**: Only re-trigger for leads that are:
- `status = 'active'`
- `proposal_deadline > now()` (not expired)
- Have zero entries in `lead_proposals` (no handwerkers responded)
- Were created with categories that match the stale mapping (the 6 missing categories)

This prevents re-triggering for leads that already processed correctly or are no longer relevant.

**Approach**: SQL query to identify affected leads, then manually invoke `send-lead-notification` for each via `supabase.functions.invoke()`. This is a one-time operation.

---

## Issue 5 (LOW): `boiler` duplicated across major categories

`boiler` appears in both `sanitaer.subcategories` and `heizung_klima.subcategories` in `majorCategories.ts`. It belongs under `heizung_klima` per `subcategoryLabels.ts`.

**Fix**: Remove `boiler` from `sanitaer.subcategories`.

**File**: `src/config/majorCategories.ts`

---

## Summary

| # | Issue | Severity | Files |
|---|-------|----------|-------|
| 1 | Stale category mapping → SSOT shared file | CRITICAL | new `_shared/majorCategoryMapping.ts`, `send-lead-notification/index.ts` |
| 2 | `fetchWithTimeout` → `Promise.race` | HIGH | `src/lib/fetchHelpers.ts` |
| 3 | Client-side 404s → proper error UI | HIGH | `OpportunityView.tsx`, `LeadDetails.tsx` |
| 4 | Orphaned lead recovery | MEDIUM | SQL query (one-time) |
| 5 | Remove duplicate `boiler` | LOW | `src/config/majorCategories.ts` |

**Total**: 5 files changed + 1 new shared file + 1 recovery query.

