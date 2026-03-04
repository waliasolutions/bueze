

# Separate Clients from Handwerkers in Kundenverwaltung

## Problem
The Client Management page (`/admin/clients`) shows handwerkers mixed in with clients because:
1. Users with **both** `handwerker` and `client` roles pass the filter (line 100-104 only checks for `client`/`user` inclusion, not `handwerker` exclusion)
2. Users with **no roles** are included by default (line 118), which may include handwerker guest registrations

## Solution

**File:** `src/pages/admin/ClientManagement.tsx`

### 1. Exclude handwerker users from the client list
- Build a `handwerkerUserIds` set from roles with `handwerker` role
- On line 118, add `&& !handwerkerUserIds.has(p.id)` to the filter condition
- This ensures users with a handwerker role (even if they also have a client role) are excluded

### 2. Exclude users who have a handwerker_profiles record but no role
- Fetch `handwerker_profiles` user_ids to catch users without roles who registered as handwerkers
- Add these to the exclusion set

### 3. Add a visual "Rolle" indicator column
- Add a column showing the user's role(s) as badges so admins can quickly identify any edge cases
- Use existing `getRoleLabelShort` and `getRoleBadgeVariant` from `src/config/roles.ts` for consistent display

### Changes Summary

| Area | Change |
|------|--------|
| Data fetching | Also fetch `handwerker_profiles.user_id` to identify handwerkers without roles |
| Filter logic | Exclude any user with handwerker role OR handwerker_profiles record |
| Table UI | Add "Rolle" badge column using SSOT from `roles.ts` |

