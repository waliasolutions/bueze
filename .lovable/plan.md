

# Fix: Admin Abo Dropdown + Handwerker Subscription Access

## Problem 1: Admin can't change Handwerker plans
The `handwerker_subscriptions` table has two RLS policies that check `get_user_role(auth.uid()) = 'admin'`:
- "Admins can manage all subscriptions" (ALL)
- "Admins can view all subscriptions" (SELECT)

The `get_user_role()` function returns only ONE role via `LIMIT 1`. If the logged-in user has `super_admin` role, the equality check `= 'admin'` fails silently — the admin sees no subscription data and updates are rejected.

**Fix**: Database migration to replace both policies with `has_role()` checks that cover both `admin` and `super_admin`, matching the pattern used on other tables (leads, handwerker_profiles, etc.).

```sql
DROP POLICY "Admins can manage all subscriptions" ON handwerker_subscriptions;
DROP POLICY "Admins can view all subscriptions" ON handwerker_subscriptions;

CREATE POLICY "Admins can manage all subscriptions" ON handwerker_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view all subscriptions" ON handwerker_subscriptions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
```

## Problem 2: Handwerker can't find subscription upgrade in logged-in area
The `SubscriptionManagement` component already exists at `/profile` (subscription tab), but:
- The handwerker navigation in `src/config/navigation.ts` has no link to `/profile`
- The HandwerkerDashboard Profile tab has no link to subscription management

**Fix**: Add "Abo verwalten" nav item to the handwerker navigation in `src/config/navigation.ts`, linking to `/profile` with the subscription tab context. This is the SSOT for navigation.

```typescript
// Add to handwerker navigation array:
{ label: 'Abo verwalten', href: '/profile?tab=subscription', icon: Crown },
```

Then ensure `Profile.tsx` reads the `tab` query param to auto-select the subscription tab when arriving via this link.

## Files Modified

| File | Change |
|------|--------|
| Migration SQL | Fix RLS policies on `handwerker_subscriptions` to use `has_role()` |
| `src/config/navigation.ts` | Add "Abo verwalten" link for handwerker role |
| `src/pages/Profile.tsx` | Read `tab` query param to auto-select subscription tab |

