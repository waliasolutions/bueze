

# Add Profile Detail Modal to Handwerkerverzeichnis Cards

## Approach
Reuse the existing `HandwerkerProfileModal` component (already used in ConversationsList, ReceivedProposals, etc.) — no new components needed. Make each card clickable to open the modal.

## Changes — single file: `src/pages/HandwerkerVerzeichnis.tsx`

### 1. Add `user_id` to the interface and query
- Add `user_id: string | null` to `PublicHandwerker` interface
- Add `user_id` to the select fields in `fetchHandwerkers`

### 2. Add modal state to `HandwerkerVerzeichnis` component
- `selectedHandwerkerId: string | null` state
- `profileModalOpen: boolean` state

### 3. Make each card clickable
- Add `cursor-pointer` to `Card` and an `onClick` handler that sets `selectedHandwerkerId` to `hw.user_id` and opens the modal
- Add a subtle "Profil ansehen" text/button at the bottom of each card for discoverability

### 4. Render `HandwerkerProfileModal`
- Import and render `HandwerkerProfileModal` once, passing the selected ID and open state
- Place it at the end of `<main>`, outside the results grid

### 5. Pass state down to ResultsLayer
- Thread `onCardClick` callback and render the modal at the parent level (keeps modal state in one place, SSOT)

No new components, no duplication. Follows the established pattern used in 4+ other places in the app.

