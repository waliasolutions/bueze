import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token) {
      throw new Error('Token is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch and validate token
    const { data: magicToken, error: tokenError } = await supabase
      .from('magic_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !magicToken) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(magicToken.expires_at);
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
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

    return new Response(
      JSON.stringify({
        valid: true,
        userId: magicToken.user_id,
        resourceType: magicToken.resource_type,
        resourceId: magicToken.resource_id,
        metadata: magicToken.metadata
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error validating magic token:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
