-- Fix: unique_review_per_lead was UNIQUE(lead_id) which only allows ONE review per lead total.
-- This breaks the rating system when multiple handwerkers work on the same lead.
-- Correct constraint: UNIQUE(lead_id, reviewer_id, reviewed_id) — one review per reviewer-reviewed pair per lead.

-- Drop the broken constraint
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS unique_review_per_lead;

-- The original correct constraint from initial migration already exists as reviews_lead_id_reviewer_id_reviewed_id_key
-- Re-add it if it was dropped
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_lead_id_reviewer_id_reviewed_id_key'
    AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_lead_id_reviewer_id_reviewed_id_key
      UNIQUE (lead_id, reviewer_id, reviewed_id);
  END IF;
END $$;
