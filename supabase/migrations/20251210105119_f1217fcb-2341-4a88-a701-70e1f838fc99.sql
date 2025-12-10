-- Phase 1: Add category-specific ratings to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN DEFAULT NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.reviews.quality_rating IS 'Rating for quality of work (1-5)';
COMMENT ON COLUMN public.reviews.punctuality_rating IS 'Rating for punctuality/timeliness (1-5)';
COMMENT ON COLUMN public.reviews.communication_rating IS 'Rating for communication (1-5)';
COMMENT ON COLUMN public.reviews.cleanliness_rating IS 'Rating for cleanliness after work (1-5)';
COMMENT ON COLUMN public.reviews.value_rating IS 'Rating for value for money (1-5)';
COMMENT ON COLUMN public.reviews.would_recommend IS 'Whether client would recommend this handwerker';
COMMENT ON COLUMN public.reviews.is_verified IS 'Whether review is from a verified completed job';