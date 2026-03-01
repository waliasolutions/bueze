import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';

import { guestWelcomeTemplate } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

function generateSecurePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join('');
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { email, fullName } = await req.json();
    
    if (!email || !fullName) {
      throw new Error('Missing required fields: email and fullName');
    }

    const supabase = createSupabaseAdmin();

    // Check if user already exists - use efficient direct lookup instead of listing all users
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      console.log('User already exists:', email);
      return successResponse({ success: true, message: 'User already exists', created: false });
    }
    
    // Also check auth.users directly in case profile doesn't exist
    const { data: authList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authList?.users?.find(u => u.email === email);
    if (existingAuthUser) {
      console.log('Auth user already exists:', email);
      return successResponse({ success: true, message: 'User already exists', created: false });
    }

    const password = generateSecurePassword(16);

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log('User created successfully:', newUser.user.id);

    await supabase.from('user_roles').insert({ user_id: newUser.user.id, role: 'client' });

    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase.from('magic_tokens').insert({
      token,
      user_id: newUser.user.id,
      resource_type: 'dashboard',
      expires_at: expiresAt.toISOString(),
    });

    const magicLink = `${FRONTEND_URL}/dashboard?token=${token}&firstLogin=true`;

    const emailHtml = guestWelcomeTemplate({ email, password, fullName, magicLink });

    const result = await sendEmail({
      to: email,
      subject: 'Willkommen bei BÜEZE.CH - Ihr Zugang',
      htmlBody: emailHtml,
    });

    return successResponse({ 
      success: true, 
      message: 'Guest user created and welcome email sent',
      created: true,
      userId: newUser.user.id,
      emailSent: result.success,
    });
  } catch (error) {
    console.error('Error in guest-user-auto-create:', error);
    return errorResponse(error as Error);
  }
});
