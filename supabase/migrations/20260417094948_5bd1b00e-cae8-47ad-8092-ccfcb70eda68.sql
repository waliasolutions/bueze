-- Cleanup orphan duplicate user: 98bcd35f… (info@mlg-ag.ch)
-- No handwerker_profile, no leads, no messages — just an abandoned signup
DELETE FROM public.user_roles WHERE user_id = '98bcd35f-03e5-4fa0-8b36-219491f4d546';
DELETE FROM public.profiles WHERE id = '98bcd35f-03e5-4fa0-8b36-219491f4d546';
DELETE FROM auth.users WHERE id = '98bcd35f-03e5-4fa0-8b36-219491f4d546';