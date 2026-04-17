import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';
import { PASSWORD_MIN_LENGTH, ONBOARDING_GRACE_PERIOD_MINUTES } from '../_shared/constants.ts';

// Generate a secure random password
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(x => charset[x % charset.length])
    .join('');
}

// Strip the password value from any string so it never leaks to logs/responses
function sanitize(text: string, secret: string): string {
  if (!text || !secret) return text;
  return text.split(secret).join('***');
}

interface UserResult {
  userId: string;
  email: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  reason?: string;
}

// Verify password update persisted: updated_at moved AND signInWithPassword works
async function verifyPasswordReset(
  adminClient: ReturnType<typeof createClient>,
  anonClient: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  // 1. Re-query updated_at vs created_at
  const { data: refreshed, error: refreshError } = await adminClient.auth.admin.getUserById(userId);
  if (refreshError || !refreshed?.user) {
    return { ok: false, error: `Could not re-fetch user: ${refreshError?.message || 'no data'}` };
  }
  const u = refreshed.user;
  const created = new Date(u.created_at).getTime();
  const updated = new Date(u.updated_at ?? u.created_at).getTime();
  if (updated <= created) {
    return { ok: false, error: 'updated_at did not advance past created_at after password update' };
  }

  // 2. Try to actually sign in with the new password
  const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signIn?.session) {
    return { ok: false, error: `signInWithPassword failed: ${signInError?.message || 'no session'}` };
  }
  // Clean up the test session immediately
  await anonClient.auth.signOut();
  return { ok: true };
}

// Re-detect candidates at execution time to drop users who logged in / changed password since dry-run
async function getStillStuckCandidates(
  adminClient: ReturnType<typeof createClient>,
  approvedIds: string[]
): Promise<Set<string>> {
  if (approvedIds.length === 0) return new Set();
  // Fetch all users (admin API paginates, default 50/page; we filter by id locally)
  const stuck = new Set<string>();
  const approvedSet = new Set(approvedIds);
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    if (!data?.users || data.users.length === 0) break;
    for (const u of data.users) {
      if (!approvedSet.has(u.id)) continue;
      if (u.last_sign_in_at) continue; // logged in since → drop
      const created = new Date(u.created_at).getTime();
      const updated = new Date(u.updated_at ?? u.created_at).getTime();
      const deltaMin = (updated - created) / 1000 / 60;
      if (deltaMin > ONBOARDING_GRACE_PERIOD_MINUTES) continue; // password changed since → drop
      if (u.banned_until || (u as any).deleted_at) continue;
      stuck.add(u.id);
    }
    if (data.users.length < perPage) break;
    page++;
  }
  return stuck;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  // Read raw body once so sanitizer can scrub error messages
  let bodyText = '';
  let body: any = {};
  try {
    bodyText = await req.text();
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const customPassword: string | undefined = body.customPassword;
  const userIds: string[] | undefined = Array.isArray(body.userIds) ? body.userIds : undefined;
  const userId: string | undefined = body.userId;
  const userEmail: string | undefined = body.userEmail;
  const userName: string | undefined = body.userName;
  const notifyUsers: boolean = body.notifyUsers !== false; // default true for single-auto
  const skipReDetection: boolean = body.skipReDetection === true; // bulk-custom: trust caller's userIds, no re-filtering

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // === Admin gate ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !requestingUser) throw new Error('Unauthorized');

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();
    if (roleError || !roleData) throw new Error('Unauthorized: Admin access required');

    // === Validate custom password if provided ===
    if (customPassword !== undefined) {
      if (typeof customPassword !== 'string' || customPassword.length < PASSWORD_MIN_LENGTH) {
        return new Response(
          JSON.stringify({ error: `customPassword must be at least ${PASSWORD_MIN_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ============================================================
    // MODE: bulk-custom
    // ============================================================
    if (userIds && userIds.length > 0) {
      if (!customPassword) {
        return new Response(
          JSON.stringify({ error: 'bulk-custom mode requires customPassword' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[bulk] Admin ${requestingUser.email} requesting bulk reset for ${userIds.length} users`);

      // --- Idempotency safeguard: re-detect candidates ---
      const stillStuck = await getStillStuckCandidates(supabase, userIds);
      const skippedIds = userIds.filter((id) => !stillStuck.has(id));
      const toReset = userIds.filter((id) => stillStuck.has(id));
      console.log(`[bulk] After re-detection: ${toReset.length} to reset, ${skippedIds.length} skipped`);

      const results: UserResult[] = [];
      const anonClient = createClient(supabaseUrl, supabaseAnonKey);

      // Add skipped entries
      for (const sid of skippedIds) {
        const { data: pf } = await supabase.from('profiles').select('email').eq('id', sid).maybeSingle();
        results.push({
          userId: sid,
          email: pf?.email ?? '(unknown)',
          status: 'skipped',
          reason: 'No longer matches stuck criteria (logged in or password changed since dry-run)',
        });
      }

      // --- Pre-flight policy probe on first candidate (snapshot FIRST, then probe) ---
      if (toReset.length > 0) {
        const probeId = toReset[0];

        // Snapshot the probe user BEFORE the probe overwrites their hash
        const { error: probeBackupError } = await supabase.rpc('snapshot_user_password', {
          p_user_id: probeId,
        });
        if (probeBackupError) {
          console.error(`[bulk] Probe snapshot failed: ${probeBackupError.message}`);
          return new Response(
            JSON.stringify({
              error: `Pre-flight backup snapshot failed — aborting batch. Error: ${probeBackupError.message}`,
              probedUserId: probeId,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: probeError } = await supabase.auth.admin.updateUserById(probeId, {
          password: customPassword,
        });
        if (probeError) {
          const safeMsg = sanitize(probeError.message, customPassword);
          console.error(`[bulk] Policy probe failed: ${safeMsg}`);
          return new Response(
            JSON.stringify({
              error: `Pre-flight policy probe failed — aborting batch. Check Supabase Auth password policy. Error: ${safeMsg}`,
              probedUserId: probeId,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Probe succeeded → continue into the main loop, which will verify the probe user
      }

      // --- Per-user loop ---
      for (const uid of toReset) {
        try {
          // Fetch user metadata
          const { data: userData, error: getErr } = await supabase.auth.admin.getUserById(uid);
          if (getErr || !userData?.user) {
            results.push({ userId: uid, email: '(unknown)', status: 'failed', error: getErr?.message ?? 'getUserById returned no user' });
            continue;
          }
          const email = userData.user.email ?? '(no email)';

          const isProbeUser = uid === toReset[0];

          // 1. Snapshot to backup table BEFORE any mutation (probe user already snapshotted above)
          if (!isProbeUser) {
            const { error: backupError } = await supabase.rpc('snapshot_user_password', {
              p_user_id: uid,
            });
            if (backupError) {
              results.push({
                userId: uid,
                email,
                status: 'failed',
                error: `Backup snapshot failed: ${backupError.message}`,
              });
              continue;
            }
          }

          // 2. Update password (probe user already done above)
          if (!isProbeUser) {
            const { error: updErr } = await supabase.auth.admin.updateUserById(uid, {
              password: customPassword,
            });
            if (updErr) {
              const safe = sanitize(updErr.message, customPassword);
              results.push({ userId: uid, email, status: 'failed', error: safe });
              continue;
            }
          }

          // 3. Verify
          const verify = await verifyPasswordReset(supabase, anonClient, uid, email, customPassword);
          if (!verify.ok) {
            results.push({ userId: uid, email, status: 'failed', error: sanitize(verify.error, customPassword) });
            continue;
          }

          results.push({ userId: uid, email, status: 'success' });
        } catch (e: any) {
          results.push({
            userId: uid,
            email: '(unknown)',
            status: 'failed',
            error: sanitize(e?.message ?? String(e), customPassword),
          });
        }
      }

      // --- Audit row ---
      const successIds = results.filter((r) => r.status === 'success').map((r) => r.userId);
      const failedResults = results.filter((r) => r.status === 'failed');
      try {
        await supabase.from('admin_notifications').insert({
          type: 'bulk_password_reset',
          title: 'Bulk-Passwort-Reset ausgeführt',
          message: `${successIds.length} von ${userIds.length} Usern erfolgreich zurückgesetzt`,
          related_id: requestingUser.id,
          metadata: {
            triggered_by: requestingUser.id,
            triggered_by_email: requestingUser.email,
            requested_user_ids: userIds,
            actually_reset_user_ids: successIds,
            skipped_user_ids: skippedIds,
            failed: failedResults.map((r) => ({ userId: r.userId, error: r.error })),
            backup_table: 'password_reset_backup_2026_04_17',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (auditErr: any) {
        console.error(`[bulk] Audit insert failed: ${auditErr?.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'bulk-custom',
          summary: {
            requested: userIds.length,
            attempted: toReset.length,
            succeeded: successIds.length,
            failed: failedResults.length,
            skipped: skippedIds.length,
          },
          results,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // MODE: single-auto OR single-custom
    // ============================================================
    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId and userEmail (or use bulk mode with userIds[])' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const passwordToSet = customPassword ?? generateSecurePassword(16);
    const isCustom = !!customPassword;

    console.log(`Admin ${requestingUser.email} requesting password reset for user ${userEmail} (mode: ${isCustom ? 'single-custom' : 'single-auto'})`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: passwordToSet,
    });

    if (updateError) {
      const safe = sanitize(updateError.message, passwordToSet);
      console.error('Error updating password:', safe);
      throw new Error(`Failed to update password: ${safe}`);
    }

    // Verify
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const verify = await verifyPasswordReset(supabase, anonClient, userId, userEmail, passwordToSet);
    if (!verify.ok) {
      const safe = sanitize(verify.error, passwordToSet);
      throw new Error(`Password update did not verify: ${safe}`);
    }

    console.log(`Password successfully reset and verified for user ${userEmail}`);

    // Send email only in single-auto mode (admin-typed password is communicated out-of-band)
    if (!isCustom && notifyUsers) {
      const emailResult = await sendEmail({
        to: userEmail,
        subject: 'Ihr Passwort wurde zurückgesetzt - Büeze.ch',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin: 0;">Büeze.ch</h1>
            </div>
            <h2 style="color: #1a1a1a;">Passwort zurückgesetzt</h2>
            <p style="color: #333; line-height: 1.6;">Hallo ${userName || 'Benutzer'},</p>
            <p style="color: #333; line-height: 1.6;">Ihr Passwort wurde von einem Administrator zurückgesetzt.</p>
            <p style="color: #333; line-height: 1.6;"><strong>Ihre neuen Anmeldedaten:</strong></p>
            <ul style="color: #333; line-height: 1.8;">
              <li>E-Mail: ${userEmail}</li>
              <li>Neues Passwort: <code style="background: #f4f4f4; padding: 2px 6px; border-radius: 3px;">${passwordToSet}</code></li>
            </ul>
            <p style="color: #333; line-height: 1.6;">Bitte ändern Sie Ihr Passwort nach der Anmeldung.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/auth" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Jetzt anmelden</a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Mit freundlichen Grüssen,<br>Ihr Büeze.ch Team
            </p>
          </div>
        `,
      });

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
      } else {
        console.log('Password reset email sent successfully via SMTP2GO');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: isCustom ? 'single-custom' : 'single-auto',
        verified: true,
        message: isCustom
          ? 'Password reset and verified. No email sent (custom password mode).'
          : 'Password reset and verified. Das neue Passwort wurde per E-Mail gesendet.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const rawMsg = error?.message ?? String(error);
    const safeMsg = customPassword ? sanitize(rawMsg, customPassword) : rawMsg;
    console.error('Error in reset-user-password function:', safeMsg);
    return new Response(
      JSON.stringify({ error: safeMsg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
