
# Fix: Login Issues for All User Types

## Executive Summary

After comprehensive database and code analysis, I've identified several issues affecting login functionality for different user types. The core problems are:

1. **2 users without any role** in `user_roles` table (trigger may have failed during signup)
2. **Approved handwerker with super_admin role** - info@walia-solutions.ch has both handwerker profile (approved) and super_admin role, causing incorrect routing
3. **Pending handwerkers with 'user' role** - 7 handwerkers with pending status still have 'user' role (correct behavior - they haven't been approved yet)
4. **No issues found with dekyi@walia-solutions.ch** - This user exists with 'user' role and no handwerker profile (expected behavior)

---

## Current Database State Analysis

### Users Without Roles (Critical)
| Email | Full Name | Issue |
|-------|-----------|-------|
| miti.walia@gmail.com | Amit Walia | No entry in `user_roles` table |
| bfbffbnfn@hotmsil.com | Bfbfbf Fnfbfbff | No entry in `user_roles` table (test account) |

**Root Cause:** The `handle_new_user` database trigger may have failed during signup, or these users were created through a non-standard path.

### Admin with Handwerker Profile (Edge Case)
| Email | Role | Handwerker Status |
|-------|------|-------------------|
| info@walia-solutions.ch | super_admin | approved |

**Impact:** This user correctly redirects to `/admin/dashboard` (admin role takes priority), but the handwerker profile shows 'super_admin' role instead of 'handwerker' in queries.

### Pending Handwerkers with User Role (Expected)
7 handwerkers with `verification_status='pending'` have role='user'. This is **correct behavior** - they only get 'handwerker' role upon admin approval.

---

## Fix Plan

### Fix 1: Add Missing User Roles (Database)

Run SQL to add default 'user' role for accounts missing role entries:

```sql
-- Add 'user' role for users without any role entry
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'user'::app_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
```

### Fix 2: Improve Auth.tsx Login Redirect Logic

Current logic in `Auth.tsx` correctly prioritizes admin/super_admin roles. However, add better error handling and logging for debugging:

**File: `src/pages/Auth.tsx`**

Changes:
1. Add console logging for auth redirect debugging
2. Add fallback for users without any role (treat as 'user')
3. Improve error handling in role fetching

### Fix 3: Improve useUserRole Hook Resilience

**File: `src/hooks/useUserRole.ts`**

Changes:
1. Default to 'user' role when no roles found in database
2. Add better error logging for debugging
3. Ensure consistent behavior across all auth states

### Fix 4: Improve Dashboard Redirect Safety

**File: `src/pages/Dashboard.tsx`**

Current behavior: If user has handwerker profile and is not admin, redirects to `/handwerker-dashboard`. This is correct.

**File: `src/pages/HandwerkerDashboard.tsx`**

Current behavior: If user has no handwerker profile, redirects to `/handwerker-onboarding`. This is correct.

---

## Technical Changes

### Database Migration

Add missing roles for users without entries:

```sql
-- Fix: Add default user role for accounts missing role entries
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'user'::app_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
```

### src/pages/Auth.tsx

Add debug logging and improve error handling:

```typescript
// In handlePostLoginRedirect function
const handlePostLoginRedirect = async (user, roleData, isHandwerkerRole) => {
  console.log('[Auth] Post-login redirect - user:', user.id);
  console.log('[Auth] Role data:', roleData);
  console.log('[Auth] Is handwerker role:', isHandwerkerRole);
  
  // Priority 1: Admin roles
  if (roleData && (roleData.role === 'admin' || roleData.role === 'super_admin')) {
    console.log('[Auth] Redirecting to admin dashboard');
    navigate('/admin/dashboard');
    return;
  }
  
  // Check for handwerker profile
  const { data: existingProfile } = await supabase
    .from('handwerker_profiles')
    .select('id, verification_status')
    .eq('user_id', user.id)
    .maybeSingle();
  
  console.log('[Auth] Handwerker profile:', existingProfile);
  
  // Priority 2: Handwerker with profile
  if (isHandwerkerRole || existingProfile) {
    if (existingProfile?.verification_status === 'approved') {
      console.log('[Auth] Redirecting to handwerker dashboard');
      navigate('/handwerker-dashboard');
    } else {
      console.log('[Auth] Redirecting to handwerker onboarding (pending/no profile)');
      navigate('/handwerker-onboarding');
    }
    return;
  }
  
  // Priority 3: Default to client dashboard
  console.log('[Auth] Redirecting to client dashboard');
  navigate('/dashboard');
};
```

### src/hooks/useUserRole.ts

Improve role handling when no roles found:

```typescript
// In fetchRoles function, after fetching
const fetchedRoles: AppRole[] = rolesData?.map(r => r.role as AppRole) || [];

// If no roles found, default to 'user' and log warning
if (fetchedRoles.length === 0) {
  console.warn('[useUserRole] No roles found for user:', userId, '- defaulting to user role');
}

if (isMounted) {
  setAllRoles(fetchedRoles.length > 0 ? fetchedRoles : ['user']);
  setLoading(false);
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| Database (SQL) | Add missing user roles via migration |
| `src/pages/Auth.tsx` | Add debug logging, improve redirect logic |
| `src/hooks/useUserRole.ts` | Add warning for missing roles, ensure default 'user' behavior |

---

## Testing Checklist

After implementation:

1. **dekyi@walia-solutions.ch (Client)**
   - [ ] Can log in at `/auth`
   - [ ] Redirects to `/dashboard`
   - [ ] Can create leads and view proposals

2. **Gmail addresses (e.g., pm.wsolutions@gmail.com - Handwerker)**
   - [ ] Can log in at `/auth`
   - [ ] If approved: redirects to `/handwerker-dashboard`
   - [ ] If pending: redirects to `/handwerker-onboarding` or sees pending status

3. **info@walia-solutions.ch (Super Admin)**
   - [ ] Can log in at `/auth`
   - [ ] Redirects to `/admin/dashboard`
   - [ ] Admin role takes priority over handwerker profile

4. **miti.walia@gmail.com (Was missing role)**
   - [ ] After DB fix: Can log in and access `/dashboard`

---

## Summary

The login issues are primarily caused by:
1. Missing role entries in the database (2 users)
2. Normal behavior being misinterpreted as bugs (pending handwerkers have 'user' role until approved)

The fixes add:
- Database migration to repair missing role entries
- Debug logging for easier troubleshooting
- Defensive coding to handle edge cases gracefully
