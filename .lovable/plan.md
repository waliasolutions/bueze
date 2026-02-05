
# Admin Review Management with Response Capability

## Current State Analysis

### Existing Components
- **AdminReviewsManagement** (`src/pages/admin/ReviewsManagement.tsx`): Lists all reviews with filters, visibility toggle, delete functionality
- **HandwerkerReviewResponse** (`src/components/HandwerkerReviewResponse.tsx`): Reusable component for viewing reviews and submitting responses

### What's Missing
Admin can currently:
- View all reviews in a table
- Toggle visibility (public/hidden)
- Delete reviews
- See "Antwort vorhanden" indicator

Admin cannot:
- View the full review details (comment, response)
- Add or edit handwerker_response on behalf of handwerker

### RLS Policies - Already Configured
```sql
-- Admins can update all reviews (includes handwerker_response)
qual: (get_user_role(auth.uid()) = 'admin'::app_role)
```

---

## Solution: SSOT Approach - Extract Shared Review Card Component

Rather than duplicating the review display/response logic from `HandwerkerReviewResponse`, I'll create a **shared component** that both handwerker and admin can use.

```text
Current:
┌─────────────────────────────────────────────────────────┐
│  HandwerkerReviewResponse.tsx                           │
│  - Full review cards with response UI                   │
│  - Used only by HandwerkerDashboard                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ReviewsManagement.tsx                                  │
│  - Table view with limited info                         │
│  - No response capability                               │
└─────────────────────────────────────────────────────────┘

After:
┌─────────────────────────────────────────────────────────┐
│  ReviewCard.tsx (NEW - shared)                          │
│  - Single review display with full details              │
│  - Response form (if canRespond prop is true)           │
│  - Shows existing response                              │
│  - Optional visibility toggle (admin only)              │
│  - Optional delete button (admin only)                  │
└─────────────────────────────────────────────────────────┘
         │                            │
         ▼                            ▼
┌─────────────────────┐    ┌─────────────────────────────┐
│ HandwerkerReview    │    │ ReviewsManagement           │
│ Response.tsx        │    │ (Admin)                     │
│ - Uses ReviewCard   │    │ - Uses Dialog + ReviewCard  │
│ - canRespond=true   │    │ - canRespond=true           │
│ - showAdmin=false   │    │ - showAdmin=true            │
└─────────────────────┘    └─────────────────────────────┘
```

---

## Technical Implementation

### Step 1: Create Shared ReviewCard Component

**New File: `src/components/ReviewCard.tsx`**

Props interface:
```typescript
interface ReviewCardProps {
  review: ReviewForAdmin | ReviewForHandwerker;
  onReviewUpdated: () => void;
  // Feature flags
  canRespond?: boolean;        // Show response form
  showAdminActions?: boolean;  // Show visibility toggle, delete
  isExpanded?: boolean;        // Control expanded state externally
}
```

Features:
- Display: rating, title, reviewer name, date, project title, comment
- Response section: show existing response or response form
- Admin actions: visibility toggle, delete (only when showAdminActions=true)
- Shares response submission logic with HandwerkerReviewResponse

### Step 2: Refactor HandwerkerReviewResponse to Use ReviewCard

**File: `src/components/HandwerkerReviewResponse.tsx`**

Change from inline card rendering to:
```tsx
{reviews.map((review) => (
  <ReviewCard
    key={review.id}
    review={review}
    onReviewUpdated={onReviewUpdated}
    canRespond={true}
    showAdminActions={false}
  />
))}
```

This maintains exact current functionality while removing ~100 lines of duplicate code.

### Step 3: Add Review Detail Dialog to Admin Page

**File: `src/pages/admin/ReviewsManagement.tsx`**

Add "View Details" action button that opens a Dialog containing ReviewCard:
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost" size="icon" title="Details anzeigen">
      <Eye className="h-4 w-4" />
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Bewertung Details</DialogTitle>
    </DialogHeader>
    <ReviewCard
      review={review}
      onReviewUpdated={() => {
        loadReviews();
        // Close dialog if needed
      }}
      canRespond={true}
      showAdminActions={true}
    />
  </DialogContent>
</Dialog>
```

### Step 4: Update Type Definitions

**File: `src/types/entities.ts`**

Create a union type for ReviewCard to accept both admin and handwerker review types:
```typescript
export type ReviewCardData = ReviewForAdmin | ReviewForHandwerker;
```

---

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ReviewCard.tsx` | CREATE | Shared review display + response component |
| `src/components/HandwerkerReviewResponse.tsx` | REFACTOR | Use ReviewCard, remove duplicate code |
| `src/pages/admin/ReviewsManagement.tsx` | UPDATE | Add detail dialog with ReviewCard |
| `src/types/entities.ts` | UPDATE | Add ReviewCardData union type |

---

## Benefits

1. **SSOT**: Single ReviewCard component for all review displays
2. **DRY**: Response form logic written once, used everywhere
3. **No Code Bloat**: Reduces HandwerkerReviewResponse by ~80 lines
4. **Consistent UX**: Same review display pattern for handwerker and admin
5. **Easy Testing**: One component to test for review functionality

---

## Admin Workflow After Implementation

1. Admin navigates to `/admin/reviews`
2. Sees table with all reviews, filters, stats
3. Clicks "View Details" (eye icon) on any review
4. Dialog opens showing:
   - Full review with rating, comment
   - Existing handwerker response (if any)
   - Response form (admin can write response on behalf of handwerker)
   - Visibility toggle
   - Delete button
5. Admin can respond → saves `handwerker_response` field
6. Dialog closes, table refreshes to show "Antwort vorhanden"

---

## Technical Notes

- Response submission uses same Supabase update as handwerker
- Admin RLS policy already allows UPDATE on reviews
- `invalidateReviewQueries` called after any mutation to refresh cache
- No email triggered when admin responds (only handwerker trigger fires on response_at change)
