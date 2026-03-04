

# Fix Payrexx Gateway 422 Error — Wrong Signature Encoding

## Root Cause
The Payrexx API requires the `ApiSignature` to be **base64-encoded** HMAC-SHA256. The current code encodes it as **hex**, which causes Payrexx to reject every request with 422 "Unprocessable Content".

From Payrexx docs:
```shell
apiSignature=`echo -n "" | openssl dgst -sha256 -hmac "SECRET" -binary | openssl enc -base64`
```

Current code (wrong):
```typescript
const hashArray = Array.from(new Uint8Array(signature));
return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // hex!
```

## Fix

**File:** `supabase/functions/create-payrexx-gateway/index.ts`

Change the `generateSignature` function to return base64 instead of hex:

```typescript
async function generateSignature(queryString: string, apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const messageData = encoder.encode(queryString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  // Payrexx requires base64, NOT hex
  const bytes = new Uint8Array(signature);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}
```

Single function change, no other modifications needed. The rest of the request structure is correct per Payrexx's API spec.

