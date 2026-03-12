

# Fix Orphaned Records: Pagination + UI + Admin Filtering

## Problems

1. **Auth user pagination missing** -- `listUsers()` returns only ~50 users per page. Users beyond page 1 (including admins) are falsely reported as orphans.
2. **Table query limits** -- Supabase defaults to 1000 rows per query; large tables are partially scanned.
3. **UI: emails crammed into one cell** -- Multiple emails are `.join(', ')`-ed into a single truncated table cell, making them unreadable.

## Plan

### 1. Fix `find-orphaned-records/index.ts` -- paginate auth users

Replace the single `listUsers()` call with a loop:

```ts
const authUserIds = new Set<string>();
let page = 1;
while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  data.users.forEach(u => authUserIds.add(u.id));
  if (data.users.length < 1000) break;
  page++;
}
```

Add `.limit(5000)` to all table `.select()` calls (consistent with existing admin query pattern).

### 2. Fix `cleanup-orphaned-records/index.ts` -- same pagination fix

Same paginated `listUsers()` loop and `.limit(5000)` on table queries.

### 3. Improve the admin UI in `OrphanedRecordsCleanup.tsx`

- Show each orphaned email/entry as its **own row** instead of joining them into a single cell. For profiles and handwerker profiles, list each email on a separate line with the user ID.
- For count-only entries (notifications, reviews, etc.), keep the current single-row display.
- This makes it easy to see exactly which accounts are orphaned.

### Files to edit
- `supabase/functions/find-orphaned-records/index.ts` -- paginate listUsers, add .limit(5000)
- `supabase/functions/cleanup-orphaned-records/index.ts` -- paginate listUsers, add .limit(5000)
- `src/pages/admin/OrphanedRecordsCleanup.tsx` -- show individual emails as separate rows

