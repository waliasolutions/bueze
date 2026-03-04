

# Enable Payrexx Test Payments

## Current State
- `PAYREXX_API_KEY` secret already exists in Supabase but needs to be updated with the new key
- `PAYREXX_TEST_MODE` is not currently set as a secret
- The `create-payrexx-gateway` edge function already supports test mode simulation

## Steps

### 1. Update the Payrexx API Key secret
Update `PAYREXX_API_KEY` with the provided value: `NYxaggnRJZXsOsV95GdBDzy0KslYwF`

### 2. Add `PAYREXX_TEST_MODE` secret
Set `PAYREXX_TEST_MODE` to `true` so the edge function uses simulation fallback when the Payrexx API returns errors (e.g., sandbox environment). This is already implemented in the edge function logic — it just needs the secret enabled.

### 3. No code changes needed
The `create-payrexx-gateway` function already:
- Checks `PAYREXX_TEST_MODE === 'true'`
- Falls back to returning `successUrl` directly when test mode is active
- Returns `testMode: true` in the response
- The Checkout page already shows a "Testmodus" toast when `data.testMode` is true

**Summary:** Two secret updates, zero code changes.

