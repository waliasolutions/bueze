

# Final Audit Remediation Plan v4

Two corrections from feedback incorporated:

1. **Orphaned Lead Recovery SQL**: Removed unnecessary `GROUP BY` — `leads.id` is unique and no aggregate is used.
2. **Recovery timing**: Explicitly sequenced recovery BEFORE Phase 1B (trigger secret). If done after 1B, the manual `invoke` call must include the `x-trigger-secret` header.

---

## Already Fixed (not in scope)

- Stale category mapping → `_shared/majorCategoryMapping.ts` created
- `fetchWithTimeout` → `Promise.race`
- Client-side 404s → proper expired/not-found UI
- Duplicate `boiler` → removed from `sanitaer`
- Website URL protocol → `HandwerkerProfileModal.tsx` fixed

---

## Phase 1A — Quick Security Wins

### C1: `.env` not in `.gitignore`
Add `.env` and `.env.*` to `.gitignore`.

**File**: `.gitignore`

### C4: RLS Audit — COMPLETED
All admin-touched tables verified: `reviews`, `leads`, `handwerker_profiles`, `admin_notifications`, `handwerker_subscriptions`, `handwerker_documents` — all gated by `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')`. No gaps found.

### C5: TestDashboard
Not routed in `App.tsx`. Add `// DEV-ONLY` comment header.

**File**: `src/pages/TestDashboard.tsx` (comment only)

---

## Orphaned Lead Recovery (BEFORE Phase 1B)

Must run before trigger secret is deployed, otherwise manual `invoke` calls get blocked.

**SQL** (Supabase SQL Editor):
```sql
SELECT l.id, l.category, l.city, l.canton, l.created_at, l.proposal_deadline
FROM leads l
LEFT JOIN lead_proposals lp ON lp.lead_id = l.id
WHERE l.status = 'active'
  AND l.proposal_deadline > now()
  AND l.category IN (
    'heizung_klima', 'kueche', 'innenausbau_schreiner',
    'garten_umgebung', 'reinigung_hauswartung', 'raeumung_entsorgung',
    'waermepumpen', 'fussbodenheizung', 'boiler', 'klimaanlage_lueftung',
    'cheminee_kamin_ofen', 'photovoltaik', 'solarheizung', 'heizung_sonstige',
    'kuechenbau', 'kuechenplanung', 'kuechengeraete', 'arbeitsplatten', 'kueche_sonstige',
    'schreiner', 'moebelbau', 'fenster_tueren', 'treppen', 'holzarbeiten_innen',
    'metallarbeiten_innen', 'innenausbau_sonstige',
    'gartenbau', 'pflasterarbeiten', 'zaun_torbau', 'aussenarbeiten_sonstige',
    'reinigung', 'aufloesung_entsorgung', 'umzug'
  )
  AND lp.id IS NULL
ORDER BY l.created_at DESC;
```

For each result, invoke via JS console or Supabase client:
```javascript
await supabase.functions.invoke('send-lead-notification', {
  body: { leadId: '<lead-id>' }
});
```

---

## Phase 1B — Edge Function Trigger Secret (separate deployment)

### C3: Functions callable without auth

1. Create Supabase secret `EDGE_TRIGGER_SECRET` (random value)
2. Create `supabase/functions/_shared/triggerAuth.ts`:
   ```typescript
   export function validateTriggerSecret(req: Request): void {
     const secret = req.headers.get('x-trigger-secret');
     const expected = Deno.env.get('EDGE_TRIGGER_SECRET');
     if (!secret || secret !== expected) {
       throw new Error('Unauthorized: invalid trigger secret');
     }
   }
   ```
3. Add `validateTriggerSecret(req)` to 7 edge functions (after CORS check):
   - `send-lead-notification`
   - `send-message-notification`
   - `send-proposal-notification`
   - `send-acceptance-emails`
   - `send-rating-notification`
   - `send-rating-response-notification`
   - `send-admin-registration-notification`
4. SQL migration: update 6 trigger functions to read secret from Supabase Vault (`vault.decrypted_secrets`) and pass as `x-trigger-secret` header

**Rollback**: Revert trigger functions to current version (no secret check) via SQL Editor.

**Files**: new `_shared/triggerAuth.ts`, 7 edge functions, 1 SQL migration

---

## Phase 2 — Architecture (Large)

### C6: HandwerkerDashboard.tsx (1826 lines)
Extract into sub-components:
- `HandwerkerLeadBrowser.tsx` — lead browsing + filtering
- `HandwerkerProposalsList.tsx` — proposals tab
- `HandwerkerReviewsList.tsx` — reviews tab
- `HandwerkerOverviewTab.tsx` — stats/profile overview

Main file becomes tab shell < 200 lines.

### I1: `select('*')` → specific fields
Top 10 most-used queries across HandwerkerDashboard, Dashboard, BrowseLeads, LeadDetails, Messages.

### I5: React Query migration
Migrate `Dashboard.tsx` and `BrowseLeads.tsx` from `useState`+`useEffect` to `useQuery`. HandwerkerDashboard migrated as part of C6.

---

## Phase 3 — Quality & Testing (Medium)

### C2: No tests
Set up Vitest + React Testing Library. Tests for `categoryLabels`, `fetchHelpers`, `proposalHelpers`, `ProtectedRoute`.

### I3: Category label drift validation
Vitest test comparing frontend and edge function label files. CI setup (GitHub Actions) included so it runs on PRs.

### I6: Status badge dedup
Replace inline `getStatusBadge` in 4 files with imports from `status-badge.tsx`.

---

## Phase 4 — UX Polish (Medium)

### I2: Admin pagination
`usePagination` hook + 5 admin pages.

### I4: Unsaved changes warning
`useUnsavedChanges` hook with `beforeunload` + `useBlocker`. Apply to `HandwerkerProfileEdit`, `EditLead`, `ContentEditor`.

### I7: Console cleanup
Remove unguarded `console.log` from ~6 source files for audit optics (production builds already strip via `esbuild.drop`).

---

## Summary

| Phase | Issues | Effort | Risk |
|-------|--------|--------|------|
| **1A — Quick Wins** | C1, C4 (done), C5 | Small | Low |
| **Ops — Recovery** | Orphaned leads re-trigger | Small | Low |
| **1B — Trigger Secret** | C3 (7 edge fns + 6 triggers) | Medium | High |
| **2 — Architecture** | C6, I1, I5 | Large | Medium |
| **3 — Quality** | C2, I3, I6 + CI | Medium | Low |
| **4 — UX** | I2, I4, I7 | Medium | Low |

