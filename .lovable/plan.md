

# Admin UI for Orphaned Records Management

## Current State

- Two edge functions exist: `find-orphaned-records` (scan) and `cleanup-orphaned-records` (delete)
- **No admin page or button** exists to call them -- they can only be invoked via API/curl
- The `DeletionAudit.tsx` page shows past cleanup results but doesn't trigger new scans

## Plan

Add an "Orphaned Records" section to an existing admin page (or a new dedicated page) that lets admins:

1. **Scan** -- button calls `find-orphaned-records`, displays results (which tables have orphans, how many)
2. **Cleanup** -- after reviewing scan results, a confirm button calls `cleanup-orphaned-records` to delete them
3. **History** -- show past cleanup reports from `admin_notifications` where type = `orphan_cleanup_completed`

### Implementation

**New file: `src/pages/admin/OrphanedRecordsCleanup.tsx`**
- "Scan for Orphans" button → `supabase.functions.invoke('find-orphaned-records')` with auth token
- Display results in a table (table name, count of orphaned records)
- "Clean Up" button with AlertDialog confirmation → `supabase.functions.invoke('cleanup-orphaned-records')` with auth token
- Show cleanup report after completion
- Section showing recent cleanup history from `admin_notifications`

**Edit: `src/components/admin/AdminSidebar.tsx`**
- Add navigation link to the new page (e.g., under a "System" or "Wartung" section)

**Edit: `src/App.tsx`**
- Add route `/admin/orphaned-records` pointing to the new page

**Edit: `supabase/config.toml`**
- Change `find-orphaned-records` and `cleanup-orphaned-records` to `verify_jwt = true` for better security (currently `false`)

No database or schema changes needed.

