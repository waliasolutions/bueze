

# Admin Subscription Upgrade for Handwerker

## Current State
- The `HandwerkerManagement.tsx` page shows a subscription badge per handwerker (e.g. "Free (2/5)" or "Premium (3/-1)") but provides **no way to change the plan**.
- The SSOT for plans is `src/config/subscriptionPlans.ts` with 4 tiers: `free`, `monthly`, `6_month`, `annual`.
- The `getSubscriptionBadge` function (line 454) only displays — no edit capability.
- Subscriptions are stored in `handwerker_subscriptions` table with `plan_type`, `proposals_limit`, `proposals_used_this_period`, etc.

## Plan

### Add a plan change dropdown to the Abo column in HandwerkerManagement

**Single change in `src/pages/admin/HandwerkerManagement.tsx`:**

1. **Import** `SUBSCRIPTION_PLANS, SUBSCRIPTION_PLAN_LIST, type SubscriptionPlanType, getProposalLimit` from `@/config/subscriptionPlans` (partially imported already — `FREE_TIER_PROPOSALS_LIMIT`).

2. **Replace the static `getSubscriptionBadge`** with an interactive `Select` dropdown that:
   - Shows the current plan name (from SSOT `displayName`) and usage
   - Allows admin to pick any of the 4 tiers
   - On change, calls `updateHandwerkerPlan(userId, newPlanType)` which:
     - Updates `handwerker_subscriptions` with new `plan_type` and `proposals_limit` (from SSOT `getProposalLimit()`)
     - For paid plans, sets `proposals_limit = -1` (unlimited)
     - For free tier, sets `proposals_limit = FREE_TIER_PROPOSALS_LIMIT`
     - Resets `proposals_used_this_period = 0` and sets new period dates
     - Shows success toast with plan name
   - Uses the SSOT plan config for labels, limits — no hardcoded values

3. **Only show the dropdown for approved handwerkers** — pending/rejected handwerkers keep the static badge.

### SSOT/DRY compliance
- All plan names, limits, and pricing come from `subscriptionPlans.ts` — zero hardcoded values
- Reuses existing `Select` component from shadcn/ui
- No new components needed — this is a localized enhancement to the existing table cell

### Files modified
| File | Change |
|------|--------|
| `src/pages/admin/HandwerkerManagement.tsx` | Add plan change dropdown + `updateHandwerkerPlan` function |

