// Shared Payrexx cryptographic and utility functions
// SSOT for HMAC signature generation and instance normalization

/**
 * Normalizes Payrexx instance input to the expected subdomain-only value.
 * Handles: "https://myinstance.payrexx.com/", "myinstance.payrexx.com", "myinstance"
 */
export function normalizePayrexxInstance(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const withoutProtocol = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');

  const host = withoutProtocol.split('/')[0];
  const match = host.match(/^([a-z0-9-]+)\.payrexx\.com$/i);
  return match?.[1] ?? host;
}

/**
 * Generate HMAC-SHA256 signature for Payrexx API requests (base64 encoded).
 */
export async function generateSignature(queryString: string, apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const messageData = encoder.encode(queryString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const bytes = new Uint8Array(signature);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}
