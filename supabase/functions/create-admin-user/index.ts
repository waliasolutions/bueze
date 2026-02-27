// Edge function to create users with roles - Admin only
// This allows admins to create users directly from the admin panel

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface CreateUserRequest {
  email: string;
  password?: string;
  fullName?: string;
  role: 'admin' | 'super_admin' | 'handwerker' | 'client' | 'user';
  sendCredentials?: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller has admin role
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .in('role', ['admin', 'super_admin']);

    if (roleError || !callerRoles || callerRoles.length === 0) {
      console.log('Unauthorized user creation attempt by:', caller.email);
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, fullName, role, sendCredentials = true } = body;

    // Validate required fields
    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Email and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate password if not provided
    const userPassword = password || generateSecurePassword();

    console.log(`Creating user: ${email} with role: ${role}`);

    // Create the auth user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: userPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || '',
        role: role,
      },
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;
    console.log(`Auth user created: ${newUserId}`);

    // The profile should be created by the database trigger, but let's ensure it exists
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', newUserId)
      .maybeSingle();

    if (!profile) {
      // Manually create profile if trigger didn't fire
      await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        email: email.toLowerCase().trim(),
        full_name: fullName || '',
      });
    } else if (fullName) {
      // Update full name if provided
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', newUserId);
    }

    // Check if role was set by trigger, otherwise set it
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', newUserId)
      .maybeSingle();

    if (!existingRole || existingRole.role !== role) {
      // Delete any existing role first
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', newUserId);

      // Insert the correct role
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUserId, role });

      if (roleInsertError) {
        console.error('Error setting user role:', roleInsertError);
      }
    }

    console.log(`User ${email} created successfully with role ${role}`);

    // Send credentials email if requested
    if (sendCredentials) {
      try {
        await supabaseAdmin.functions.invoke('send-handwerker-credentials', {
          body: {
            email: email.toLowerCase().trim(),
            password: userPassword,
            name: fullName || email,
            isNewUser: true,
          },
        });
        console.log(`Credentials email sent to ${email}`);
      } catch (emailError) {
        console.error('Error sending credentials email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        email: email.toLowerCase().trim(),
        role,
        password: sendCredentials ? undefined : userPassword, // Only return password if not sending email
        message: sendCredentials 
          ? `Benutzer erstellt. Zugangsdaten wurden an ${email} gesendet.`
          : `Benutzer erstellt. Passwort: ${userPassword}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-admin-user:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  // Ensure at least one of each required character type
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (!hasLower) password = 'a' + password.slice(1);
  if (!hasUpper) password = password.slice(0, 1) + 'A' + password.slice(2);
  if (!hasNumber) password = password.slice(0, 2) + '1' + password.slice(3);
  if (!hasSpecial) password = password.slice(0, 3) + '!' + password.slice(4);
  
  return password;
}
