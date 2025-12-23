import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { handwerkerWelcomeTemplate } from '../_shared/emailTemplates.ts';

interface RegistrationRequest {
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  personalAddress?: string;
  personalZip?: string;
  personalCity?: string;
  personalCanton?: string;
  
  // Company
  companyName: string;
  companyLegalForm?: string;
  uidNumber?: string;
  mwstNumber?: string;
  
  // Business Address
  businessAddress?: string;
  businessZip?: string;
  businessCity?: string;
  businessCanton?: string;
  
  // Banking
  iban?: string;
  bankName?: string;
  
  // Insurance
  liabilityInsuranceProvider?: string;
  policyNumber?: string;
  tradeLicenseNumber?: string;
  insuranceValidUntil?: string;
  
  // Service
  bio?: string;
  categories: string[];
  serviceAreas: string[];
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  
  // Files
  verificationDocuments?: string[];
  logoUrl?: string;
}

function generateSecurePassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const data: RegistrationRequest = await req.json();
    
    console.log('=== HANDWERKER SELF-REGISTRATION START ===');
    console.log('Email:', data.email);
    console.log('Company:', data.companyName);
    
    // Validate required fields
    if (!data.email || !data.firstName || !data.lastName || !data.companyName) {
      throw new Error('Pflichtfelder fehlen: E-Mail, Vorname, Nachname und Firmenname sind erforderlich');
    }
    
    // Normalize email
    const email = data.email.toLowerCase().trim();
    
    const supabase = createSupabaseAdmin();

    // 1. Check if email already exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email);
    
    if (emailExists) {
      console.log('Email already exists in auth.users');
      throw new Error('Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.');
    }

    // 2. Check if email already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (existingProfile) {
      console.log('Email already exists in profiles');
      throw new Error('Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.');
    }

    // 3. Check if email already exists in handwerker_profiles
    const { data: existingHandwerker } = await supabase
      .from('handwerker_profiles')
      .select('id, user_id')
      .eq('email', email)
      .maybeSingle();
    
    if (existingHandwerker) {
      console.log('Email already exists in handwerker_profiles');
      if (existingHandwerker.user_id) {
        throw new Error('Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.');
      }
      // Profile exists without user - this is a pending registration, allow to proceed
      console.log('Found pending registration without user_id, will update existing profile');
    }

    // 4. Generate secure password
    const password = generateSecurePassword(14);
    console.log('Generated secure password');

    // 5. Create auth user with auto-confirmation
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm - no email verification needed
      user_metadata: {
        full_name: `${data.firstName} ${data.lastName}`,
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'handwerker',
        phone: data.phoneNumber || '',
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      
      if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
        throw new Error('Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.');
      }
      
      throw new Error(`Konto konnte nicht erstellt werden: ${authError.message}`);
    }

    console.log('Auth user created:', authUser.user.id);
    const userId = authUser.user.id;

    // 6. Create or update handwerker_profile
    const profileData = {
      user_id: userId,
      first_name: data.firstName?.trim() || null,
      last_name: data.lastName?.trim() || null,
      email: email,
      phone_number: data.phoneNumber?.trim() || null,
      personal_address: data.personalAddress?.trim() || null,
      personal_zip: data.personalZip?.trim() || null,
      personal_city: data.personalCity?.trim() || null,
      personal_canton: data.personalCanton?.trim() || null,
      company_name: data.companyName?.trim() || null,
      company_legal_form: data.companyLegalForm?.trim() || null,
      uid_number: data.uidNumber?.trim() || null,
      mwst_number: data.mwstNumber?.trim() || null,
      business_address: data.businessAddress?.trim() || null,
      business_zip: data.businessZip?.trim() || null,
      business_city: data.businessCity?.trim() || null,
      business_canton: data.businessCanton?.trim() || null,
      iban: data.iban?.trim()?.replace(/\s/g, '') || null,
      bank_name: data.bankName?.trim() || null,
      liability_insurance_provider: data.liabilityInsuranceProvider?.trim() || null,
      liability_insurance_policy_number: data.policyNumber?.trim() || null,
      trade_license_number: data.tradeLicenseNumber?.trim() || null,
      insurance_valid_until: data.insuranceValidUntil?.trim() || null,
      bio: data.bio?.trim() || null,
      categories: data.categories?.length > 0 ? data.categories : [],
      service_areas: data.serviceAreas?.length > 0 ? data.serviceAreas : [],
      hourly_rate_min: data.hourlyRateMin || null,
      hourly_rate_max: data.hourlyRateMax || null,
      verification_documents: data.verificationDocuments || [],
      logo_url: data.logoUrl || null,
      verification_status: 'pending',
      is_verified: false,
    };

    let profileId: string;

    if (existingHandwerker && !existingHandwerker.user_id) {
      // Update existing pending profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('handwerker_profiles')
        .update(profileData)
        .eq('id', existingHandwerker.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Profile update failed:', updateError);
        // Rollback: delete auth user
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Profil konnte nicht aktualisiert werden: ${updateError.message}`);
      }
      profileId = updatedProfile.id;
      console.log('Updated existing profile:', profileId);
    } else {
      // Create new profile
      const { data: newProfile, error: insertError } = await supabase
        .from('handwerker_profiles')
        .insert([profileData])
        .select('id')
        .single();

      if (insertError) {
        console.error('Profile insert failed:', insertError);
        // Rollback: delete auth user
        await supabase.auth.admin.deleteUser(userId);
        
        if (insertError.code === '23505') {
          throw new Error('Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.');
        }
        throw new Error(`Profil konnte nicht erstellt werden: ${insertError.message}`);
      }
      profileId = newProfile.id;
      console.log('Created new profile:', profileId);
    }

    // 7. Send welcome email with credentials (non-blocking)
    const emailHtml = handwerkerWelcomeTemplate({
      firstName: data.firstName,
      lastName: data.lastName,
      email: email,
      password: password,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: '🎉 Willkommen bei Büeze.ch - Ihre Zugangsdaten',
      htmlBody: emailHtml,
    });

    console.log('Welcome email result:', emailResult.success);

    // 8. Trigger admin notification (fire-and-forget)
    supabase.functions.invoke('send-admin-registration-notification', {
      body: { profileId }
    }).catch(err => {
      console.error('Admin notification failed (non-critical):', err);
    });

    // Create admin notification in DB
    await supabase.from('admin_notifications').insert({
      type: 'new_handwerker_registration',
      title: 'Neue Handwerker-Registrierung',
      message: `${data.firstName} ${data.lastName} (${data.companyName}) wartet auf Freigabe`,
      related_id: profileId,
      metadata: {
        handwerker_name: `${data.firstName} ${data.lastName}`,
        company_name: data.companyName,
        email: email,
      },
    });

    console.log('=== HANDWERKER SELF-REGISTRATION COMPLETE ===');

    return successResponse({
      success: true,
      userId: userId,
      profileId: profileId,
      message: 'Registrierung erfolgreich! Zugangsdaten wurden per E-Mail versandt.',
      emailSent: emailResult.success,
    });

  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'
    );
  }
});
