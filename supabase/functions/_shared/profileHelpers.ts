// Shared profile fetching helpers for Edge Functions
// SSOT for profile data retrieval patterns

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRONTEND_URL } from './siteConfig.ts';

export interface ClientProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
}

export interface HandwerkerProfile {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  website: string | null;
  businessCity: string | null;
  businessZip: string | null;
  businessAddress: string | null;
  fullName: string;
}

/**
 * Fetch a client profile by user ID
 */
export async function fetchClientProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ClientProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn(`Could not fetch client profile for ${userId}: ${error.message}`);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    phone: data.phone,
  };
}

/**
 * Fetch a handwerker profile with email from both handwerker_profiles and profiles tables
 */
export async function fetchHandwerkerProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<HandwerkerProfile | null> {
  // First fetch from handwerker_profiles
  const { data: hwProfile, error: hwError } = await supabase
    .from('handwerker_profiles')
    .select('user_id, first_name, last_name, company_name, phone_number, website, business_city, business_zip, business_address, email')
    .eq('user_id', userId)
    .single();

  if (hwError) {
    console.warn(`Could not fetch handwerker profile for ${userId}: ${hwError.message}`);
    return null;
  }

  // Fetch email from profiles table if not in handwerker_profiles
  let email = hwProfile.email;
  let phone = hwProfile.phone_number;

  if (!email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone')
      .eq('id', userId)
      .single();

    if (profile) {
      email = profile.email;
      if (!phone) {
        phone = profile.phone;
      }
    }
  }

  const fullName = hwProfile.first_name && hwProfile.last_name
    ? `${hwProfile.first_name} ${hwProfile.last_name}`
    : hwProfile.company_name || 'Handwerker';

  return {
    userId: hwProfile.user_id,
    email,
    firstName: hwProfile.first_name,
    lastName: hwProfile.last_name,
    companyName: hwProfile.company_name,
    phone,
    website: hwProfile.website,
    businessCity: hwProfile.business_city,
    businessZip: hwProfile.business_zip,
    businessAddress: hwProfile.business_address,
    fullName,
  };
}

/**
 * Fetch handwerker rating stats
 */
export async function fetchHandwerkerRating(
  supabase: SupabaseClient,
  userId: string
): Promise<{ averageRating: number | null; reviewCount: number }> {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_id', userId)
    .eq('is_public', true);

  if (error || !reviews || reviews.length === 0) {
    return { averageRating: null, reviewCount: 0 };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    averageRating: sum / reviews.length,
    reviewCount: reviews.length,
  };
}

/**
 * Generate a magic token and store it in the database
 */
export async function createMagicToken(
  supabase: SupabaseClient,
  options: {
    userId?: string;
    resourceType: string;
    resourceId?: string;
    expiryDays?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<{ token: string; magicLink: string } | null> {
  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (options.expiryDays || 7));

  const { error } = await supabase.from('magic_tokens').insert({
    token,
    user_id: options.userId,
    resource_type: options.resourceType,
    resource_id: options.resourceId,
    expires_at: expiresAt.toISOString(),
    metadata: options.metadata,
  });

  if (error) {
    console.error(`Failed to create magic token: ${error.message}`);
    return null;
  }

  let magicLink = '';
  switch (options.resourceType) {
    case 'lead':
      magicLink = `${FRONTEND_URL}/opportunity/${options.resourceId}?token=${token}`;
      break;
    case 'proposal':
      magicLink = `${FRONTEND_URL}/dashboard?proposalId=${options.resourceId}&token=${token}`;
      break;
    case 'dashboard':
      magicLink = `${FRONTEND_URL}/dashboard?token=${token}`;
      break;
    case 'conversation':
      // Deep-link directly to the specific conversation
      magicLink = `${FRONTEND_URL}/messages/${options.resourceId}?token=${token}`;
      break;
    case 'rating':
      magicLink = `${FRONTEND_URL}/dashboard?rating=${options.resourceId}&token=${token}`;
      break;
    default:
      magicLink = `${FRONTEND_URL}/?token=${token}`;
  }

  return { token, magicLink };
}
