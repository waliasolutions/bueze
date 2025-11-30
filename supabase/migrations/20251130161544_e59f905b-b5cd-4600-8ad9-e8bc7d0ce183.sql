-- Phase 3: Clean up unused enums from archived HR/Payroll and Trucking modules
-- These enums are no longer needed since their associated tables have been archived

-- Drop HR/Payroll related enums
DROP TYPE IF EXISTS public.employment_status CASCADE;
DROP TYPE IF EXISTS public.employment_type CASCADE;
DROP TYPE IF EXISTS public.payroll_period_type CASCADE;
DROP TYPE IF EXISTS public.payroll_status CASCADE;
DROP TYPE IF EXISTS public.vacation_request_status CASCADE;
DROP TYPE IF EXISTS public.vacation_request_type CASCADE;
DROP TYPE IF EXISTS public.vacation_status CASCADE;
DROP TYPE IF EXISTS public.vacation_type CASCADE;

-- Drop Trucking/Logistics related enums
DROP TYPE IF EXISTS public.time_entry_status CASCADE;

-- Note: Using CASCADE to automatically drop any remaining dependencies
-- The types.ts file will automatically update to remove these enum types