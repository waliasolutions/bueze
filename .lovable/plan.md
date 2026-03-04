

# Fix: Handwerker Status Toggle Violates Check Constraint

## Problem
The `handwerker_profiles` table has a CHECK constraint that only allows these `verification_status` values: `pending`, `approved`, `rejected`, `needs_review`.

The admin "Deaktivieren/Reaktivieren" toggle tries to set `verification_status = 'inactive'`, which violates this constraint.

## Solution
Add `'inactive'` to the CHECK constraint so admins can deactivate/reactivate handwerkers.

### Database Migration
```sql
ALTER TABLE handwerker_profiles 
  DROP CONSTRAINT handwerker_profiles_verification_status_check;

ALTER TABLE handwerker_profiles 
  ADD CONSTRAINT handwerker_profiles_verification_status_check 
  CHECK (verification_status = ANY (ARRAY['pending', 'approved', 'rejected', 'needs_review', 'inactive']));
```

### No code changes needed
The frontend code in `HandwerkerManagement.tsx` already handles `inactive` correctly (toggle logic, tab counts, UI badges). Only the database constraint needs updating.

| Change | Target |
|--------|--------|
| Update CHECK constraint | `handwerker_profiles.verification_status` |

