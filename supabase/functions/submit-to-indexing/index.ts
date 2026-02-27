import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create JWT for Google API authentication
async function createGoogleJWT(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp,
  };

  // Base64url encode
  const base64urlEncode = (obj: object): string => {
    const json = JSON.stringify(obj);
    const base64 = btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerEncoded = base64urlEncode(header);
  const payloadEncoded = base64urlEncode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Import the private key and sign
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signatureInput}.${signatureBase64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    console.error('Token response:', tokenData);
    throw new Error('Failed to obtain access token: ' + JSON.stringify(tokenData));
  }

  return tokenData.access_token;
}

// Submit URL to Google Indexing API
async function submitUrlToGoogle(url: string, accessToken: string) {
  try {
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED',
      }),
    });

    const data = await response.json();
    
    return { 
      url, 
      status: response.status, 
      success: response.ok,
      response: data 
    };
  } catch (error) {
    console.error(`Error submitting ${url}:`, error);
    return { 
      url, 
      status: 500, 
      success: false,
      error: (error as Error).message 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new Error('No URLs provided');
    }

    console.log(`Submitting ${urls.length} URLs to Google Indexing API`);

    // Get service account credentials from secrets
    const clientEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');

    if (!clientEmail || !privateKey) {
      throw new Error('Google service account credentials not configured. Please add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY secrets.');
    }

    // Get access token
    const accessToken = await createGoogleJWT(clientEmail, privateKey);
    console.log('Successfully obtained Google access token');

    // Submit URLs (limit to 200 per day as per Google's quota)
    const urlsToSubmit = urls.slice(0, 200);
    
    // Submit in batches of 10 to avoid rate limiting
    const results = [];
    const batchSize = 10;
    
    for (let i = 0; i < urlsToSubmit.length; i += batchSize) {
      const batch = urlsToSubmit.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((url: string) => submitUrlToGoogle(url, accessToken))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < urlsToSubmit.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Indexing complete: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Submitted ${successCount} URLs successfully, ${failCount} failed`,
      totalSubmitted: urlsToSubmit.length,
      successCount,
      failCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in submit-to-indexing:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
