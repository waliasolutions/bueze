// Shared CORS headers and helpers for Supabase Edge Functions
// SSOT for CORS configuration across all functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Handle CORS preflight requests
 * @param req - Request object
 * @returns Response if OPTIONS request, null otherwise
 */
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

/**
 * Create a success JSON response with CORS headers
 */
export function successResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error JSON response with CORS headers.
 * For 500 errors, sanitizes the message to avoid leaking DB schema details.
 */
export function errorResponse(error: string | Error, status = 400): Response {
  const rawMessage = error instanceof Error ? error.message : error;
  // For server errors, don't expose internal details to the client
  const message = status >= 500
    ? 'Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
    : rawMessage;
  // Always log the real error server-side for debugging
  if (status >= 500) {
    console.error('[errorResponse]', rawMessage);
  }
  return new Response(
    JSON.stringify({ error: message, success: false }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
