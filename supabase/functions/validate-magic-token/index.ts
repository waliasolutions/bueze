import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { token } = await req.json();

    if (!token) {
      throw new Error('Token is required');
    }

    const supabase = createSupabaseAdmin();

    // Fetch and validate token
    const { data: magicToken, error: tokenError } = await supabase
      .from('magic_tokens')
      .select('id, user_id, resource_type, resource_id, expires_at, metadata')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !magicToken) {
      return errorResponse('Invalid or expired token', 401);
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(magicToken.expires_at);
    if (now > expiresAt) {
      return errorResponse('Token has expired', 401);
    }

    // Mark token as used for sensitive actions
    if (magicToken.resource_type === 'proposal' || magicToken.resource_type === 'dashboard') {
      await supabase
        .from('magic_tokens')
        .update({ used_at: now.toISOString() })
        .eq('id', magicToken.id);
    }

    console.log('Magic token validated:', {
      token: token.substring(0, 8) + '...',
      resourceType: magicToken.resource_type,
      resourceId: magicToken.resource_id,
      userId: magicToken.user_id
    });

    return successResponse({
      valid: true,
      userId: magicToken.user_id,
      resourceType: magicToken.resource_type,
      resourceId: magicToken.resource_id,
      metadata: magicToken.metadata
    });

  } catch (error) {
    console.error('Error validating magic token:', error);
    return errorResponse((error as Error).message, 400);
  }
});
