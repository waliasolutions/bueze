// Shared CORS headers and helpers for Supabase Edge Functions
// SSOT for CORS configuration across all functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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
 * Create an error JSON response with CORS headers
 */
export function errorResponse(error: string | Error, status = 400): Response {
  const message = error instanceof Error ? error.message : error;
  return new Response(
    JSON.stringify({ error: message, success: false }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
