# Load Test Report — Two Closing Gaps

Two additions to the report before shipping, both now verified against the live database.

## 1. Connection pooling was not a factor

Checked live connection state: `max_connections = 60`, 21 connections held by the PostgREST role (`authenticator`), 35 total, only 2 in `active` state and 26 idle waiting on the client. The pool was nowhere near saturation at 25 concurrent users, and no session was blocked waiting for a connection slot. So the `leads` p95 (~460 ms) is server-side query time, not connection queuing.

Sentence for the report:
> At 25 concurrent users the PostgREST pool stayed well inside its limits (21 of 60 backends, 2 active, no connection waits), so the `leads` latency is query execution time under RLS rather than time spent queuing for a connection.

## 2. Why `leads` own (owner_id, limit 20) stayed flat

The owner path is satisfied by the tail of the `Users can view active leads or own leads` policy, which is a bare `auth.uid() = owner_id` comparison — an inline scalar predicate on a column already in the row, with no join, no subquery, and no function call. The slow path instead evaluates `handwerker_has_proposal_on_lead(id)`, a SECURITY DEFINER function invoked once per candidate row, each call carrying its own plan and `search_path` setup cost. That difference — inline predicate versus per-row function call — is exactly why one scales flat and the other grows with lead count.

Sentence for the report:
> The owner-scoped query stayed flat because its policy reduces to an inline `auth.uid() = owner_id` comparison, whereas the handwerker path calls a SECURITY DEFINER function per row; the regression is specific to that function, not to RLS as a mechanism.

## Related finding worth one line

`public.leads` has no index on `owner_id` (indexes exist on `status`, `created_at`, `category`, `canton`, `zip/city/canton`, budget, and `search_text`). Owner queries stay fast today only because each owner has few leads and the result is capped at 20 rows. Adding `idx_leads_owner_id` is a cheap safeguard; it is a follow-up, not part of this report.

## Scope

Documentation only — this plan changes no application code, no schema, and no policies. The previously offered fixes (caching `useSiteSettings`, optimising the `leads` SELECT policies) remain separate work.
