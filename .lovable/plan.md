
# Deep QA Analysis: Profiles, Logins, Quotas, Time & Review Notifications

## QA Findings Summary

### 1. Profile Data Integrity (2024-2026)
**Status: ✅ Data looks healthy with some minor concerns**

**Findings from database queries:**
- 17+ handwerker profiles found with proper `user_id`, `email`, and `verification_status`
- All profiles have corresponding entries in both `profiles` and `user_roles` tables
- **Issue Found**: Some pending handwerker profiles still have `role: user` instead of `role: handwerker`
  - Example: `eddy_eni@hotmail.com`, `rm@muster.ch`, etc. have handwerker profiles but their user_roles show `role: user`
  - This is by design (per memory: role upgraded to handwerker upon admin approval)
- **Approved handwerkers** correctly have `role: handwerker` (e.g., `haushelferservice@gmail.com`, `amit.walia@gmx.ch`)

### 2. Login Functionality
**Status: ✅ Robust with proper fallbacks**

**Current Implementation (`src/pages/Auth.tsx`):**
- Correct priority: Admin → Handwerker → Client
- Uses `getUserRoles()` from SSOT `roleHelpers.ts`
- Defers async operations with `setTimeout(0)` to prevent auth deadlock (per Supabase best practices)
- Falls back to 'user' role if no roles found (defensive coding)

### 3. Quota Reached Message Logic
**Status: ✅ Correctly implemented, only shows for those at limit**

**Implementation verified in multiple locations:**
- `useSubscription.ts`: `isDepleted = !isUnlimited && remainingProposals <= 0`
- `can_submit_proposal` RPC function: Checks `proposals_used_this_period < proposals_limit`
- Toast with upgrade button in `HandwerkerDashboard.tsx` and `OpportunityView.tsx`
- `SubscriptionManager.tsx` shows warnings at correct thresholds

**Current quota status check (from DB):**
- All active subscriptions currently show `quota_status: ok` (no one at limit currently)

### 4. Monthly Reset Timing
**Status: ⚠️ ISSUE FOUND - Resets on rolling 30 days, not 1st of month at 0:00 AM**

**Current Implementation in `can_submit_proposal` function:**
```sql
IF sub_record.current_period_end < NOW() THEN
  UPDATE handwerker_subscriptions
  SET 
    proposals_used_this_period = 0,
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month'
```

**Problems:**
1. Uses `NOW()` which is UTC, not Swiss timezone
2. Resets on rolling 30-day basis from signup date, not 1st of month
3. No DST awareness for Swiss timezone

**Required Fix:** 
- Change reset logic to use Swiss timezone midnight on 1st of month
- Use `Europe/Zurich` timezone for all period calculations

### 5. DST Assurance for Swiss Timezone
**Status: ⚠️ Partially implemented**

**Good:**
- `src/lib/swissTime.ts` exists as SSOT with `SWISS_TIMEZONE = 'Europe/Zurich'`
- Uses `date-fns-tz` for proper DST handling
- Has `startOfMonth()` function

**Gaps:**
- Database function `can_submit_proposal` uses `NOW()` (UTC) not Swiss time
- `useSubscription.ts` creates periods with `new Date()` (UTC) not Swiss time
- Period calculations don't account for timezone when creating new periods

### 6. New Review Badge on Handwerker Dashboard Tab
**Status: ⚠️ MISSING - Reviews tab doesn't show unread count badge**

**Current Implementation:**
- Proposals tab: Shows `pendingProposalsCount` badge (orange) ✅
- Reviews tab: Only shows `({reviews.length})` total count, **no unread indicator**
- Dashboard stats area: Shows `dashboardStats.newReviews` in cards ✅ but not on tab

**Pattern exists for comparison:**
```tsx
// Proposals tab has badge
{pendingProposalsCount > 0 && (
  <Badge className="ml-1 sm:ml-2 bg-orange-500 ...">
    {pendingProposalsCount}
  </Badge>
)}
```

**Reviews tab needs same pattern using `dashboardStats.newReviews`**

---

## Implementation Plan

### Change 1: Add Unread Reviews Badge to Reviews Tab
**File: `src/pages/HandwerkerDashboard.tsx`**

**Line ~1000-1003 change from:**
```tsx
<TabsTrigger value="reviews" className="...">
  <Star className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Bewertungen</span>
  <span className="ml-1">({reviews.length})</span>
</TabsTrigger>
```

**To:**
```tsx
<TabsTrigger value="reviews" className="... relative">
  <Star className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Bewertungen</span>
  <span className="ml-1">({reviews.length})</span>
  {dashboardStats.newReviews > 0 && (
    <Badge className="ml-1 sm:ml-2 bg-yellow-500 hover:bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5">
      {dashboardStats.newReviews}
    </Badge>
  )}
</TabsTrigger>
```

**SSOT Compliance:** Uses existing `dashboardStats.newReviews` state (DRY - no new queries needed)

---

### Change 2: Swiss Timezone Monthly Reset (Database Function)
**Migration: Update `can_submit_proposal` function**

**Updated function:**
```sql
CREATE OR REPLACE FUNCTION public.can_submit_proposal(handwerker_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sub_record RECORD;
  swiss_now TIMESTAMP WITH TIME ZONE;
  next_month_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current time in Swiss timezone
  swiss_now := NOW() AT TIME ZONE 'Europe/Zurich';
  
  -- Calculate next month's 1st at 00:00:00 Swiss time
  next_month_start := date_trunc('month', swiss_now + INTERVAL '1 month') AT TIME ZONE 'Europe/Zurich';
  
  -- Get or create subscription record
  SELECT * INTO sub_record
  FROM handwerker_subscriptions
  WHERE user_id = handwerker_user_id;
  
  -- If no subscription exists, create free tier with period ending at next month start
  IF NOT FOUND THEN
    INSERT INTO handwerker_subscriptions (
      user_id, 
      plan_type, 
      proposals_limit,
      current_period_start,
      current_period_end
    )
    VALUES (
      handwerker_user_id, 
      'free', 
      5,
      date_trunc('month', swiss_now) AT TIME ZONE 'Europe/Zurich',
      next_month_start
    )
    RETURNING * INTO sub_record;
  END IF;
  
  -- Check if period has expired and reset if needed (DST-safe comparison)
  IF sub_record.current_period_end < NOW() THEN
    -- Reset to 1st of CURRENT month at 00:00 Swiss time
    UPDATE handwerker_subscriptions
    SET 
      proposals_used_this_period = 0,
      current_period_start = date_trunc('month', swiss_now) AT TIME ZONE 'Europe/Zurich',
      current_period_end = next_month_start
    WHERE user_id = handwerker_user_id;
    RETURN TRUE;
  END IF;
  
  -- Check if unlimited (-1) or under limit
  IF sub_record.proposals_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  RETURN sub_record.proposals_used_this_period < sub_record.proposals_limit;
END;
$function$;
```

**Key improvements:**
- Uses `AT TIME ZONE 'Europe/Zurich'` for DST-aware calculations
- Resets on 1st of month at 00:00:00 Swiss time (not rolling 30 days)
- Uses `date_trunc('month', ...)` for precise month boundaries

---

### Change 3: Update useSubscription Hook for Swiss Timezone
**File: `src/hooks/useSubscription.ts`**

**Import swissTime helpers:**
```typescript
import { now as swissNow, addMonths, startOfMonth } from '@/lib/swissTime';
```

**Update auto-create logic (lines 64-77) to use Swiss time:**
```typescript
// Auto-create default free subscription if none exists
if (!subscriptionData && enableAutoCreate) {
  const currentMonthStart = startOfMonth();
  const nextMonthStart = startOfMonth(addMonths(new Date(), 1));
  
  const { data: newSub, error: insertError } = await supabase
    .from('handwerker_subscriptions')
    .insert({
      user_id: userId,
      plan_type: 'free',
      status: 'active',
      proposals_used_this_period: 0,
      proposals_limit: 5,
      current_period_start: currentMonthStart.toISOString(),
      current_period_end: nextMonthStart.toISOString()
    })
    .select()
    .single();

  if (insertError) throw insertError;
  subscriptionData = newSub;
}
```

---

### Change 4: Add Helper for Next Month Start in Swiss Time
**File: `src/lib/swissTime.ts`**

**Add new function:**
```typescript
/**
 * Get start of next month in Swiss timezone (00:00:00)
 * DST-safe: properly handles March/October transitions
 */
export function startOfNextMonth(date?: Date | string): Date {
  const d = date ? toSwissTime(date) : now();
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return fromZonedTime(nextMonth, SWISS_TIMEZONE);
}
```

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/HandwerkerDashboard.tsx` | Add yellow badge to Reviews tab | Show unread review count like Proposals |
| `src/lib/swissTime.ts` | Add `startOfNextMonth()` helper | DST-safe next month calculation |
| `src/hooks/useSubscription.ts` | Use Swiss time for period creation | Consistent timezone handling |
| **Database Migration** | Update `can_submit_proposal` function | Reset at 1st of month 00:00 Swiss time |

---

## Verification Checklist

After implementation:
1. **Review badge**: Log in as handwerker with unread reviews → see yellow badge on Reviews tab
2. **Quota message**: User with 5/5 used proposals → sees depleted message with upgrade button
3. **Monthly reset**: Subscription periods end at 1st of month 00:00 Swiss time
4. **DST safety**: March 28 (spring forward) and October 25 (fall back) transitions handled correctly

---

## Technical Notes

- **SSOT maintained**: Uses existing `dashboardStats` state for badge (no duplicate queries)
- **DRY pattern**: Badge styling matches existing Proposals tab pattern exactly
- **Timezone safety**: All period calculations use `Europe/Zurich` timezone
- **No code bloat**: Minimal changes, reuses existing infrastructure
