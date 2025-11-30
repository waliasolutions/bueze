-- Remove all development RLS policies that allow unrestricted access
-- These policies are security risks and must be removed before production

-- Remove development policies on projects table
DROP POLICY IF EXISTS "Development access for projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;

-- Remove development policies on tasks table
DROP POLICY IF EXISTS "Development access for tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can insert tasks" ON public.tasks;

-- Remove development policies on time_entries table
DROP POLICY IF EXISTS "Development access for time_entries" ON public.time_entries;

-- Remove development policies on vacation_records table
DROP POLICY IF EXISTS "Development access for vacation_records" ON public.vacation_records;

-- Remove development policies on vacation_balances table
DROP POLICY IF EXISTS "Development access for vacation_balances" ON public.vacation_balances;

-- Remove development policies on organization_admins table
DROP POLICY IF EXISTS "Development access for organization_admins" ON public.organization_admins;

-- Remove development policies on user_settings table
DROP POLICY IF EXISTS "Development access for user_settings" ON public.user_settings;

-- Remove development policies on optimization_suggestions table
DROP POLICY IF EXISTS "Development access for optimization_suggestions" ON public.optimization_suggestions;