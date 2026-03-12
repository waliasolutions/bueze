

# Fix: Save Business Location During Handwerker Registration

## Problem
`HandwerkerOnboarding.tsx` collects `businessPlz`, `businessCity`, `businessCanton` via `ServiceAreaSelector` in Step 2, but the `insertData` object (line 462) does not include `business_zip`, `business_city`, or `business_canton`. These fields are saved as `null` in the database, making new registrations invisible in location-based directory searches.

`HandwerkerProfileEdit.tsx` already saves these fields correctly (line 674), confirming this is a simple omission, not a design choice.

## Fix (1 file, 3 lines)

**`src/pages/HandwerkerOnboarding.tsx`** — Add to `insertData` (after line 476):

```typescript
business_zip: businessPlz || null,
business_city: businessCity || null,
business_canton: businessCanton || null,
```

No new dependencies. No schema changes needed — columns already exist on `handwerker_profiles`. Aligns onboarding with the existing profile edit save pattern (DRY/SSOT).

