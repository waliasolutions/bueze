# Fix: Handwerker cannot see client contact after acceptance

## Problem
The 2025-11-26 security migration locked `profiles` SELECT to `auth.uid() = id`. Handwerkers with accepted proposals can no longer fetch the client profile (`full_name`, `email`, `phone`), so the "Kontaktdaten des Kunden" card in `HandwerkerDashboard.tsx` never renders. The query returns 0 rows silently (RLS-filtered, status 200).

The privacy contract still holds: contact details only show after acceptance. We need an additive, narrowly scoped policy that re-enables that exact case.

## Changes

### 1. New migration — scoped RLS SELECT policy on `profiles`
Filename uses a current UTC timestamp that sorts strictly after the latest existing migration (`20260602093331_…`), keeping ordering monotonic:

`supabase/migrations/20260608120000_handwerker_accepted_client_profile.sql`

Additive — does not touch the existing "view own profile" policy.

```sql
CREATE POLICY "Handwerkers can view accepted client profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lead_proposals lp
      JOIN public.leads l ON lp.lead_id = l.id
      WHERE lp.handwerker_id = auth.uid()
        AND lp.status = 'accepted'
        AND l.owner_id = public.profiles.id
    )
  );
```

Gate is strict: `status = 'accepted'` only. Pending/rejected/withdrawn return zero rows. Uses existing indexes on `lead_proposals(handwerker_id, status)` and `leads(owner_id)`.

### 2. Frontend diagnostics — surface silent RLS misses
In `src/pages/HandwerkerDashboard.tsx` around the `profiles` fetch (~line 375), destructure `error` and log it so future RLS regressions don't fail silently:

```ts
const { data: ownerProfiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, full_name, email, phone')
  .in('id', ownerIds);

if (profilesError) {
  console.error('[RLS Profile Fetch Error]:', profilesError.message);
}
```

No business-logic change — purely observability.

## Files
- `supabase/migrations/20260608120000_handwerker_accepted_client_profile.sql` — new (sorts after `20260602093331_…`)
- `src/pages/HandwerkerDashboard.tsx` — add `error` capture + console log

## Verification
1. Apply migration.
2. As handwerker with an accepted proposal: Dashboard → Meine Offerten → contact card renders with name/email/phone.
3. As handwerker with only pending proposals: no contact card, no leakage.
4. As any other authenticated user: cannot read foreign profiles.

## Risk
- Over-exposure: Low — policy strictly requires `lp.handwerker_id = auth.uid()` AND `lp.status = 'accepted'`.
- Performance: Low — indexed lookups; EXISTS short-circuits.
- Backward compatibility: Additive only; existing privacy policy untouched.

Aligns with the project's privacy gate memory (contact visible only on acceptance).
