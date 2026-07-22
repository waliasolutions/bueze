
-- Fix 1: billing_settings_public view has no grants → 406 on every page load.
GRANT SELECT ON public.billing_settings_public TO anon, authenticated;

-- Fix 2: purge orphan proposals (handwerker profile deleted).
DELETE FROM public.lead_proposals lp
WHERE NOT EXISTS (SELECT 1 FROM public.handwerker_profiles h WHERE h.id = lp.handwerker_id);

-- Fix 3: purge orphan handwerker_subscriptions rows (handwerker profile deleted).
DELETE FROM public.handwerker_subscriptions s
WHERE NOT EXISTS (SELECT 1 FROM public.handwerker_profiles h WHERE h.id = s.user_id);
