

# QA Report: Recent Billing Settings SSOT Update

## Issues Found

### 1. SSOT Violation: Hardcoded "Büeze.ch GmbH" in Datenschutz.tsx (HIGH)
**File**: `src/pages/legal/Datenschutz.tsx` lines 14, 23, 63
- The SEO meta description and schema markup still hardcode `"Büeze.ch GmbH"` instead of using `b.company_legal_name`
- Line 63: body text still hardcodes `"Büeze.ch GmbH"` — should use `{b.company_legal_name}`

### 2. SSOT Violation: Hardcoded "Büeze.ch GmbH" in AGB.tsx (HIGH)
**File**: `src/pages/legal/AGB.tsx` lines 41, 223
- Line 41: Uses `b.company_street` etc. but hardcodes `"Büeze.ch GmbH"` — should use `{b.company_legal_name}`
- Line 223: `"Eigentum der Büeze.ch GmbH"` — should use `{b.company_legal_name}`

### 3. SSOT Violation: Hardcoded "Gamprin-Bendern, Liechtenstein" in AGB.tsx (MEDIUM)
**File**: `src/pages/legal/AGB.tsx` line 240
- `"Gerichtsstand ist Gamprin-Bendern, Liechtenstein"` — should use `{b.company_city}, {b.company_country}`

### 4. Duplicate Defaults: Two Identical Fallback Objects (DRY violation)
- `src/hooks/useBillingSettings.ts` has `DEFAULTS` object
- `supabase/functions/_shared/companyConfig.ts` has `DEFAULT_BILLING_SETTINGS` object
- These are identical copies. The edge function copy is acceptable (different runtime), but the frontend `DEFAULTS` could be shared with a `src/config/billingDefaults.ts` if any other frontend file needs them. Currently only used in the hook, so this is minor.

### 5. `as any` Type Cast in useBillingSettings.ts (LOW)
**File**: `src/hooks/useBillingSettings.ts` line 37
- `.from('billing_settings_public' as any)` — the view IS in the generated types (confirmed in types.ts line 2055), so the `as any` cast is unnecessary. Should use the proper type.

### 6. No Routing Issue Found
- `/admin/billing` route is correctly registered in `App.tsx`
- AdminSidebar has the "Abrechnung" link pointing to `/admin/billing`
- No duplicate or conflicting routes detected

### 7. AdminBillingSettings: No Loading State for `isLoading` from Context (LOW)
The `AdminBillingSettings` page fetches directly from `billing_settings` table (correct for admin write access) but doesn't use the billing context at all. This is fine — admin needs the base table, not the public view. No issue here.

### 8. Checkout MwSt Logic: Correct (Verified)
- `Checkout.tsx` lines 519-532 correctly read `billing.mwst_rate` from context
- Shows `mwst_note` when rate is 0, shows percentage when > 0
- Total calculation includes tax dynamically. No hardcoded 8.1% remains.

---

## Summary of Fixes Needed

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Hardcoded "Büeze.ch GmbH" in SEO meta | `Datenschutz.tsx` L14,23 | Use template literal with `b.company_legal_name` |
| 2 | Hardcoded "Büeze.ch GmbH" in body text | `Datenschutz.tsx` L63 | Replace with `{b.company_legal_name}` |
| 3 | Hardcoded "Büeze.ch GmbH" in AGB | `AGB.tsx` L41, L223 | Replace with `{b.company_legal_name}` |
| 4 | Hardcoded "Gamprin-Bendern, Liechtenstein" | `AGB.tsx` L240 | Replace with `{b.company_city}, {b.company_country}` |
| 5 | Unnecessary `as any` type cast | `useBillingSettings.ts` L37 | Remove `as any` |

All five fixes are small string replacements — no architectural changes needed.

