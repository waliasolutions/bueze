
-- Performance: wrap auth.uid()/auth.role()/auth.jwt() calls in RLS policies
-- as (SELECT auth.<fn>()) so Postgres evaluates them ONCE per query (InitPlan)
-- instead of once per candidate row. This is the standard Supabase RLS
-- optimization; policy semantics are unchanged.
--
-- Policies are rewritten from the live catalog (pg_policies) rather than
-- re-transcribed from migration files, so the exact current USING/WITH CHECK
-- expressions, roles, command and permissive/restrictive mode are preserved
-- verbatim — only the auth.<fn>() calls gain the subselect wrapper.
DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
  roles_list text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'leads', 'lead_proposals', 'messages', 'conversations',
        'profiles', 'handwerker_profiles', 'user_roles',
        'notifications', 'handwerker_notifications', 'admin_notifications',
        'handwerker_subscriptions', 'payment_history', 'invoices', 'ratings'
      )
      AND (
        COALESCE(qual, '') ~ 'auth\.(uid|role|jwt)\(\)'
        OR COALESCE(with_check, '') ~ 'auth\.(uid|role|jwt)\(\)'
      )
      -- Skip anything already using the wrapped form (double-wrap guard).
      AND COALESCE(qual, '') !~ 'SELECT auth\.(uid|role|jwt)\(\)'
      AND COALESCE(with_check, '') !~ 'SELECT auth\.(uid|role|jwt)\(\)'
  LOOP
    new_qual := CASE WHEN p.qual IS NULL THEN NULL
      ELSE regexp_replace(p.qual, 'auth\.(uid|role|jwt)\(\)', '(SELECT auth.\1())', 'g') END;
    new_check := CASE WHEN p.with_check IS NULL THEN NULL
      ELSE regexp_replace(p.with_check, 'auth\.(uid|role|jwt)\(\)', '(SELECT auth.\1())', 'g') END;

    SELECT string_agg(quote_ident(r), ', ') INTO roles_list FROM unnest(p.roles) AS r;

    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s %s %s',
      p.policyname, p.schemaname, p.tablename,
      p.permissive,
      p.cmd,
      roles_list,
      CASE WHEN new_qual IS NOT NULL THEN 'USING (' || new_qual || ')' ELSE '' END,
      CASE WHEN new_check IS NOT NULL THEN 'WITH CHECK (' || new_check || ')' ELSE '' END
    );

    RAISE NOTICE 'RLS initplan rewrite: %.% policy %', p.schemaname, p.tablename, p.policyname;
  END LOOP;
END $$;
