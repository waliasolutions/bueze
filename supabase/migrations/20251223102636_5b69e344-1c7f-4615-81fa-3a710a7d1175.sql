-- Create handwerker_service_areas table for PLZ range-based matching
CREATE TABLE public.handwerker_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handwerker_id uuid NOT NULL REFERENCES handwerker_profiles(id) ON DELETE CASCADE,
  start_plz integer NOT NULL,
  end_plz integer NOT NULL,
  label text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_plz_range CHECK (start_plz <= end_plz AND start_plz >= 1000 AND end_plz <= 9999)
);

-- Create index for fast range queries
CREATE INDEX idx_service_areas_range ON public.handwerker_service_areas USING btree (start_plz, end_plz);
CREATE INDEX idx_service_areas_handwerker ON public.handwerker_service_areas USING btree (handwerker_id);

-- Enable RLS
ALTER TABLE public.handwerker_service_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Handwerkers can view own service areas"
  ON public.handwerker_service_areas
  FOR SELECT
  USING (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Handwerkers can insert own service areas"
  ON public.handwerker_service_areas
  FOR INSERT
  WITH CHECK (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Handwerkers can update own service areas"
  ON public.handwerker_service_areas
  FOR UPDATE
  USING (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Handwerkers can delete own service areas"
  ON public.handwerker_service_areas
  FOR DELETE
  USING (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all service areas"
  ON public.handwerker_service_areas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Public read for matching (edge functions use service role, but this allows public profile viewing)
CREATE POLICY "Anyone can view service areas for approved handwerkers"
  ON public.handwerker_service_areas
  FOR SELECT
  USING (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles 
      WHERE verification_status = 'approved' AND is_verified = true
    )
  );

-- Add orphan_lead type to admin_notification_types if needed (already flexible with text type)
-- Add comment for documentation
COMMENT ON TABLE public.handwerker_service_areas IS 'PLZ range-based service areas for bulletproof lead matching. Each row represents a range the handwerker serves.';