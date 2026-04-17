// ONE-TIME JOB: Bulk password reset for 73 handwerker mass-imports created since 2026-04-13.
// This function requires no auth (verify_jwt = false in config.toml) but is gated by:
//   1. A hardcoded shared secret (ONESHOT_SECRET env var)
//   2. A hardcoded user-id allowlist (no client-supplied IDs)
// DELETE THIS FUNCTION after the one-time run completes.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const PASSWORD = 'A12345678';
const SHARED_SECRET = 'oneshot-2026-04-17-bueeze-bulk-reset';

// 73 user IDs (all neuregistrationen since Mo 2026-04-13, excluding info@alles-rein.ch + Stocker who logged in later)
const USER_IDS: string[] = [
  "61689840-f140-4426-b28d-c5ad134f7bd4","3a52b8b5-abdb-4368-88f8-1487b4e700f9","3cd1fbe9-d38b-44a5-8f8e-792abe938d0c","cdbfc6b3-a8d8-443c-8843-07569615d390","3b5554a2-116a-48d1-aac3-24324bff864b","ec52fa94-2543-4e3c-bd7e-3987c2db6dbf","b3f4c7e3-cbe2-4bfe-96ba-6782847efff3","266b1957-a35d-40de-a2de-ac173fee2922","a1525e65-fcc9-4536-a18a-fd1f4028da18","43dea791-b019-43d6-ba87-beef2dd03f6c","b9ed2ca6-eaa1-440b-ad37-7c41fa3f16f2","6de4abcc-d6ed-46f2-a5bc-bb49739af205","5daa9293-8d13-451a-ade0-9f133bc87c66","d0c6f1ec-6a11-4446-82d9-f9a3bb3e9ea3","fec43209-b0be-4ed3-a90c-846af36db35b","a4641c71-075e-4b9f-b16b-94c27405d21b","e1e411fe-7b5d-4931-ade4-a9001d252d37","b6fd12ab-73f8-4405-9241-324674b39ffe","9de44e77-b84e-4434-b204-82bc8fbc6cca","47fd270e-d510-4afb-b56c-333950d7a487","c11435ac-6ba3-4493-ae2f-1375b9fcbb85","eefc53e1-20cb-4200-96e8-b9befc13ad9c","bb7a8d0a-ca19-425a-a4be-fcfbb64be4d5","c215215e-1270-4bdc-94c7-a312aae2753d","d753703d-793a-4b42-b501-f2f8580c91ee","b9c41e15-92dc-439c-be39-4213379061f2","e9b2e02d-3dd4-4cdd-9964-cadd03cd4235","43dae64c-3285-4169-8895-0bc9494ee655","59d3f0b5-6638-4875-b27c-19ebf42ffb1b","96e57d56-e466-4cca-98d8-241b49b924a0","ae824d14-f2e5-47a5-a973-b13e990a3291","e60c0f11-fbc7-447a-8fe5-6dbc9b46715c","96176cf7-5937-4471-8867-d8d241c97347","c38da683-0f96-4646-8551-9084a500df3e","0d161706-1e37-4f6d-8343-efb2a1fa19d6","af8e5899-0c06-487e-85ac-79c87a876bb6","3b904bb8-e0f1-4883-9402-c9334ca130b4","d8f3a099-74ef-41cd-90a3-1b61e8073e48","77a521c3-e5d6-4192-9278-cbc011af71ec","309c119b-4da0-45de-b79a-e6e7f39b2aab","13b0c6df-7406-4667-b0f1-0836dfb3cbcf","5c71ec87-c693-4f07-b8db-f7ea363d90bc","7f7cbd70-85fe-4b79-9fd0-77d1b344679a","72aed357-c478-4c49-bdb9-8bc0b652bada","ae969f94-6e66-495c-accd-7969a7571313","6fe3f7f6-3174-4308-8648-fd9c8bbb8d50","5d596ff3-6a76-478e-8894-2295bf458faf","14a92a3a-d207-4100-a994-605f136bc37a","3c160cec-b9ae-45db-b616-dffcf1a57b89","b3c82459-8606-496b-af7c-4fcb96c60936","6162a9bf-0c63-4639-bbe3-3c4f206efc3f","6a283082-cd73-4952-b890-d6904fca1a13","80272918-9d36-4302-a345-96def8f5efb6","aed55583-3752-4926-8ce9-c1c8a84cf0e3","b8675863-6d91-4815-b8ac-0c530cefeb10","f915dc76-670e-4857-8f60-0384ab141696","21cb2b1a-af59-4e15-ae7c-f17c363e6678","19f178de-78fd-48a4-8a92-8c4b1f3999e4","e544cd62-5a7c-411f-a4c8-5794ce2bdec8","6641c3c5-400c-4b14-93a2-3f0f8ce9b31b","a801ae22-17c7-48f2-817e-ee0384eea9ad","f529a1fe-ba04-43dd-a39d-8c805f3eac21","bca01510-20d5-462b-a392-40342572217d","7348c588-48c3-4ae4-93cd-5bb1ff558849","77421b73-7494-4ed0-b67f-7776abfffe59","94c259d8-b324-4084-9a37-f0293f17e394","fe126708-e5f0-4a82-b155-853ce44d3214","8215641c-8116-427d-8266-412abac3e826","2cacf4c3-4f41-445c-a7e4-d1833abeb445","3eb93ec5-5403-4a5b-86ed-1af32c2030b1","bbe34a54-6f0a-49c1-806a-0ec6dfd21239","cc44a331-210e-46b2-87d3-61aaec4f3c7f","97c79f49-6353-417e-944e-216d43889a37"
];

interface UserResult {
  userId: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  status: 'success' | 'failed';
  error?: string;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  // Shared-secret gate
  const secret = req.headers.get('x-oneshot-secret');
  if (secret !== SHARED_SECRET) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);
  const anon = createClient(supabaseUrl, anonKey);

  console.log(`[oneshot] Starting bulk reset for ${USER_IDS.length} users`);
  const results: UserResult[] = [];

  for (const uid of USER_IDS) {
    let email = '(unknown)';
    let full_name: string | null = null;
    let company_name: string | null = null;
    try {
      // Fetch metadata
      const { data: userData, error: getErr } = await admin.auth.admin.getUserById(uid);
      if (getErr || !userData?.user) {
        results.push({ userId: uid, email, full_name, company_name, status: 'failed', error: getErr?.message ?? 'getUserById returned no user' });
        continue;
      }
      email = userData.user.email ?? '(no email)';

      const { data: prof } = await admin.from('profiles').select('full_name').eq('id', uid).maybeSingle();
      full_name = (prof?.full_name as string) ?? null;
      const { data: hp } = await admin.from('handwerker_profiles').select('company_name').eq('user_id', uid).maybeSingle();
      company_name = (hp?.company_name as string) ?? null;

      // Snapshot
      const { error: backupError } = await admin.rpc('snapshot_user_password', { p_user_id: uid });
      if (backupError) {
        results.push({ userId: uid, email, full_name, company_name, status: 'failed', error: `Snapshot failed: ${backupError.message}` });
        continue;
      }

      // Update password
      const { error: updErr } = await admin.auth.admin.updateUserById(uid, { password: PASSWORD });
      if (updErr) {
        results.push({ userId: uid, email, full_name, company_name, status: 'failed', error: `Update failed: ${updErr.message}` });
        continue;
      }

      // Verify: re-query updated_at and try signInWithPassword
      const { data: refreshed } = await admin.auth.admin.getUserById(uid);
      const u = refreshed?.user;
      if (!u) {
        results.push({ userId: uid, email, full_name, company_name, status: 'failed', error: 'Could not re-fetch user' });
        continue;
      }
      const created = new Date(u.created_at).getTime();
      const updated = new Date(u.updated_at ?? u.created_at).getTime();
      if (updated <= created) {
        results.push({ userId: uid, email, full_name, company_name, status: 'failed', error: 'updated_at did not advance' });
        continue;
      }

      const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
      if (signInError || !signIn?.session) {
        results.push({ userId: uid, email, full_name, company_name, status: 'failed', error: `signIn verify failed: ${signInError?.message || 'no session'}` });
        continue;
      }
      await anon.auth.signOut();

      results.push({ userId: uid, email, full_name, company_name, status: 'success' });
    } catch (e: any) {
      results.push({ userId: uid, email, full_name, company_name, status: 'failed', error: e?.message ?? String(e) });
    }
  }

  const succeeded = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');

  // Audit row
  try {
    await admin.from('admin_notifications').insert({
      type: 'bulk_password_reset',
      title: 'Bulk-Passwort-Reset (oneshot 2026-04-17)',
      message: `${succeeded.length} von ${USER_IDS.length} Usern erfolgreich resettet`,
      metadata: {
        triggered_by: 'oneshot-edge-function',
        password_set: 'A12345678',
        succeeded_user_ids: succeeded.map(r => r.userId),
        failed: failed.map(r => ({ userId: r.userId, email: r.email, error: r.error })),
        backup_table: 'password_reset_backup_2026_04_17',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e: any) {
    console.error(`[oneshot] Audit insert failed: ${e?.message}`);
  }

  console.log(`[oneshot] Done: ${succeeded.length} ok, ${failed.length} failed`);
  return new Response(
    JSON.stringify({
      success: true,
      total: USER_IDS.length,
      succeeded: succeeded.length,
      failed: failed.length,
      results,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
