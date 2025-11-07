-- Disable redundant admin notification triggers that are causing hangs
-- We handle notifications in application code instead

DROP TRIGGER IF EXISTS on_handwerker_registration_notify_admin ON public.handwerker_profiles;
DROP TRIGGER IF EXISTS trigger_notify_admins_registration ON public.handwerker_profiles;

-- Note: We keep the validation trigger and search text trigger as they're useful
-- The application code will handle sending admin notifications via edge functions