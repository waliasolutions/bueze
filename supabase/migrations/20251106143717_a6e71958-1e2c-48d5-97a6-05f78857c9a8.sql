-- Grant INSERT permission to anon role (for guest registration)
GRANT INSERT ON public.handwerker_profiles TO anon;

-- Grant SELECT, INSERT, UPDATE, DELETE to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.handwerker_profiles TO authenticated;