

# Final Plan: Fix All Build Errors + DRY Cleanup

## Execution Order

**Phase 1 (blocking):** Fix 1 — migration to trigger types regeneration. Must complete before Phase 2.

**Phase 2 (parallel):** Fixes 2, 3, 4 — can all be done in parallel once types are regenerated.

**Phase 3 (non-blocking):** Fix 5 — DRY cleanup, no build dependency.

---

## Fix 1: Trigger types regeneration for `invoices` table

Migration SQL:
```sql
COMMENT ON TABLE invoices IS 'Subscription invoices for handwerker accounts';
```

## Fix 2: `isAdminAuthenticated` → `isAuthorized`

**File**: `src/pages/admin/AdminInvoices.tsx`
- `const { isAdminAuthenticated }` → `const { isAuthorized }`
- `if (isAdminAuthenticated)` → `if (isAuthorized)`

## Fix 3: Remove `getUserByEmail`, use create-and-catch

**File**: `supabase/functions/create-handwerker-self-registration/index.ts`

Delete the `getUserByEmail` block (lines 80-86). The handwerker_profiles check already catches existing profiles. For auth-only duplicates, rely on `createUser` error handling:

```typescript
if (authError) {
  console.error('Auth user creation failed:', JSON.stringify({
    message: authError.message,
    status: (authError as any).status,
    name: authError.name,
  }));
  
  const isDuplicate = (authError as any).status === 422
    || authError.message.includes('already been registered')
    || authError.message.includes('already registered');
  
  if (isDuplicate) {
    throw new Error('Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.');
  }
  
  throw new Error(`Konto konnte nicht erstellt werden: ${authError.message}`);
}
```

## Fix 4: Fix `base64Encode` argument

**File**: `supabase/functions/send-invoice-email/index.ts`
```typescript
const pdfBase64 = base64Encode(arrayBuffer);
```

## Fix 5: DRY `getPlanLabel` + `PLAN_BADGE_VARIANT`

**Decision on location**: The project already co-locates presentational config (colors, labels) with domain config — see `leadStatuses.ts` which has a `color` field alongside `label` and `description`. Following this established pattern, `PLAN_BADGE_VARIANT` belongs in `subscriptionPlans.ts`.

**Add to `src/config/subscriptionPlans.ts`:**
```typescript
/** SSOT: Human-readable plan label. Do not duplicate. */
export function getPlanLabel(planType: string): string {
  const plan = SUBSCRIPTION_PLANS[planType as SubscriptionPlanType];
  return plan?.displayName ?? planType;
}

/** Badge variant per plan for consistent UI styling */
export const PLAN_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  free: 'outline',
  monthly: 'default',
  '6_month': 'default',
  annual: 'secondary',
};
```

Update 4 files — remove local `getPlanLabel`, import from `@/config/subscriptionPlans`, use `PLAN_BADGE_VARIANT` in JSX:
- `HandwerkerInvoices.tsx`
- `AdminInvoices.tsx`
- `AdminPayments.tsx`
- `PaymentHistoryTable.tsx`

## Summary

| Phase | Fix | Files | Blocking |
|-------|-----|-------|----------|
| 1 | Trigger types regen | Migration | Yes |
| 2 | `isAdminAuthenticated` → `isAuthorized` | `AdminInvoices.tsx` | Yes |
| 2 | Remove `getUserByEmail`, status 422 primary | `create-handwerker-self-registration` | Yes |
| 2 | Fix `base64Encode` arg | `send-invoice-email` | Yes |
| 3 | DRY `getPlanLabel` + badge variants | 5 files | No |

