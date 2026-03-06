

# Fix: Payrexx Gateway 403 "API secret not correct"

## Root Cause

The SignatureCheck (GET with empty body) passes, but gateway creation (POST with body) fails. After reviewing the **official Payrexx PHP SDK** (v2.0.11), I found that `Communicator.php` line 899 sends the API secret as an HTTP header:

```php
$this->httpHeaders['x-api-key'] = $this->apiSecret;
```

Our edge function does NOT send this header. The `SignatureCheck` endpoint is lenient (works without it), but the `Gateway` POST endpoint requires it.

## Fix

**File**: `supabase/functions/create-payrexx-gateway/index.ts`

Add `x-api-key` header to the gateway creation fetch request (line 194-196):

```typescript
headers: {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
  'x-api-key': PAYREXX_API_KEY,
},
```

One line added. No other changes needed.

## Why SignatureCheck works but Gateway doesn't

- `SignatureCheck` is a GET endpoint that validates the HMAC of an empty string — it only checks instance + signature validity
- `Gateway` POST requires the full `x-api-key` header for server-side request authentication, in addition to the body signature

