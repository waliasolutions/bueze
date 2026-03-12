

# Delete Orphaned `info@mentorgeruest.ch` Account

## Problem
The email `info@mentorgeruest.ch` (user ID: `c5168941-241e-41f2-88e6-4c97af9d7673`) has orphaned records from a failed registration due to internet issues. It exists in `auth.users`, `profiles`, and `user_roles` but has no handwerker profile or other data. This blocks re-registration.

## Records to Delete
- `auth.users` row: `c5168941-241e-41f2-88e6-4c97af9d7673`
- `profiles` row: `c5168941-241e-41f2-88e6-4c97af9d7673`
- `user_roles` row: `4f23973e-ee47-4ba3-aed0-6083dbd7a0a1` (user_id = above)

## Plan

**One database migration** with:

```sql
-- Delete from user_roles first (FK dependency)
DELETE FROM public.user_roles WHERE user_id = 'c5168941-241e-41f2-88e6-4c97af9d7673';

-- Delete from profiles
DELETE FROM public.profiles WHERE id = 'c5168941-241e-41f2-88e6-4c97af9d7673';

-- Delete from auth.users (uses admin privileges in migration context)
DELETE FROM auth.users WHERE id = 'c5168941-241e-41f2-88e6-4c97af9d7673';
```

After this, `info@mentorgeruest.ch` can be registered fresh as a new handwerker.

No code changes needed — migration only.

