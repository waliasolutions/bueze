

# Investigate Recent User Creation Activity

User wants to verify if there was bot/automated registration activity today before proceeding with the bulk password reset.

## Approach

Run two read-only queries against `auth.users`:

### Query 1 — Today's registrations with exact timestamps (Swiss time)

```sql
SELECT 
  id,
  email,
  created_at AT TIME ZONE 'Europe/Zurich' AS created_swiss,
  last_sign_in_at AT TIME ZONE 'Europe/Zurich' AS last_signin_swiss,
  EXTRACT(EPOCH FROM (last_sign_in_at - created_at))::int AS signin_delay_seconds,
  raw_user_meta_data->>'full_name' AS full_name,
  raw_user_meta_data->>'role' AS registration_role
FROM auth.users
WHERE created_at >= (now() AT TIME ZONE 'Europe/Zurich')::date
ORDER BY created_at DESC;
```

Shows every account created today with exact Swiss-time timestamps.

### Query 2 — Bot detection signals

```sql
SELECT 
  date_trunc('minute', created_at AT TIME ZONE 'Europe/Zurich') AS minute_bucket,
  COUNT(*) AS registrations_in_minute,
  array_agg(email ORDER BY created_at) AS emails
FROM auth.users
WHERE created_at >= now() - interval '7 days'
GROUP BY minute_bucket
HAVING COUNT(*) > 1
ORDER BY minute_bucket DESC;
```

Bot signal = multiple registrations within the same minute. Last 7 days for context.

### Query 3 — Cross-check against handwerker_profiles + leads

```sql
SELECT 
  u.email,
  u.created_at AT TIME ZONE 'Europe/Zurich' AS created_swiss,
  CASE 
    WHEN hp.id IS NOT NULL THEN 'handwerker'
    WHEN l.id IS NOT NULL THEN 'client (submitted lead)'
    ELSE 'unknown / orphan'
  END AS account_type,
  hp.company_name,
  hp.verification_status
FROM auth.users u
LEFT JOIN public.handwerker_profiles hp ON hp.user_id = u.id
LEFT JOIN public.leads l ON l.owner_id = u.id
WHERE u.created_at >= now() - interval '24 hours'
ORDER BY u.created_at DESC;
```

Distinguishes legitimate registrations (have a handwerker profile or submitted a lead) from suspicious orphan accounts.

## Output

Three tables in chat with full timestamps + interpretation. No data modified.

After you review the results, we resume the bulk reset plan with the verified candidate list.

