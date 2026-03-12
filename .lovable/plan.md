

# Fix: Insert free-tier subscription for Manuel Akin

Manuel Akin (user_id `62012849-3858-41bb-a4b9-d4cae3848362`) has an approved profile but is missing a `handwerker_subscriptions` row, causing "Kein Abo" in the admin UI.

## Action
Insert a single free-tier subscription record:

```sql
INSERT INTO handwerker_subscriptions (user_id, plan_type, proposals_limit, status, current_period_start, current_period_end)
VALUES (
  '62012849-3858-41bb-a4b9-d4cae3848362',
  'free',
  5,
  'active',
  now(),
  now() + interval '30 days'
);
```

This is a **data-only** fix — no code changes needed. After insertion, his status will show "Kostenlos" like all other handwerkers.

