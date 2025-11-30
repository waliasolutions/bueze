-- Phase 2: Archive Orphaned HR/Trucking Tables to Separate Schema
-- This preserves data while isolating it from the production Büeze.ch marketplace

-- Create archive schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS archive;

-- Add description to schema
COMMENT ON SCHEMA archive IS 'Archive schema for orphaned HR/Payroll and Trucking/Logistics modules - preserved for potential data recovery';

-- ====================
-- HR/PAYROLL TABLES
-- ====================

-- Move employees and related tables
ALTER TABLE IF EXISTS public.employees SET SCHEMA archive;
ALTER TABLE IF EXISTS public.employee_insurance_settings SET SCHEMA archive;
ALTER TABLE IF EXISTS public.employee_vacation_settings SET SCHEMA archive;
ALTER TABLE IF EXISTS public.employee_vacation_requests SET SCHEMA archive;
ALTER TABLE IF EXISTS public.vacation_records SET SCHEMA archive;
ALTER TABLE IF EXISTS public.vacation_balances SET SCHEMA archive;
ALTER TABLE IF EXISTS public.payroll_periods SET SCHEMA archive;
ALTER TABLE IF EXISTS public.payroll_calculations SET SCHEMA archive;
ALTER TABLE IF EXISTS public.documents SET SCHEMA archive;
ALTER TABLE IF EXISTS public.canton_tax_defaults SET SCHEMA archive;

-- ====================
-- TRUCKING/LOGISTICS TABLES
-- ====================

-- Move trucking/logistics tables
ALTER TABLE IF EXISTS public.trucks SET SCHEMA archive;
ALTER TABLE IF EXISTS public.customers SET SCHEMA archive;
ALTER TABLE IF EXISTS public.projects SET SCHEMA archive;
ALTER TABLE IF EXISTS public.tasks SET SCHEMA archive;
ALTER TABLE IF EXISTS public.task_media SET SCHEMA archive;
ALTER TABLE IF EXISTS public.time_entries SET SCHEMA archive;
ALTER TABLE IF EXISTS public.pricing_rules SET SCHEMA archive;
ALTER TABLE IF EXISTS public.companies SET SCHEMA archive;
ALTER TABLE IF EXISTS public.company_settings SET SCHEMA archive;
ALTER TABLE IF EXISTS public.organization_admins SET SCHEMA archive;
ALTER TABLE IF EXISTS public.user_settings SET SCHEMA archive;

-- Add comments to archived tables for future reference
COMMENT ON TABLE archive.employees IS 'Archived from HR/Payroll module - not used by Büeze.ch marketplace';
COMMENT ON TABLE archive.projects IS 'Archived from Trucking/Logistics module - not used by Büeze.ch marketplace';
COMMENT ON TABLE archive.tasks IS 'Archived from Trucking/Logistics module - not used by Büeze.ch marketplace';

-- Note: The types.ts file will automatically update to remove these tables from TypeScript types