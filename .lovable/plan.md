

# Fix Reviews: Full Client Names for Handwerker + Client Review History

## Issues Identified

### Issue 1: Client Names Are Anonymous for Handwerker
**Problem:** In `HandwerkerReviewResponse.tsx` (line 107-109), reviewer names show only the first name:
```typescript
const reviewerName = review.profiles?.first_name || 
  review.profiles?.full_name?.split(' ')[0] || 
  'Kunde';
```

**Also:** In `HandwerkerRating.tsx` (line 121), public-facing reviews only show first names:
```typescript
const reviewerName = review.reviewer?.full_name?.split(' ')[0] || 'Kunde';
```

**Distinction:**
- **Handwerker Dashboard (private view):** Should show **full name** since review is already submitted
- **Public profile:** Can keep first name only for privacy

---

### Issue 2: Email Notification on Handwerker Response - Already Working
**Status:** The email notification system for handwerker responses is already implemented:
- `trigger_send_rating_response_notification()` - Database trigger fires on UPDATE when `handwerker_response` changes from NULL
- `send-rating-response-notification` Edge Function - Fetches client email and sends notification
- `ratingResponseClientTemplate` - Email template with link to dashboard

**The trigger and email are working correctly.** Client receives email when handwerker responds.

---

### Issue 3: Client Cannot See Their Given Reviews
**Problem:** The Client Dashboard (`src/pages/Dashboard.tsx`) has tabs for:
- Meine Aufträge (My Leads)
- Erhaltene Offerten (Received Proposals)
- Archiv
- Profil

**Missing:** A "Meine Bewertungen" (My Reviews) tab where clients can see reviews they have given.

---

## Solution Overview

```text
┌─────────────────────────────────────────────────────────────┐
│  Changes Required                                            │
├─────────────────────────────────────────────────────────────┤
│  1. HandwerkerReviewResponse.tsx                            │
│     Show FULL NAME (not just first name) to handwerker      │
│     review.profiles?.full_name || 'Kunde'                   │
├─────────────────────────────────────────────────────────────┤
│  2. Dashboard.tsx (Client Dashboard)                        │
│     Add "Meine Bewertungen" tab showing:                    │
│     - Reviews the client has given                          │
│     - Star rating, comment, project title                   │
│     - Handwerker response (if any)                          │
│     - Link to handwerker profile                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Changes

### Change 1: Show Full Client Name to Handwerker

**File: `src/components/HandwerkerReviewResponse.tsx`**

**Line 107-109 change from:**
```typescript
const reviewerName = review.profiles?.first_name || 
  review.profiles?.full_name?.split(' ')[0] || 
  'Kunde';
```

**To:**
```typescript
// Show full name to handwerker (they have a business relationship)
const reviewerName = review.profiles?.full_name || 
  review.profiles?.first_name || 
  'Kunde';
```

**Note:** The handwerker already has full contact details for accepted proposals, so showing full name on reviews is consistent.

---

### Change 2: Add "Meine Bewertungen" Tab to Client Dashboard

**File: `src/pages/Dashboard.tsx`**

**Add new state (around line 29):**
```typescript
const [myReviews, setMyReviews] = useState<ReviewWithDetails[]>([]);
const [reviewsLoading, setReviewsLoading] = useState(false);
```

**Add fetch function (after fetchUserData):**
```typescript
const fetchMyReviews = async (userId: string) => {
  setReviewsLoading(true);
  try {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select(`
        *,
        leads (title, category),
        handwerker:handwerker_profiles!reviewed_id (
          first_name, last_name, company_name
        )
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false });
    
    setMyReviews(reviewsData || []);
  } catch (error) {
    console.error('Error fetching reviews:', error);
  } finally {
    setReviewsLoading(false);
  }
};
```

**Call in fetchUserData (add to Promise.all):**
```typescript
// Fetch reviews given by this user
supabase
  .from('reviews')
  .select(`
    *,
    leads (title, category),
    reviewed:handwerker_profiles!reviewed_id (
      first_name, last_name, company_name, user_id
    )
  `)
  .eq('reviewer_id', user.id)
  .order('created_at', { ascending: false })
```

**Add new tab in TabsList (after "Archiv"):**
```tsx
<TabsTrigger value="reviews" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-2">
  <span className="hidden sm:inline">Meine Bewertungen</span>
  <span className="sm:hidden">Bewertungen</span>
  <span className="ml-1">({myReviews.length})</span>
</TabsTrigger>
```

**Add TabsContent for reviews:**
```tsx
<TabsContent value="reviews" className="space-y-6">
  <h2 className="text-xl font-semibold">Meine Bewertungen</h2>
  
  {myReviews.length === 0 ? (
    <Card>
      <CardContent className="text-center py-12">
        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Sie haben noch keine Bewertungen abgegeben.
        </p>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-4">
      {myReviews.map((review) => {
        const handwerkerName = review.reviewed?.company_name || 
          `${review.reviewed?.first_name} ${review.reviewed?.last_name}`.trim() || 
          'Handwerker';
        
        return (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} size="sm" />
                    <Badge variant="outline">{review.rating}/5</Badge>
                  </div>
                  {review.title && (
                    <CardTitle className="text-base">{review.title}</CardTitle>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(review.created_at)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Für: <strong>{handwerkerName}</strong> • Projekt: {review.leads?.title}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {review.comment && (
                <p className="text-sm">{review.comment}</p>
              )}
              
              {/* Show handwerker response if exists */}
              {review.handwerker_response && (
                <div className="border-l-2 border-primary pl-3 mt-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                    <MessageSquare className="h-4 w-4" />
                    Antwort von {handwerkerName}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.handwerker_response}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  )}
</TabsContent>
```

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `src/components/HandwerkerReviewResponse.tsx` | Show full_name instead of first_name | Handwerker sees full client name |
| `src/pages/Dashboard.tsx` | Add "Meine Bewertungen" tab with reviews list | Client can see their given reviews |

---

## What's Already Working

- Email notification when handwerker responds to review (trigger + Edge Function)
- Rating reminder emails after 7 days (cron job)
- Review submission flow
- Handwerker can see and respond to reviews

---

## Expected Result

**For Handwerker:**
- Reviews tab shows full client name (e.g., "Test Testnachname" instead of "Test")

**For Client:**
- New "Meine Bewertungen" tab in Dashboard
- Shows all reviews they have given
- Displays handwerker name/company, project, rating, comment
- Shows handwerker response if one exists
- Can track their review history

