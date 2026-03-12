

# Rename "Rechnungen" → "Quittungen" + Add Month Filter

## Analysis Results

### SSOT/DRY Status
- **Invoice config** (`src/config/invoiceConfig.ts`) is SSOT for status labels, formatting — used by both `HandwerkerInvoices` and `AdminInvoices`. Good.
- **Plan labels** (`src/config/subscriptionPlans.ts`) SSOT for `getPlanLabel()` and `PLAN_BADGE_VARIANT` — used consistently. Good.
- **Edge function mirror** (`supabase/functions/_shared/invoiceLabels.ts`, `planLabels.ts`) correctly duplicated with comments referencing the frontend SSOT.

### Cancellation & Downgrade Logic
The `check-subscription-expiry` edge function handles all paths correctly:
- **Path A**: `pending_plan = 'free'` + expired → immediate downgrade to free tier (5 proposals limit)
- **Path B**: Non-cancelled, expired < 7 days → grace period, sends renewal email with Payrexx link
- **Path C**: Non-cancelled, expired > 7 days → downgrade to free
- **Path A0**: Paid plan change (`pending_plan` = different paid plan) → switches plan at period end
- All paths reset `proposals_used_this_period`, set correct `proposals_limit` (FREE_TIER_PROPOSALS_LIMIT from SSOT)

This is solid and correctly connected to subscriptions.

## Changes

### 1. Rename terminology: "Rechnungen" → "Quittungen" (7 files)

All user-facing labels change from "Rechnung/Rechnungen" to "Quittung/Quittungen". Admin-facing labels stay as "Rechnungen" since admins manage billing.

**Files to update:**
- `src/pages/HandwerkerInvoices.tsx` — page title, badge, empty state, stats, error messages
- `src/components/PaymentHistoryTable.tsx` — button label "Rechnungen" → "Quittungen"
- `src/pages/Profile.tsx` — tab label "Rechnungen" → "Quittungen"
- `src/config/invoiceConfig.ts` — no change needed (status labels like "Bezahlt" are status-specific, not document-type-specific)

### 2. Add Month Filter to HandwerkerInvoices

Add a month/year selector (Select dropdown) that filters invoices by `issued_at` month. Default: "Alle" (no filter). Options generated from the distinct months present in the invoice data.

- Client-side filtering (invoices are already fully fetched)
- Filter placed between stats cards and the table
- Stats cards update to reflect the filtered subset

### 3. No backend or schema changes needed

The subscription/cancellation/downgrade logic is correctly implemented and SSOT-connected. No fixes required.

