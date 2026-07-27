## Zefix Integration: Secrets Setup + Live Verification

### 1. Store Zefix credentials as edge function secrets
Use `set_secret` (values known from your message):
- `ZEFIX_USERNAME` = `info@walia-solutions.ch`
- `ZEFIX_PASSWORD` = `AgQnjjX&` (stored verbatim, no shell escaping needed — tool takes raw values)

### 2. Live verification against the Zefix API
Invoke the deployed `zefix-lookup` edge function via `supabase--curl_edge_functions` with two probes:

**Probe A — Name search:** `{ "query": "Swisscom" }`
**Probe B — UID lookup:** `{ "uid": "CHE-105.805.017" }` (Swisscom AG, known good)

Capture full JSON responses and check that each result carries: `name`, `uid`, `legalFormName`, `address` (street/zip/city), `status`.

### 3. Triage field mapping if needed
If any field is empty despite Zefix returning data, patch `supabase/functions/_shared/zefix.ts` — the parser is already defensive for known variants (`list` vs bare array, `legalForm.name` object vs string, `address` vs `addresses[0]`). Fix is expected to be a one-line mapping tweak per missing field. Redeploy and re-run the two probes.

### 4. Report back
Post the two normalized responses plus a diff of any mapping change. No frontend or DB changes in scope.

### Technical notes
- Secrets flow: `set_secret` → available as `Deno.env.get('ZEFIX_USERNAME' | 'ZEFIX_PASSWORD')` in edge functions immediately, no redeploy required.
- The `&` in the password is safe here — we never pass it through a shell; the secrets tool stores the raw string.
- 404 from Zefix is treated as "no result" (empty array), not an error — already handled.
