

# Enable PAYREXX_TEST_MODE + Add SignatureCheck Diagnostic

## Current State
- The `create-payrexx-gateway` function already has test mode fallback logic built in
- `PAYREXX_TEST_MODE` secret is **not set** — the user needs to add it manually or approve the tool
- Both primary and fallback Payrexx requests return 422, confirming test API limitations

## Plan

### Step 1: User adds PAYREXX_TEST_MODE secret
The user adds `PAYREXX_TEST_MODE` = `true` in Supabase Dashboard → Settings → Edge Functions → Secrets. Alternatively, I can request it via the secrets tool if the user approves.

### Step 2: Add SignatureCheck diagnostic to Edge Function
Add a `verifyApiCredentials()` call before the Gateway creation attempt. This calls `GET /v1.0/SignatureCheck/` to verify the API key and instance are valid. Log the result. If it fails, return a clear error message.

### Step 3: Fix catch block error status
Change the final `catch` block from status 500 to 502 so the real error message reaches the client instead of being sanitized.

**File:** `supabase/functions/create-payrexx-gateway/index.ts`

### Expected Outcome
- With `PAYREXX_TEST_MODE=true`, checkout returns `successUrl` directly — full flow works without real payments
- SignatureCheck logs tell us whether the API key/instance are valid for when you switch to production

| File | Change |
|------|--------|
| `supabase/functions/create-payrexx-gateway/index.ts` | Add SignatureCheck, fix catch status |

