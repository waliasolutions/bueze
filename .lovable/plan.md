# Fix premature "Erledigt" status & blocked handwerker registration

Two unrelated portal bugs, both rooted in duplicated/stale state. Fix is display-only for Bug 1 and removes a stale-localStorage path for Bug 2. No DB migration, no behavior change to underlying lead lifecycle or auth flow.

---

## Bug 1 — "Erledigt" shown the moment an offer is accepted

**Root cause:** `leads.status='completed'` is set on offer-acceptance (correct — it closes the lead to new offers), but four divergent renderers all label `completed` as "Erledigt". The real "work delivered" signal is the separate `leads.delivered_at` column, which nothing in the badge layer reads.

**Approach:** collapse the four divergent sources into one config + one helper + one component, and derive the label from `(status, accepted_proposal_id, delivered_at)`.

### Files & changes

**1. `src/config/leadStatuses.ts` — single source of truth**
- Add `variant: 'default' | 'secondary' | 'destructive' | 'outline'` to `LeadStatusConfig`; set it for every entry in `LEAD_STATUSES`.
- Add `export const LEAD_STATUS_IN_PROGRESS = { label: 'In Bearbeitung', variant: 'default', color: 'bg-indigo-100 text-indigo-800' }`.
- Add `getLeadDisplayStatus(input: { status: string; accepted_proposal_id?: string | null; delivered_at?: string | null })`:
  - `completed` + `delivered_at` truthy → `LEAD_STATUSES.completed` ("Erledigt").
  - `completed` + `accepted_proposal_id` truthy + no `delivered_at` → `LEAD_STATUS_IN_PROGRESS` ("In Bearbeitung").
  - `completed` + no `accepted_proposal_id` (manual completion) → `LEAD_STATUSES.completed`.
  - otherwise → `LEAD_STATUSES[status]`, or a neutral `{ label: status, variant: 'outline', color: 'bg-gray-100 text-gray-800' }` for unknowns (never "Entwurf").
- Use truthy checks so `null`/`undefined` both work.

**2. `src/types/entities.ts` — add `delivered_at`**
- `interface Lead`: add `delivered_at?: string | null;` (after line 45).
- `interface LeadListItem`: add `delivered_at?: string | null;` (after line 401).
- Both `Dashboard` and `LeadDetails` use `select('*')`, so the column is already fetched at runtime.
- During implementation: grep `.rpc(` and `.from('leads'` reads that feed a badge; if any view/RPC omits `delivered_at`/`accepted_proposal_id`, add them.

**3. `src/components/ui/status-badge.tsx` — single renderer**
- Delete the private `leadStatusConfig` map.
- Rewrite `LeadStatusBadge` props: `{ status: string; acceptedProposalId?: string | null; deliveredAt?: string | null; showIcon?: boolean }`; derive display via `getLeadDisplayStatus()`. Keep icon lookup keyed off the rendered status, or drop icons.
- Leave `VerificationStatusBadge`, `SubscriptionStatusBadge`, `UrgencyBadge`, `GenericStatusBadge` untouched.

**4. Route all renderers through `<LeadStatusBadge>`**
- `src/pages/Dashboard.tsx` (~516-524): replace hand-rolled ternary `Badge` with `<LeadStatusBadge status={lead.status} acceptedProposalId={lead.accepted_proposal_id} deliveredAt={lead.delivered_at} />`. Leave `canDelete` (~508) and Archivieren-button (~561) logic checks alone.
- `src/pages/LeadDetails.tsx`: replace both badge spots (~262-267 header, ~511-514 side). Remove now-unused local `getStatusVariant()` (~196-203) and unused `getLeadStatus`/`leadStatus` references.
- `src/pages/admin/AdminLeadsManagement.tsx` (~526-527): replace inline `LEAD_STATUSES[...]?.color/.label` Badge with `<LeadStatusBadge status={lead.status} acceptedProposalId={lead.accepted_proposal_id ?? null} deliveredAt={lead.delivered_at ?? null} />`.

**Out of scope (intentionally unchanged):** `acceptProposal()` success message, `getStatusSuccessMessage('completed')`, all `canPurchaseLead`/`handleMarkDelivered`/`RatingPrompt` logic gates.

---

## Bug 2 — Registration blocked / "Registrierung bereits begonnen"

All edits in `src/pages/HandwerkerOnboarding.tsx`.

### Fix A — Remove stale-localStorage path (root cause)
`pendingHandwerkerEmail` is written on signUp (~441), removed only on full completion (~555), and read by `checkAuth` (~186-191) to auto-open a login card pre-filled with that email. Any abandoned registration leaves it forever → next visitor on the same browser sees a stranger's email and appears blocked. The legitimate same-user resume is already covered by the live Supabase session check in `handleCreateAccountAndProceed` (~358-379), so this localStorage key is fully redundant.
- Delete the read+auto-show block (~186-191), the write (~441), and the remove (~555).
- In `checkAuth`'s no-session branch keep only `setStartedAsGuest(true)`.

### Fix B — DRY, correct "account already exists" copy
Currently duplicated as two divergent literals (toast ~397-401 and inline card ~634-638). Since `signUp`'s "already registered" can't tell a half-finished handwerker from a plain customer, copy must work for both.
- Define module-level constants once:
  - Title: `"Konto bereits vorhanden"`
  - Description: `"Mit dieser E-Mail existiert bereits ein Konto. Melden Sie sich an, um Ihr Handwerker-Profil zu erstellen. Falls Sie Ihr Passwort nicht kennen, nutzen Sie «Passwort vergessen?»."`
- Reference from both spots. No logic change — `handleLogin` already detects existing `handwerker_profiles` and either routes to dashboard or proceeds to step 2.

### Fix C — Unconfirmed-email dead-end
A user who signed up but never confirmed can neither re-`signUp` ("already registered") nor `signInWithPassword` ("Email not confirmed"). `handleLogin`'s catch (~328-333) shows only a generic error.
- Add an `isEmailNotConfirmed(err)` check (message includes "Email not confirmed" OR `AuthError.code === 'email_not_confirmed'`).
- On match, call `supabase.auth.resend({ type: 'signup', email: loginEmail.toLowerCase().trim(), options: { emailRedirectTo: HANDWERKER_REDIRECT_URL } })` in its own try/catch.
- Success toast: title `"E-Mail-Bestätigung erforderlich"`, description `"Wir haben Ihnen eine neue Bestätigungs-E-Mail gesendet. Bitte prüfen Sie Ihr Postfach (auch den Spam-Ordner)."`
- 429 rate-limit: distinct calm toast `"Bitte warten Sie einen Moment, bevor Sie es erneut versuchen."`
- Other errors fall through to the existing generic toast.
- Normalize email identically to the original signUp (`.toLowerCase().trim()`).

### DRY cleanup
- Extract `const HANDWERKER_REDIRECT_URL = \`${window.location.origin}/handwerker-dashboard\`;` (used by signUp ~391 and the new resend).
- Reuse the "E-Mail-Bestätigung erforderlich" copy constant wherever it already appears (2× in `handleCreateAccountAndProceed`).

### Already correct — no change
Live-session resume in `handleCreateAccountAndProceed` (~358-379) and `handleLogin`'s profile-check + step-2 proceed.

---

## Verification

**Static:** `tsc --noEmit`, lint, build (build runs automatically).

**Bug 1 (manual via preview):**
1. New lead → "Aktiv".
2. Accept offer → "In Bearbeitung" in Dashboard **and** LeadDetails (not "Erledigt").
3. Handwerker marks delivered → "Erledigt".
4. Manually complete a lead with no accepted proposal → "Erledigt".
5. `expired`/`closed` leads → "Abgelaufen"/"Geschlossen" (not "Entwurf"), incl. admin leads list.

**Bug 2:**
- Inject bogus `pendingHandwerkerEmail` in DevTools, reload `/handwerker-onboarding` logged out → clean step-1, no stranger email, not blocked.
- Sign up step 1, clear session, revisit with same email → login card; login resumes at step 2.
- Register plain customer, then open handwerker onboarding with that email → "Konto bereits vorhanden"; login proceeds to step 2.
- Account exists but email unconfirmed → "E-Mail-Bestätigung erforderlich" toast + new confirmation email sent (429 → calm wait toast).

## Anti-recurrence
- One config (`LEAD_STATUSES` + in-progress constant), one helper (`getLeadDisplayStatus`), one component (`LeadStatusBadge`). Divergent `leadStatusConfig` deleted — no second source can drift.
- Unknown statuses handled explicitly — no silent "Entwurf" fallback.
- Stale-localStorage failure mode removed, not patched.
- Repeated copy + redirect URL collapsed to single constants.
