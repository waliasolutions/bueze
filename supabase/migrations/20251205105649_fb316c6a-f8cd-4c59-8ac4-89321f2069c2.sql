-- Add handwerker response capability to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS handwerker_response TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ;

-- Add unique constraint (one review per lead) - only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_review_per_lead'
  ) THEN
    ALTER TABLE public.reviews ADD CONSTRAINT unique_review_per_lead UNIQUE (lead_id);
  END IF;
END $$;

-- RLS policy for handwerker to respond to their reviews
DROP POLICY IF EXISTS "Handwerkers can respond to their reviews" ON public.reviews;
CREATE POLICY "Handwerkers can respond to their reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = reviewed_id)
WITH CHECK (auth.uid() = reviewed_id);

-- Create a view for handwerker rating statistics
CREATE OR REPLACE VIEW public.handwerker_rating_stats AS
SELECT 
  reviewed_id as user_id,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  COUNT(*) as review_count
FROM public.reviews
WHERE is_public = true
GROUP BY reviewed_id;