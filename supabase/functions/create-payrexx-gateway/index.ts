import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { PLAN_AMOUNTS, PLAN_GATEWAY_NAMES } from '../_shared/planLabels.ts';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const PAYREXX_API_KEY = Deno.env.get('PAYREXX_API_KEY')!;
const PAYREXX_INSTANCE_RAW = Deno.env.get('PAYREXX_INSTANCE')!;
const PAYREXX_TEST_MODE = Deno.env.get('PAYREXX_TEST_MODE') === 'true';

/**
 * Normalizes Payrexx instance input to the expected value (subdomain only).
 * Accepts values like:
 * - wsolutions
 * - wsolutions.payrexx.com
 * - https://wsolutions.payrexx.com
 */
function normalizePayrexxInstance(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const withoutProtocol = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');

  const host = withoutProtocol.split('/')[0];
  const match = host.match(/^([a-z0-9-]+)\.payrexx\.com$/i);
  return match?.[1] ?? host;
}

const PAYREXX_INSTANCE = normalizePayrexxInstance(PAYREXX_INSTANCE_RAW);

/**
 * Generate HMAC-SHA256 signature for Payrexx API
 */
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
  const bytes = new Uint8Array(signature);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

/**
 * Verify Payrexx API credentials using the SignatureCheck endpoint.
 * Returns { valid: boolean, detail: string }.
 */
async function verifyApiCredentials(): Promise<{ valid: boolean; detail: string }> {
  try {
    // Payrexx docs: sign an empty string for SignatureCheck
    const signature = await generateSignature('', PAYREXX_API_KEY);
    const url = `https://api.payrexx.com/v1.0/SignatureCheck/?instance=${encodeURIComponent(PAYREXX_INSTANCE)}&ApiSignature=${encodeURIComponent(signature)}`;

    console.log(`[SignatureCheck] Calling ${url.substring(0, 80)}…`);
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const text = await res.text();
    console.log(`[SignatureCheck] status=${res.status} body=${text.substring(0, 300)}`);

    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }

    if (res.status === 200 && parsed?.status === 'success') {
      return { valid: true, detail: 'API key and instance verified' };
    }

    return {
      valid: false,
      detail: `SignatureCheck failed (HTTP ${res.status}): ${parsed?.message || text.substring(0, 200)}`,
    };
  } catch (err) {
    return { valid: false, detail: `SignatureCheck error: ${getErrorMessage(err)}` };
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    // --- Step 0: Verify Payrexx credentials (diagnostic) ---
    const credCheck = await verifyApiCredentials();
    console.log(`[Payrexx credentials] instanceRaw=${PAYREXX_INSTANCE_RAW} instanceNormalized=${PAYREXX_INSTANCE}`);
    console.log(`[Payrexx credentials] valid=${credCheck.valid} — ${credCheck.detail}`);

    const payrexxApiUnavailable =
      !credCheck.valid && credCheck.detail.includes('API is not included in your license');
    const simulationMode = PAYREXX_TEST_MODE || payrexxApiUnavailable;

    if (!credCheck.valid) {
      console.error(`[Payrexx credentials] INVALID: ${credCheck.detail}`);
      if (!simulationMode) {
        return new Response(
          JSON.stringify({
            error: `Payrexx-Konfiguration ungültig: ${credCheck.detail}`,
            success: false,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      console.warn('[Payrexx credentials] Simulation mode active — continuing despite invalid credentials');
    }

    // --- Step 1: Authenticate user ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email;
    if (!userEmail) {
      return errorResponse('User email not found', 400);
    }

    // --- Step 2: Parse & validate request ---
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

    // --- Step 3: Create Payrexx Gateway ---
    const primaryParams: Record<string, string> = {
      amount: amount.toString(),
      currency: 'CHF',
      purpose: planName,
      referenceId: referenceId,
      successRedirectUrl: successUrl,
      failedRedirectUrl: cancelUrl,
      cancelRedirectUrl: cancelUrl,
      'fields[email][value]': userEmail,
      'fields[email][mandatory]': '1',
      vatRate: '8.1',
      sku: `BUEZE_${planType.toUpperCase()}`,
    };

    const fallbackParams: Record<string, string> = {
      amount: amount.toString(),
      currency: 'CHF',
      purpose: planName,
      referenceId: referenceId,
      successRedirectUrl: successUrl,
      failedRedirectUrl: cancelUrl,
      cancelRedirectUrl: cancelUrl,
    };

    const payrexxUrl = `https://api.payrexx.com/v1.0/Gateway/?instance=${encodeURIComponent(PAYREXX_INSTANCE)}`;

    const createGatewayRequest = async (params: Record<string, string>, mode: 'primary' | 'fallback') => {
      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const signature = await generateSignature(formData.toString(), PAYREXX_API_KEY);
      formData.append('ApiSignature', signature);

      const requestBody = formData.toString();
      console.log(`Creating Payrexx gateway [${mode}] for user ${userId}, plan ${planType}, amount ${amount}`);
      console.log(`Payrexx request body [${mode}] (first 500 chars): ${requestBody.substring(0, 500)}`);

      const payrexxResponse = await fetch(payrexxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      const responseText = await payrexxResponse.text();
      const contentType = payrexxResponse.headers.get('content-type') || '';

      console.log(`Payrexx response [${mode}] status: ${payrexxResponse.status}, content-type: ${contentType}`);
      console.log(`Payrexx response [${mode}] body (first 500 chars): ${responseText.substring(0, 500)}`);

      let parsed: any = null;
      try { parsed = JSON.parse(responseText); } catch { parsed = null; }

      return { status: payrexxResponse.status, data: parsed, raw: responseText };
    };

    // First attempt with full payload
    let payrexxResult = await createGatewayRequest(primaryParams, 'primary');

    // If 422, retry with minimal payload
    if (
      payrexxResult.status === 422 &&
      (payrexxResult.data?.status !== 'success' || !payrexxResult.data?.data?.[0]?.link)
    ) {
      console.warn('Payrexx returned 422 for primary payload. Retrying with minimal payload.');
      payrexxResult = await createGatewayRequest(fallbackParams, 'fallback');
    }

    // --- Step 4: Handle Payrexx response ---
    if (!payrexxResult.data) {
      if (simulationMode) {
        console.warn('PAYREXX_TEST_MODE: JSON parse failed, returning successUrl as test fallback');
        return successResponse({
          url: successUrl,
          gatewayId: `test-${Date.now()}`,
          referenceId: referenceId,
          testMode: true,
        });
      }

      return new Response(
        JSON.stringify({
          error: `Payrexx API hat ein unerwartetes Format zurückgegeben (${payrexxResult.status}). Bitte kontaktieren Sie den Support.`,
          success: false,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (payrexxResult.data.status !== 'success' || !payrexxResult.data.data?.[0]?.link) {
      console.error('Payrexx API error:', JSON.stringify(payrexxResult.data));

      if (simulationMode) {
        console.warn('PAYREXX_TEST_MODE: API returned error, returning successUrl as test fallback');
        return successResponse({
          url: successUrl,
          gatewayId: `test-${Date.now()}`,
          referenceId: referenceId,
          testMode: true,
        });
      }

      const apiMessage = payrexxResult.data.message || 'Gateway-Erstellung fehlgeschlagen';
      const upstreamStatus = payrexxResult.status >= 400 && payrexxResult.status < 500
        ? payrexxResult.status
        : 502;

      return new Response(
        JSON.stringify({ error: apiMessage, success: false }),
        {
          status: upstreamStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const gatewayLink = payrexxResult.data.data[0].link;
    const gatewayId = payrexxResult.data.data[0].id;

    console.log(`Created Payrexx gateway ${gatewayId} for user ${userId}, plan ${planType}`);

    return successResponse({
      url: gatewayLink,
      gatewayId: gatewayId,
      referenceId: referenceId,
    });

  } catch (error) {
    const msg = getErrorMessage(error);
    console.error(`Fatal error in create-payrexx-gateway: ${msg}`);
    return new Response(
      JSON.stringify({ error: msg, success: false }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
