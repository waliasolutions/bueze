

# Fix: Admin Reviews Not Visible (RLS Policy Mismatch)

## Root Cause

The `reviews` table has three admin RLS policies that all use:
```sql
get_user_role(auth.uid()) = 'admin'::app_role
```

Both admin users in the system have the role `super_admin`, not `admin`. Since the policy checks for an exact match against `'admin'`, super admins are excluded -- they see zero reviews.

This is the same pattern used correctly elsewhere (e.g., `handwerker_profiles`, `admin_notifications`) where policies check for BOTH roles using `IN ('admin', 'super_admin')` or use the `has_role()` function.

## Fix

A single database migration to update the three affected RLS policies on the `reviews` table:

1. **"Admins can view all reviews"** (SELECT)
2. **"Admins can update all reviews"** (UPDATE)
3. **"Admins can delete all reviews"** (DELETE)

Replace `get_user_role(auth.uid()) = 'admin'` with:
```sql
has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
```

This uses the existing `has_role()` SECURITY DEFINER function (already used in other tables) and covers both admin role types.

## What Changes

| Item | Details |
|------|---------|
| File | 1 new SQL migration |
| Policies updated | 3 (SELECT, UPDATE, DELETE on `reviews`) |
| Frontend code | No changes needed |
| Risk | Low -- purely additive access for super_admins |

## What Does NOT Change

- The "Anyone can view public reviews" SELECT policy stays as-is
- The "Users can create reviews" INSERT policy stays as-is
- The "Handwerkers can respond to their reviews" UPDATE policy stays as-is
- No frontend code changes -- the admin UI already works correctly, it just receives no data due to RLS
- No schema changes

## Verification

After the migration, logging in as either admin user (info@bueeze.ch or info@walia-solutions.ch) and navigating to /admin/reviews will show all 3 existing reviews with full moderation capabilities.

