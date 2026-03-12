

# Full App Deep QA Report

## Overall Assessment
The application is well-structured with proper SSOT patterns, defensive coding, and comprehensive edge function coverage. I found **2 active bugs**, **2 medium issues**, and **3 low-priority cleanups**.

---

## Active Bugs

### 1. Lead Expiry Cron Job is MISSING
The `lead-expiry-check` Edge Function exists and works correctly, but there is **no cron job scheduled for it**. The DB function `check_lead_expiry()` also exists but is also not scheduled. Currently, 2 active leads have deadlines that passed **weeks ago** (Feb 18 and Feb 20) and are still showing as "active":

- "Einbau Wasserfilter + Wasserhahn" — deadline passed Feb 18
- "Trockenbau/ Wand aus Holz" — deadline passed Feb 20

These stale leads appear to handwerkers in browse/dashboard, wasting their time on expired opportunities.

**Fix**: Add a daily cron job for `lead-expiry-check` (e.g., 00:05 UTC). Also immediately expire the 2 stale leads via migration.

### 2. `handwerker_service_areas` Table is Unused
The `handwerker_service_areas` table (with PLZ range support via `start_plz`/`end_plz`) has **0 rows** and is **never queried** from frontend code. All service area logic uses `handwerker_profiles.service_areas` (a text array of canton codes or PLZ strings). The `send-lead-notification` function also only checks this array.

This means **PLZ range matching doesn't work** — if a handwerker selects "city" radius (single PLZ), they only match leads with that exact PLZ, not nearby ones. A lead in PLZ 8001 won't match a handwerker in PLZ 8002, even though they're both in Zürich city.

**Impact**: Medium. Canton-level matching works fine (most handwerkers use canton or nationwide). City-level matching is overly restrictive but functional for exact PLZ matches.

**Fix**: Not urgent. Either implement PLZ range matching via the `handwerker_service_areas` table, or document that "city" radius means exact PLZ match only. No code change needed now.

---

## Medium Issues

### 3. 2 Expired Magic Tokens Not Cleaned Up
There are 2 expired `magic_tokens` in the database. The `delete_expired_magic_tokens()` DB function exists but has no trigger or cron to run it.

**Fix**: Add to the lead-expiry cron or create a separate cleanup cron.

### 4. Stale Cron Jobs Still Active (Previously Identified)
Jobs 2 (`reset-monthly-proposal-quotas`) and 3 (`cleanup-pending-uploads-daily`) are still active but silently failing. The duplicate `payment_history` index also remains.

**Fix**: Manual SQL (previously documented).

---

## Confirmed Working — All Modules

| Module | Status | Notes |
|--------|--------|-------|
| **Homepage / Index** | Working | SEO schema, FAQ, CMS content, billing context |
| **Auth / Login** | Working | Role-based redirect, password reset, deferred async |
| **SubmitLead (Guest + Auth)** | Working | Multi-step, account creation, spam protection, idempotency |
| **HandwerkerOnboarding** | Working | Multi-step, self-registration, service area selector |
| **Client Dashboard** | Working | Lead list, reviews, rating prompts, view mode |
| **Handwerker Dashboard** | Working | Leads, proposals, reviews, realtime, quota check |
| **BrowseLeads** | Working | Filtering, category/region matching |
| **OpportunityView** | Working | Proposal submission, quota check, attachment upload |
| **ProposalReview** | Working | Accept/reject with race condition protection |
| **ProposalsManagement** | Working | Comparison, batch fetch, rating stats |
| **Messages / Conversations** | Working | 5 conversations, 3 messages in DB |
| **Profile (Client + Handwerker)** | Working | Subscription management, service area map |
| **HandwerkerProfileEdit** | Working | Document management, completeness tracking |
| **Checkout / Payment** | Working | Payrexx gateway, approval gating, pending plan |
| **PaymentSuccess** | Working | Redirect to profile with success param |
| **Invoices** | Working | PDF download, filtering (0 invoices — correct for free-only) |
| **SubscriptionManagement** | Working | Upgrade/downgrade/cancel/undo |
| **Handwerker Verzeichnis** | Working | Public directory, profile modal, ratings |
| **Category Landing Pages** | Working | Dynamic routing, SEO |
| **Admin Dashboard** | Working | Auth gated via AdminAuthProvider |
| **Admin Management Pages** | Working | Users, handwerkers, leads, reviews, payments, invoices |
| **Admin Billing Settings** | Working | MWST-exempt config, centralized billing |
| **Legal Pages** | Working | AGB, Impressum, Datenschutz, Pricing |
| **Password Reset** | Working | Custom token flow, validation |
| **Magic Links** | Working | Token validation, resource routing |
| **Cookie Banner** | Working | GDPR compliance |
| **Error Boundary** | Working | Sentry integration, retry |
| **Edge Functions (email)** | Working | Lead notification, proposal, acceptance, rejection, rating |
| **Edge Functions (payment)** | Working | Gateway, webhook, expiry check, reminders |
| **Edge Functions (admin)** | Working | Delete user, orphan cleanup, sitemap |
| **Cron Jobs** | Partial | 3 active and working (jobs 1, 4, 5), 2 stale (2, 3), 1 missing (lead expiry) |
| **RLS Policies** | Working | Proper role checks, no recursive issues |
| **Data Integrity** | Good | All profiles have roles, all approved handwerkers have subscriptions |

---

## Data Health Summary

| Entity | Count | Status |
|--------|-------|--------|
| Profiles | 44 | All have roles |
| User Roles | 62 (41 user, 19 handwerker, 2 super_admin) | Clean |
| Handwerker Profiles | 19 (18 approved, 1 inactive) | Clean |
| Subscriptions | 19 (all free, active) | All handwerkers covered |
| Leads | 17 (6 active, 5 completed, 2 expired, 4 deleted) | 2 should be expired |
| Proposals | 1 (accepted) | Clean |
| Reviews | 1 | Clean |
| Conversations | 5 | Clean |
| Messages | 3 | Clean |
| Invoices | 0 | Correct (no paid subs yet) |
| Payments | 0 | Correct (no paid subs yet) |

---

## Plan

### 1. Create lead-expiry cron job + expire 2 stale leads
- SQL migration to schedule `lead-expiry-check` daily at 23:05 UTC
- Also expire the 2 active leads with passed deadlines
- Also clean up the 2 expired magic tokens

### 2. No other code changes needed
All modules are functioning correctly. The stale cron jobs (2, 3) and duplicate index are cosmetic and require manual SQL as previously documented.

