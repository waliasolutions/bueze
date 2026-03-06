

# Fix: Remove PAYREXX_TEST_MODE + Add Missing DB Columns

## Two issues to resolve

### 1. Build error: `auto_renew` column missing from `handwerker_subscriptions`

The table lacks `auto_renew` and `payrexx_subscription_id` columns that both `Profile.tsx` and `cancel-payrexx-subscription` edge function depend on.

**Fix**: Add migration with:
```sql
ALTER TABLE handwerker_subscriptions
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payrexx_subscription_id text;
```

### 2. Remove PAYREXX_TEST_MODE from `create-payrexx-gateway`

The secret has been deleted. All test-mode fallback logic must be removed. The function should fail cleanly on errors instead of simulating success.

**File**: `supabase/functions/create-payrexx-gateway/index.ts`

Changes:
- Remove `PAYREXX_TEST_MODE` constant (lines 10-13)
- Remove diagnostic log referencing it (line 94-95)
- Remove `if (!PAYREXX_TEST_MODE)` wrapper around credential failure — always return 502 on invalid credentials (lines 104-116)
- Remove test-mode fallback in Step 4 JSON parse failure (lines 248-256) — always return 502
- Remove test-mode fallback in Step 4 API error (lines 275-285) — always return error

Result: clean production-only code path. Invalid credentials or API errors return proper error responses.

### Summary

| # | Action | File |
|---|--------|------|
| 1 | Add `auto_renew` + `payrexx_subscription_id` columns | DB migration |
| 2 | Strip all PAYREXX_TEST_MODE logic | `create-payrexx-gateway/index.ts` |

