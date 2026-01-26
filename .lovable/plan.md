
# Deep QA Report & Implementation Plan

## Executive Summary

After thorough exploration of the codebase, database, and edge function logs, I've identified several issues that need to be addressed. This plan covers all the areas you specified, including Payrexx integration using the provided API key.

---

## QA Findings Summary

### 1. Core Functions (Anfrage-Flow)

| Feature | Status | Issue |
|---------|--------|-------|
| Up to 5 Handwerker per Lead | Warning | `max_purchases` is currently set to **4** in database, not 5 |
| Contact Privacy Gate | Working | `shouldShowContactInfo = isProposalAccepted OR isOwnLead` enforced in LeadDetails.tsx |
| Proposals Visible/Comparable | Working | ProposalComparisonDialog component exists |
| Lead Status Flow | Working | draft / active / paused / completed statuses implemented |

### 2. Reviews & Trust (Renovero/Ofri Standard)

| Feature | Status | Notes |
|---------|--------|-------|
| 1-5 Star Ratings | Working | RatingForm.tsx with 1-5 scale |
| Text Reviews | Working | Optional comment field |
| Verified Reviews | Working | `is_verified=true` only set when proposal accepted |
| Rating Stats in Profile | Working | `handwerker_rating_stats` view aggregates data |

### 3. Handwerker Profile

| Feature | Status | Notes |
|---------|--------|-------|
| Profile Completeness | Working | ProfileCompletenessCard tracks completion |
| Categories/Regions | Working | categories[] and service_areas[] stored |
| Portfolio Images | Working | portfolio_urls[] in profile |
| Verified Badge | Working | `is_verified` and `verification_status` fields |

### 4. Email Notifications

| Feature | Status | Issue |
|---------|--------|-------|
| Lead Created Email | Working | `send-lead-notification` function active |
| Proposal Received Email | Working | `send-proposal-notification` trigger active |
| Acceptance Emails | **CRITICAL** | **No logs found** - edge function not being triggered |
| Rating Reminder | **CRITICAL** | **No cron job configured** - function exists but never runs |

### 5. Payment System

| Feature | Status | Issue |
|---------|--------|-------|
| Stripe Integration | Working | Keys configured, checkout flow exists |
| Payrexx Integration | **MISSING** | Not implemented despite legal docs mentioning it |
| Payment History | Empty | No records in `payment_history` table (no live payments yet) |
| Admin Payment View | Working | AdminPayments.tsx shows revenue and history |
| Plan Limits | Working | Free=5/month, Paid=unlimited enforced via `can_submit_proposal` RPC |

### 6. Admin Controls

| Feature | Status | Notes |
|---------|--------|-------|
| View All Leads | Working | AdminLeadsManagement.tsx |
| User Management | Working | UserManagement.tsx with delete/suspend |
| Spam Protection | Working | Honeypot, rate limit (3/min), time checks, profanity filter |
| Audit Logs | Working | deletion_audit, handwerker_approval_history tables |

### 7. Technical/Mobile

| Feature | Status | Notes |
|---------|--------|-------|
| Mobile Responsive | Working | useIsMobile hook, 44px touch targets |
| Form Validation | Working | Zod schemas throughout |
| 404 Handling | Working | NotFound.tsx |
| Legal Pages | Working | /impressum, /datenschutz, /legal/agb |

---

## Critical Issues to Fix

### Issue 1: Max Handwerker Limit is 4, Should Be 5
**Current**: `max_purchases = 4` in leads table default
**Fix**: Database migration to change default to 5 and update existing leads

### Issue 2: Acceptance Emails Not Firing via Trigger
**Current**: Database trigger `trigger_send_acceptance_emails` exists in function definition but no trigger attached to `lead_proposals` table
**Evidence**: No edge function logs found for `send-acceptance-emails`
**Fix**: The trigger is invoked directly from `proposalHelpers.ts` via `supabase.functions.invoke()` which should work - need to verify deployment

### Issue 3: Rating Reminder Cron Not Configured
**Current**: Edge function `send-rating-reminder` exists but no scheduled job calls it
**Fix**: Set up pg_cron job to run daily

### Issue 4: Payrexx Integration Missing
**Current**: Only Stripe implemented, Payrexx mentioned in legal docs but not in code
**Fix**: Implement Payrexx payment gateway as an alternative to Stripe

---

## Implementation Plan

### Phase 1: Database Fixes

#### 1.1 Update Max Handwerker Limit to 5
SQL migration to:
- Change default `max_purchases` from 4 to 5
- Update all existing leads with `max_purchases = 4` to `max_purchases = 5`

### Phase 2: Email System Fixes

#### 2.1 Deploy and Test Acceptance Emails
- Verify `send-acceptance-emails` edge function is deployed
- Test the flow manually by calling the function
- Add logging to trace any issues

#### 2.2 Configure Rating Reminder Cron Job
Set up pg_cron to invoke `send-rating-reminder` daily:
```sql
select cron.schedule(
  'send-rating-reminders-daily',
  '0 9 * * *', -- 9 AM daily (Swiss time)
  $$
  select net.http_post(
    url:='https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-rating-reminder',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

### Phase 3: Payrexx Integration

#### 3.1 Store Payrexx API Key as Secret
- Add `PAYREXX_API_KEY` to Supabase secrets
- Add `PAYREXX_INSTANCE` secret (needed for API calls)

Note: The API key you provided (`kiSHpQMxo4dhrFIlvXMgkbEdntqN9K`) is the API Secret. I also need the **instance name** (your Payrexx subdomain, e.g., `bueeze` if your URL is `bueeze.payrexx.com`).

#### 3.2 Create Payrexx Edge Functions

**create-payrexx-gateway/index.ts**
- Creates a Payrexx payment gateway (similar to Stripe checkout session)
- Accepts plan type, success/cancel URLs
- Returns redirect URL to Payrexx hosted payment page

**payrexx-webhook/index.ts**
- Handles Payrexx transaction status callbacks
- Updates `handwerker_subscriptions` on successful payment
- Records payment in `payment_history` table

#### 3.3 Update Payment History Table
Add columns to support both Stripe and Payrexx:
```sql
ALTER TABLE payment_history ADD COLUMN payment_provider TEXT DEFAULT 'stripe';
ALTER TABLE payment_history ADD COLUMN payrexx_transaction_id TEXT;
```

#### 3.4 Update Checkout.tsx
- Add payment method selector (Stripe vs Payrexx)
- Route to appropriate checkout flow based on selection
- Payrexx for Swiss local methods (TWINT, PostFinance)
- Stripe for international cards

### Phase 4: Config.toml Updates

Add new edge functions to config.toml:
```toml
[functions.create-payrexx-gateway]
verify_jwt = true

[functions.payrexx-webhook]
verify_jwt = false
```

---

## Technical Details

### Payrexx API Integration

**Authentication**: 
```
Header: X-API-KEY: kiSHpQMxo4dhrFIlvXMgkbEdntqN9K
```

**Gateway Creation Endpoint**:
```
POST https://{instance}.payrexx.com/api/1.0/Gateway/
```

**Required Parameters**:
- `amount`: Amount in cents (CHF)
- `currency`: CHF
- `successRedirectUrl`: Return URL on success
- `failedRedirectUrl`: Return URL on failure
- `sku`: Plan identifier

**Webhook Processing**:
Payrexx sends transaction status to configured webhook URL. Verify transaction status before updating subscription.

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/create-payrexx-gateway/index.ts` | Create | Payrexx checkout session |
| `supabase/functions/payrexx-webhook/index.ts` | Create | Handle Payrexx callbacks |
| `supabase/config.toml` | Modify | Add new function configs |
| `src/pages/Checkout.tsx` | Modify | Add payment method selection |
| `src/config/payrexx.ts` | Create | Payrexx configuration SSOT |
| Migration | Create | Update max_purchases, payment_history columns |

### Cron Job Configuration

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule rating reminder for 9 AM daily
SELECT cron.schedule(
  'send-rating-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-rating-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

---

## Questions Before Proceeding

1. **Payrexx Instance Name**: What is your Payrexx instance name? (e.g., if your URL is `bueeze.payrexx.com`, the instance is `bueeze`)

2. **Payment Method Priority**: Should Payrexx be the default for Swiss users, with Stripe as fallback? Or should users choose?

3. **Test vs Live Mode**: The API key you provided - is it for test or live environment?

---

## Summary of Changes

1. **Database**: Update `max_purchases` default to 5
2. **Database**: Add Payrexx columns to `payment_history`
3. **Cron**: Schedule daily rating reminder
4. **Edge Functions**: Create 2 new Payrexx functions
5. **Frontend**: Update Checkout.tsx with payment method selection
6. **Secrets**: Add PAYREXX_API_KEY and PAYREXX_INSTANCE
7. **Config**: Update config.toml with new functions

All changes follow existing SSOT patterns and maintain the established design system.
