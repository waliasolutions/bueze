import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { guestWelcomeTemplate } from '../_shared/emailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate secure random password
function generateSecurePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName } = await req.json();
    
    if (!email || !fullName) {
      throw new Error('Missing required fields: email and fullName');
    }

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users.some(u => u.email === email);

    if (userExists) {
      console.log('User already exists:', email);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User already exists',
          created: false,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Generate secure password
    const password = generateSecurePassword(16);

    // Create user account
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log('User created successfully:', newUser.user.id);

    // Assign client role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'client',
      });

    if (roleError) {
      console.error('Failed to assign role:', roleError);
    }

    // Generate magic token for first login
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const { error: tokenError } = await supabase
      .from('magic_tokens')
      .insert({
        token,
        user_id: newUser.user.id,
        resource_type: 'dashboard',
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Failed to create magic token:', tokenError);
    }

    const magicLink = `https://bueze.ch/dashboard?token=${token}&firstLogin=true`;

    // Send welcome email
    const emailHtml = guestWelcomeTemplate({
      email,
      password,
      fullName,
      magicLink,
    });

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueze.ch',
        to: [email],
        subject: 'Willkommen bei BÜEZE.CH - Ihr Zugang',
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Email sending failed:', emailData);
    } else {
      console.log('Welcome email sent successfully to:', email);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Guest user created and welcome email sent',
        created: true,
        userId: newUser.user.id,
        emailSent: emailResponse.ok,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in guest-user-auto-create:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
