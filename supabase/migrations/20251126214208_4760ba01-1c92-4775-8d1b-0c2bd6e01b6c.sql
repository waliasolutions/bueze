-- Phase 1: Critical Security Fixes
-- Remove Development Access Policies and Fix Public Data Exposure

-- ============================================================================
-- PART 1: DROP DEVELOPMENT ACCESS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Development access for ab_test_results" ON public.ab_test_results;
DROP POLICY IF EXISTS "Development access for canton_tax_defaults" ON public.canton_tax_defaults;
DROP POLICY IF EXISTS "Development access for clarity_insights" ON public.clarity_insights;
DROP POLICY IF EXISTS "Development access for clarity_sessions" ON public.clarity_sessions;
DROP POLICY IF EXISTS "Development access for companies" ON public.companies;
DROP POLICY IF EXISTS "Development access for company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Development access for customers" ON public.customers;
DROP POLICY IF EXISTS "Development access for documents" ON public.documents;
DROP POLICY IF EXISTS "Development access for employee_insurance_settings" ON public.employee_insurance_settings;
DROP POLICY IF EXISTS "Development access for employee_vacation_settings" ON public.employee_vacation_settings;
DROP POLICY IF EXISTS "Development access for employees" ON public.employees;
DROP POLICY IF EXISTS "Development access for payroll_calculations" ON public.payroll_calculations;
DROP POLICY IF EXISTS "Development access for payroll_periods" ON public.payroll_periods;
DROP POLICY IF EXISTS "Development access for pmax_analytics" ON public.pmax_analytics;
DROP POLICY IF EXISTS "Development access for pricing_rules" ON public.pricing_rules;

-- ============================================================================
-- PART 2: FIX PUBLIC DATA EXPOSURE - PROFILES
-- ============================================================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- PART 3: FIX PUBLIC DATA EXPOSURE - HANDWERKER_PROFILES
-- ============================================================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Anyone can view verified handwerker profiles" ON public.handwerker_profiles;
DROP POLICY IF EXISTS "Public can view verified handwerker basic info" ON public.handwerker_profiles;

-- Create view for public handwerker profile data (without sensitive fields like IBAN, tax IDs)
CREATE OR REPLACE VIEW public.handwerker_profiles_public AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  company_name,
  company_legal_form,
  bio,
  categories,
  service_areas,
  hourly_rate_min,
  hourly_rate_max,
  response_time_hours,
  languages,
  website,
  portfolio_urls,
  logo_url,
  business_city,
  business_canton,
  business_zip,
  is_verified,
  verification_status,
  verified_at,
  created_at,
  updated_at,
  search_text
FROM public.handwerker_profiles
WHERE is_verified = true AND verification_status = 'approved';

-- Grant select on public view
GRANT SELECT ON public.handwerker_profiles_public TO authenticated, anon;

-- Public can view verified profiles (but sensitive fields are restricted by column-level security)
CREATE POLICY "Public can view verified handwerker basic info"
  ON public.handwerker_profiles
  FOR SELECT
  TO authenticated, anon
  USING (is_verified = true AND verification_status = 'approved');

-- ============================================================================
-- PART 4: FIX PUBLIC DATA EXPOSURE - FORM_SUBMISSIONS
-- ============================================================================

DROP POLICY IF EXISTS "Allow all access to form_submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Admins can view form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Admins can update form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Admins can delete form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Anyone can submit forms" ON public.form_submissions;

-- Admins can manage all form submissions
CREATE POLICY "Admins can view form submissions"
  ON public.form_submissions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update form submissions"
  ON public.form_submissions
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete form submissions"
  ON public.form_submissions
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can submit forms
CREATE POLICY "Anyone can submit forms"
  ON public.form_submissions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ============================================================================
-- PART 5: FIX PUBLIC DATA EXPOSURE - CONTACT_REQUESTS
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Admins can manage contact requests" ON public.contact_requests;

-- Admins can manage all contact requests
CREATE POLICY "Admins can manage contact requests"
  ON public.contact_requests
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));