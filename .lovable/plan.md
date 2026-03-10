

# Admin Client Auto-Refresh + Registration Hardening

## Fix 1: Realtime subscription with debounce in `ClientManagement.tsx`

**File**: `src/pages/admin/ClientManagement.tsx`

- Add `useRef` and `useCallback` imports
- In the existing `useEffect` (lines 78-82), add a Supabase realtime channel on `profiles` table with `event: '*'`
- Wrap the `fetchClients()` call in a 500ms debounce using `setTimeout`/`clearTimeout` via a ref, so batch inserts don't trigger N re-fetches
- Return cleanup that removes the channel AND clears any pending timeout
- Add `.limit(5000)` to the 4 queries: `profiles` (line 91), `user_roles` (line 98), `handwerker_profiles` (line 118), `leads` (line 134)
- Add code comment: `// TODO: Replace .limit(5000) with proper cursor-based pagination when client count > 2000`
- Add code comment on `event: '*'`: `// Pragmatic: listens to all column changes. If noisy, filter to specific columns later.`

```tsx
useEffect(() => {
  if (hasChecked && isAuthorized) {
    fetchClients();

    const debounceRef = { timer: null as NodeJS.Timeout | null };
    
    // Pragmatic: event '*' covers INSERT/UPDATE/DELETE. If noisy, filter columns later.
    const channel = supabase
      .channel('admin-client-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        if (debounceRef.timer) clearTimeout(debounceRef.timer);
        debounceRef.timer = setTimeout(() => fetchClients(), 500);
      })
      .subscribe();

    return () => {
      if (debounceRef.timer) clearTimeout(debounceRef.timer);
      supabase.removeChannel(channel);
    };
  }
}, [hasChecked, isAuthorized]);
```

## Fix 2: Remove `listUsers()` from `guest-user-auto-create`

**File**: `supabase/functions/guest-user-auto-create/index.ts`

- Delete lines 41-47 (the `listUsers()` block)
- Keep the `profiles` table check (lines 30-39) as fast-path early return
- On `createUser` error, catch duplicates (status 422 / "already registered") and return `{ created: false }` instead of throwing — matching the `create-handwerker-self-registration` standard

```ts
const { data: newUser, error: createError } = await supabase.auth.admin.createUser({ ... });

if (createError) {
  const isDuplicate = (createError as any).status === 422
    || createError.message.includes('already been registered');
  if (isDuplicate) {
    return successResponse({ success: true, message: 'User already exists', created: false });
  }
  throw new Error(`Failed to create user: ${createError.message}`);
}
```

## Files Changed

| File | Change |
|---|---|
| `src/pages/admin/ClientManagement.tsx` | Realtime subscription with 500ms debounce + cleanup + `.limit(5000)` on 4 queries |
| `supabase/functions/guest-user-auto-create/index.ts` | Remove `listUsers()`, use create-and-catch for duplicates |

