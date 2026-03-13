

# Update AGB Page — Expand to 17 Sections

## Approach

Rewrite `src/pages/legal/AGB.tsx` with the expanded section structure. Maintain SSOT by importing prices from `SUBSCRIPTION_PLANS` and company data from `useBillingContext()`. Use helper functions from `subscriptionPlans.ts` (`formatPrice`) to avoid hardcoded prices.

## New Section Structure

| # | Title | Source |
|---|-------|--------|
| 1 | Geltungsbereich | Existing (keep) |
| 2 | Zweck der Plattform | Existing (keep) |
| 3 | Registrierung und Nutzung | Existing (keep) |
| 4 | Leistungsumfang und Abonnements | Existing (keep, use SUBSCRIPTION_PLANS for prices) |
| **5** | **Zahlungsabwicklung (Payrexx)** | **NEW** — Payrexx as PCI-DSS compliant processor, their AGB apply, no card data stored on büeze.ch |
| **6** | **Zahlungsverzug** | **NEW** — Non-payment → downgrade to Free tier, no grace period mentioned |
| 7 | Vertragsdauer und Kündigung | Existing §6 (renumbered) |
| **8** | **Stornierung und Rückerstattung** | **NEW** — No refunds; exceptions: duplicate payments, platform errors |
| **9** | **Nicht angenommene Anfragen** | **NEW** — 10-day expiry, no guarantee of proposals, re-post allowed |
| **10** | **Pflichten der Plattform** | **NEW** — Obligations to both parties |
| 11 | Bewertungen | Existing §7 (renumbered) |
| 12 | Haftungsausschluss (allgemein) | Existing §8 (renumbered) |
| **13** | **Haftung gegenüber Kunden** | **NEW** — Platform is mediator only, no liability for craftsman work |
| **14** | **Haftung gegenüber Handwerkern** | **NEW** — No guarantee of leads/revenue, liability capped at subscription fees |
| 15 | Datenschutz | Existing §9 (renumbered) |
| 16 | Geistiges Eigentum | Existing §10 (renumbered) |
| **17** | **Anwendbares Recht und Gerichtsstand** | **EXPANDED** — Vaduz courts, German proceedings, 30-day complaint period, mediation recommendation, severability |
| — | Kontakt | Existing (keep) |

## SSOT / DRY Details

- Import `SUBSCRIPTION_PLANS, formatPrice` from `@/config/subscriptionPlans` to render plan prices dynamically (e.g., `formatPrice(SUBSCRIPTION_PLANS.monthly.price)` instead of hardcoded "CHF 90")
- Continue using `useBillingContext()` for company name, address, MWST info
- Single file edit — no new components needed (it's a legal text page, not reusable UI)

## Changes

**File**: `src/pages/legal/AGB.tsx`
- Add import for `SUBSCRIPTION_PLANS, formatPrice`
- Replace hardcoded prices in §4 with SSOT references
- Add MWST note dynamically: `b.mwst_note` instead of hardcoded "exkl. MwSt."
- Insert 5 new sections (§5, §6, §8, §9, §10, §13, §14)
- Expand §17 with Vaduz courts, complaint period, severability
- Renumber all existing sections accordingly

