

# Analysis: Arben's Missing Reviews

## Root Cause

This is **not a code bug**. The database contains exactly 2 reviews, both for Peter Müller (walia solutions). Arben Mulaj (MHS Haustechnik GmbH) has zero reviews because none were ever created for him.

The `HandwerkerDashboard.tsx` correctly queries `reviews` with `.eq('reviewed_id', userId)` — for Arben's user_id (`3d43d30b-...`), this returns an empty set, which is accurate.

## Solution: Seed Test Reviews for Arben

The `populate-test-data` edge function and `src/utils/testData.ts` already support creating reviews, but they only create reviews for users with existing lead purchases. Arben has no purchases, so no reviews were generated.

### Plan

**Option A — Quick manual seed via SQL migration (recommended)**

Run a migration to insert test reviews for Arben directly:

- Insert 3-4 reviews into the `reviews` table with `reviewed_id = '3d43d30b-77ee-42b3-8005-03103ed5e8d6'` (Arben's user_id)
- Use existing lead IDs and reviewer IDs from the database
- Vary ratings (4-5 stars) with realistic German comments
- Set `is_public = true`

This ensures Arben's Handwerker Dashboard shows reviews, the admin `/admin/reviews` page lists all reviews, and `handwerker_rating_stats` view automatically updates.

**Option B — Extend test data population**

Update the `populate-test-data` function to ensure every handwerker gets at least 2-3 reviews. This is more work but creates a reusable foundation.

### Recommendation

Option A — it's a one-time data seed, minimal effort, no code changes needed. The review system architecture (queries, RLS, views) is already correct.

| Change | Type |
|--------|------|
| SQL migration to insert test reviews for Arben | Data seed |
| No code changes required | — |

