import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { PLAN_AMOUNTS, PLAN_GATEWAY_NAMES } from '../_shared/planLabels.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const PAYREXX_API_KEY = Deno.env.get('PAYREXX_API_KEY')!;
const PAYREXX_INSTANCE = Deno.env.get('PAYREXX_INSTANCE')!;

/**
 * Build query string from object
 */
function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

/**
 * Generate HMAC-SHA256 signature for Payrexx API
 */
async function generateSignature(queryString: string, apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const messageData = encoder.encode(queryString);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }

    // Create Supabase client with user's token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = claimsData.claims.sub as string;

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email) {
      return errorResponse('Could not fetch user data', 400);
    }
    const userEmail = userData.user.email;

    // Parse request body
    const { planType, successUrl, cancelUrl } = await req.json();

    if (!planType || !successUrl || !cancelUrl) {
      return errorResponse('Missing required fields: planType, successUrl, cancelUrl', 400);
    }

    if (!PLAN_AMOUNTS[planType]) {
      return errorResponse('Invalid plan type', 400);
    }

    const amount = PLAN_AMOUNTS[planType];
    const planName = PLAN_GATEWAY_NAMES[planType];
    const referenceId = `${userId}-${planType}-${Date.now()}`;

    // Build Payrexx Gateway request
    const params: Record<string, string> = {
      amount: amount.toString(),
      currency: 'CHF',
      purpose: planName,
      referenceId: referenceId,
      successRedirectUrl: successUrl,
      failedRedirectUrl: cancelUrl,
      cancelRedirectUrl: cancelUrl,
      fields: JSON.stringify({
        email: { value: userEmail, mandatory: true },
      }),
      // Payment methods - let Payrexx show all available
      psp: '',
      // Metadata for webhook processing
      vatRate: '8.1',
      sku: `BUEZE_${planType.toUpperCase()}`,
    };

    // Generate signature
    const queryString = buildQueryString(params);
    const signature = await generateSignature(queryString, PAYREXX_API_KEY);

    // Create Gateway via Payrexx API
    const payrexxUrl = `https://api.payrexx.com/v1.0/Gateway/?instance=${PAYREXX_INSTANCE}`;
    
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('ApiSignature', signature);

    const payrexxResponse = await fetch(payrexxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const payrexxData = await payrexxResponse.json();

    if (payrexxData.status !== 'success' || !payrexxData.data?.[0]?.link) {
      console.error('Payrexx API error:', payrexxData);
      return errorResponse(payrexxData.message || 'Failed to create payment gateway', 500);
    }

    const gatewayLink = payrexxData.data[0].link;
    const gatewayId = payrexxData.data[0].id;

    console.log(`Created Payrexx gateway ${gatewayId} for user ${userId}, plan ${planType}`);

    return successResponse({
      url: gatewayLink,
      gatewayId: gatewayId,
      referenceId: referenceId,
    });

  } catch (error) {
    console.error('Error creating Payrexx gateway:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
