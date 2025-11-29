
-- Remove development RLS policy from employee_vacation_requests
-- This policy allows unrestricted access during development and should be removed for production

DROP POLICY IF EXISTS "Development access for employee_vacation_requests" ON public.employee_vacation_requests;

-- Verify proper RLS policies remain in place
-- The following policies should still exist for proper access control:
-- 1. Admins can manage all vacation requests
-- 2. Employees can view own vacation requests
-- 3. Employees can create own vacation requests
-- 4. Employees can update own pending requests
-- 5. Employees can delete own pending requests

COMMENT ON TABLE public.employee_vacation_requests IS 'Production-ready with proper RLS policies. Development access removed.';
