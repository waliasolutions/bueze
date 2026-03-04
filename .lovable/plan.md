

# Fix Payrexx 422 — Diagnose Test API + Enable Test Mode Fallback

## Analysis

The Payrexx API consistently returns **422 "Unprocessable Content"** with an empty `reason` field for both full and minimal payloads. The signature encoding (base64) and URL-encoding (via `URLSearchParams`) are now correct per the official docs.

Since you confirmed you're using a **test instance + test API key**, the most likely cause is one of:

1. **Invalid API key or instance name** — the 422 could be Payrexx rejecting the authentication silently
2. **Test instance limitation** — some Payrexx test/sandbox instances do not support Gateway creation at all, only SignatureCheck

## Plan

### Step 1: Add SignatureCheck diagnostic call

Before creating a Gateway, call `GET /v1.0/SignatureCheck/?instance=INSTANCE_NAME` with a signature of an empty string (per Payrexx docs). This verifies the API key and instance are valid. Log the result clearly.

**File:** `supabase/functions/create-payrexx-gateway/index.ts`

- Add a `verifyApiCredentials()` function that calls the SignatureCheck endpoint
- Call it before the Gateway creation attempt
- If it fails, return a clear error: "Payrexx API-Schlüssel oder Instanzname ungültig"

### Step 2: Set PAYREXX_TEST_MODE secret

The `PAYREXX_TEST_MODE` environment variable is not currently set. Adding it as `true` will enable the existing test fallback logic in the function — when Payrexx returns an error, the function returns the `successUrl` directly, allowing end-to-end flow testing without a working payment gateway.

- Add Supabase secret: `PAYREXX_TEST_MODE` = `true`

### Step 3: Improve error transparency

The `errorResponse()` in `_shared/cors.ts` sanitizes ALL 500+ status codes to a generic German message. The function already uses status 502 for upstream errors, but the catch block at line 229 still uses `errorResponse(msg, 500)` — which gets sanitized. Change this to 502 so the real error reaches the client during debugging.

**File:** `supabase/functions/create-payrexx-gateway/index.ts` (line 229)

```typescript
// Change from:
return errorResponse(getErrorMessage(error), 500);
// To:
return errorResponse(getErrorMessage(error), 502);
```

## Expected Outcome

- With `PAYREXX_TEST_MODE=true`, the checkout flow will work end-to-end immediately (simulated payments)
- The SignatureCheck diagnostic will tell us whether the API key/instance are valid
- Once you switch to a live Payrexx instance + live API key, remove `PAYREXX_TEST_MODE` and real payments will work

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/create-payrexx-gateway/index.ts` | Add SignatureCheck call, change catch error status to 502 |
| Supabase secret | Add `PAYREXX_TEST_MODE` = `true` |

