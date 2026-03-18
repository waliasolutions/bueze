

# Deep QA: Bewertungen (Ratings) System

## Overall Assessment

The rating system is well-architected with proper SSOT patterns. However, there is **one critical issue** found.

---

## Issue: `send-rating-reminder` cron job is NOT scheduled

The Edge Function `send-rating-reminder` exists and is fully implemented, but there is **no pg_cron job** to trigger it. The function is designed to send email reminders to clients 7 days after a handwerker marks a lead as delivered, if no review has been submitted yet.

Without this cron job, clients never receive rating reminder emails, which likely reduces the number of reviews submitted.

**Fix:** Add a cron job via migration:

```sql
SELECT cron.schedule(
  'send-rating-reminder',
  '0 9 * * *',  -- Daily at 09:00 UTC (11:00 Swiss summer / 10:00 Swiss winter)
  $$SELECT net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-rating-reminder',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'}'::jsonb,
    body := '{}'::jsonb
  )$$
);
```

One migration, no code changes needed.

---

## Everything Else: Working Correctly ✓

### Client Flow ✓
- **RatingPrompt** on Dashboard shows unrated delivered leads
- **RatingForm** validates delivery status before allowing submission, handles duplicates (23505), validates profanity/spam
- Low-rating reviews (1-2 stars) auto-create admin notifications
- Unique constraint prevents double reviews per lead

### Handwerker Flow ✓
- **HandwerkerReviewResponse** on HandwerkerDashboard shows all received reviews with average
- **ReviewCard** allows handwerker to respond to reviews (write/edit response)
- Response saved to `handwerker_response` + `response_at` fields

### Email Notifications ✓
- **New review → Handwerker email**: DB trigger `on_new_review` → `send-rating-notification` → `ratingReceivedHandwerkerTemplate` ✓
- **Handwerker responds → Client email**: DB trigger `on_rating_response` → `send-rating-response-notification` → `ratingResponseClientTemplate` ✓
- **In-app notification**: `send-rating-notification` also inserts into `handwerker_notifications` ✓
- **Rating reminder**: Function exists but cron not scheduled ✗

### Admin Flow ✓
- **ReviewsManagement** page with stats, filters, search
- Toggle visibility (public/hidden), delete reviews
- Detail dialog with full ReviewCard (can respond on behalf)
- Low-rating admin notifications working
- `handwerker_rating_stats` view correctly aggregates public reviews only

### Data Integrity ✓
- `is_verified` flag set based on accepted proposal existence
- `handwerker_rating_stats` view filters on `is_public = true`
- Review validation: profanity filter, spam detection, personal info warnings

