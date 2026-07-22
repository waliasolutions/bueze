-- Bucket B: cron/service-only utilities — no anon/authenticated
REVOKE EXECUTE ON FUNCTION public.check_lead_expiry() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_expired_magic_tokens() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_expired_contact_requests() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setup_admin_user(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_activate_subscription(uuid, text, text, integer, timestamp with time zone) FROM anon, authenticated;

-- Bucket C: UI RPCs — authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handwerker_can_view_client_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_accepted_client_contacts(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handwerker_has_proposal_on_lead(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_submit_proposal(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_proposal_atomic(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.budget_ranges_overlap(integer, integer, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_users_with_roles() FROM anon;

-- Explicit grants to authenticated (idempotent)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handwerker_can_view_client_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accepted_client_contacts(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handwerker_has_proposal_on_lead(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_submit_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_proposal_atomic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.budget_ranges_overlap(integer, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;