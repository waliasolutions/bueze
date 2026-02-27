import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { handwerkerWelcomeTemplate } from '../_shared/emailTemplates.ts';

interface CreateAccountRequest {
  profileId: string;
  adminId: string | null;
}

function generateSecurePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { profileId, adminId }: CreateAccountRequest = await req.json();
    
    console.log('Creating account for profile:', profileId);
    
    const supabase = createSupabaseAdmin();

    // 1. Get handwerker profile data
    const { data: profile, error: fetchError } = await supabase
      .from('handwerker_profiles')
      .select('id, user_id, email, first_name, last_name, phone_number')
      .eq('id', profileId)
      .single();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      throw new Error(`Profile not found: ${fetchError.message}`);
    }
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    if (profile.user_id) {
      throw new Error('Account already exists for this profile');
    }

    console.log('Profile found:', { email: profile.email, name: `${profile.first_name} ${profile.last_name}` });

    // 2. Generate secure random password
    const password = generateSecurePassword(12);
    console.log('Generated secure password');

    // 3. Create auth.users account
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: profile.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: `${profile.first_name} ${profile.last_name}`,
        role: 'handwerker',
        phone: profile.phone_number,
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      // Create admin notification for auth creation failure
      await supabase.from('admin_notifications').insert({
        type: 'account_creation_failed',
        title: 'Konto-Erstellung fehlgeschlagen',
        message: `Auth-Benutzer für ${profile.email} konnte nicht erstellt werden: ${authError.message}`,
        related_id: profileId,
        metadata: { 
          profileId, 
          email: profile.email, 
          error: authError.message,
          adminId,
        },
      });
      
      throw new Error(`Auth-Konto konnte nicht erstellt werden: ${authError.message}`);
    }

    console.log('Auth user created:', authUser.user.id);

    // 4. Update handwerker_profiles with user_id
    const { error: updateError } = await supabase
      .from('handwerker_profiles')
      .update({
        user_id: authUser.user.id,
        is_verified: true,
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verified_by: adminId,
      })
      .eq('id', profileId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      
      // ROLLBACK: Delete the created auth user to prevent orphans
      console.log('Rolling back: deleting auth user', authUser.user.id);
      const { error: rollbackError } = await supabase.auth.admin.deleteUser(authUser.user.id);
      
      if (rollbackError) {
        console.error('CRITICAL: Rollback failed, orphaned auth user:', authUser.user.id);
        
        // Create critical admin notification
        await supabase.from('admin_notifications').insert({
          type: 'account_creation_critical',
          title: 'KRITISCH: Verwaister Auth-Benutzer',
          message: `Auth-Benutzer ${authUser.user.id} (${profile.email}) wurde erstellt, aber Profil-Update fehlgeschlagen. Rollback fehlgeschlagen. Manuelle Bereinigung erforderlich.`,
          related_id: profileId,
          metadata: { 
            profileId, 
            email: profile.email, 
            userId: authUser.user.id,
            updateError: updateError.message,
            rollbackError: rollbackError.message,
          },
        });
      } else {
        console.log('Rollback successful: auth user deleted');
        
        // Create admin notification for failed account creation
        await supabase.from('admin_notifications').insert({
          type: 'account_creation_failed',
          title: 'Konto-Erstellung fehlgeschlagen (Rollback erfolgreich)',
          message: `Profil-Update für ${profile.email} fehlgeschlagen. Auth-Benutzer wurde zurückgerollt. Bitte erneut versuchen.`,
          related_id: profileId,
          metadata: { 
            profileId, 
            email: profile.email, 
            error: updateError.message,
          },
        });
      }
      
      throw new Error(`Profil konnte nicht aktualisiert werden: ${updateError.message}`);
    }

    console.log('Profile updated with user_id');

    // Note: user_roles entry is automatically created by handle_new_user() trigger

    // 5. Send welcome email with credentials using shared utility
    const emailHtml = handwerkerWelcomeTemplate({
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      password: password,
    });

    const emailResult = await sendEmail({
      to: profile.email,
      subject: '🎉 Ihr Büeze.ch Account ist aktiv!',
      htmlBody: emailHtml,
    });

    console.log('Welcome email sent:', emailResult.success);

    // Create admin notification if email failed (non-blocking)
    if (!emailResult.success) {
      await supabase.from('admin_notifications').insert({
        type: 'email_send_failed',
        title: 'Willkommens-E-Mail nicht gesendet',
        message: `Willkommens-E-Mail an ${profile.email} konnte nicht gesendet werden. Konto wurde trotzdem erstellt.`,
        related_id: profileId,
        metadata: { 
          profileId, 
          email: profile.email, 
          userId: authUser.user.id,
          emailError: emailResult.error,
        },
      });
    }

    return successResponse({ 
      success: true,
      userId: authUser.user.id,
      message: 'Konto erfolgreich erstellt und Willkommens-E-Mail gesendet',
      emailSent: emailResult.success,
    });

  } catch (error) {
    console.error('Error in create-handwerker-account:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unbekannter Fehler');
  }
});
