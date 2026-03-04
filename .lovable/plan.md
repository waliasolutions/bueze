

# Admin & User Management Fixes

Three issues to address:

## Issue 1: Handwerkerverzeichnis for Privatpersonen

Per memory `ux/craftsman-directory-removal`, the public Handwerkerverzeichnis was **permanently removed** by design. Craftsman profiles are only visible to clients who received a proposal or are in an active conversation. 

**Question**: The user mentions "Privatpersonen / Handwerkerverzeichnis einblenden" — this conflicts with the prior decision. However, re-enabling a read-only public directory of verified handwerkers would require:
- A new route `/handwerker-verzeichnis`
- A page listing `handwerker_profiles_public` view data (already exists as a public view)
- Filtering by category and canton
- No contact details shown publicly

**Plan**: Create a simple `HandwerkerVerzeichnis.tsx` page that queries the existing `handwerker_profiles_public` view (already has data for verified/approved profiles). Add route and navigation link visible to unauthenticated users and clients.

| File | Change |
|------|--------|
| `src/pages/HandwerkerVerzeichnis.tsx` | New page: list verified handwerkers from `handwerker_profiles_public` view with category/canton filters |
| `src/App.tsx` | Add route `/handwerker-verzeichnis` |
| `src/config/navigation.ts` | Add nav item for client role |
| `src/components/Header.tsx` | Add public nav link (if not covered by navigation.ts) |

## Issue 2: Admin client categorization (Kunden vs Privatpersonen)

Currently `ClientManagement.tsx` fetches all profiles with `client` or `user` roles but has no categorization. The user wants admins to distinguish between "Kunden" (business clients) and "Privatpersonen" (private individuals).

**Plan**: Add a `client_type` column to the `profiles` table (`'business'` or `'private'`, default `'private'`). Show it as a badge in the admin client table with an inline toggle. No new tables needed — extends existing profiles.

| File | Change |
|------|--------|
| Migration SQL | `ALTER TABLE profiles ADD COLUMN client_type text DEFAULT 'private'` |
| `src/pages/admin/ClientManagement.tsx` | Show client_type badge, add toggle dropdown to switch between 'business'/'private' |
| `src/integrations/supabase/types.ts` | Auto-regenerated |

## Issue 3: 5-proposal limit — show message to client after 5th proposal received

Currently the `max_purchases` column on leads defaults to 5 and is enforced in `HandwerkerDashboard.tsx` (line 327) — leads with `proposals_count >= max_purchases` are hidden from handwerkers. But the **client** receives no notification or message about this.

**Plan**: In `ReceivedProposals.tsx`, after fetching proposals per lead, show an info banner when `proposals_count >= max_purchases` (both available on the lead data). Also add this info in `LeadDetails.tsx`.

| File | Change |
|------|--------|
| `src/components/ReceivedProposals.tsx` | Add info banner per lead group when proposal limit reached: "Sie haben die maximale Anzahl von 5 Offerten erhalten" |
| `src/pages/LeadDetails.tsx` | Show info badge when `proposals_count >= max_purchases` |

## Summary

- **3 files changed** + 1 new page + 1 migration
- All changes use existing data structures and views (SSOT)
- No new components beyond the Verzeichnis page
- `max_purchases` limit already enforced server-side; this adds client-facing messaging

