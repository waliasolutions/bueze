/**
 * Shared entity type definitions - Single Source of Truth
 * All components should import types from this file
 */

import type { Database } from '@/integrations/supabase/types';

// Database enum types
export type HandwerkerCategory = Database['public']['Enums']['handwerker_category'];
export type Canton = Database['public']['Enums']['canton'];
export type LeadStatus = Database['public']['Enums']['lead_status'];
export type ProposalStatus = Database['public']['Enums']['proposal_status'];
export type UrgencyLevel = Database['public']['Enums']['urgency_level'];
export type BudgetType = Database['public']['Enums']['budget_type'];
export type SubscriptionPlan = Database['public']['Enums']['subscription_plan'];
export type AppRole = Database['public']['Enums']['app_role'];

// =============================================================================
// Lead Entity
// =============================================================================
export interface Lead {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: HandwerkerCategory;
  zip: string;
  city: string;
  canton: Canton;
  address?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_type: BudgetType;
  urgency: UrgencyLevel;
  status: LeadStatus;
  media_urls?: string[] | null;
  lat?: number | null;
  lng?: number | null;
  proposals_count?: number | null;
  purchased_count?: number | null;
  max_purchases?: number | null;
  quality_score?: number | null;
  expires_at?: string | null;
  proposal_deadline?: string | null;
  accepted_proposal_id?: string | null;
  request_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Lead with joined owner profile
export interface LeadWithOwner extends Lead {
  owner?: {
    full_name?: string | null;
    email: string;
    phone?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
}

// =============================================================================
// Proposal Entity
// =============================================================================
export interface Proposal {
  id: string;
  lead_id: string;
  handwerker_id: string;
  price_min: number;
  price_max: number;
  message: string;
  estimated_duration_days?: number | null;
  status: ProposalStatus;
  attachments?: string[] | null;
  view_count?: number | null;
  client_viewed_at?: string | null;
  submitted_at: string;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Proposal with joined lead info
export interface ProposalWithLead extends Proposal {
  leads: {
    title: string;
    city: string;
    canton: Canton;
    owner_id?: string;
    description?: string;
    category?: HandwerkerCategory;
  };
}

// Proposal with client contact (for accepted proposals)
export interface ProposalWithClientContact extends ProposalWithLead {
  client_contact?: {
    full_name?: string | null;
    email: string;
    phone?: string | null;
  } | null;
}

// =============================================================================
// Handwerker Profile Entity
// =============================================================================
export interface HandwerkerProfile {
  id: string;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  company_name?: string | null;
  company_legal_form?: string | null;
  bio?: string | null;
  website?: string | null;
  logo_url?: string | null;
  categories: HandwerkerCategory[];
  service_areas: string[];
  languages?: string[] | null;
  hourly_rate_min?: number | null;
  hourly_rate_max?: number | null;
  response_time_hours?: number | null;
  // Business info
  business_address?: string | null;
  business_zip?: string | null;
  business_city?: string | null;
  business_canton?: string | null;
  // Personal info
  personal_address?: string | null;
  personal_zip?: string | null;
  personal_city?: string | null;
  personal_canton?: string | null;
  // Legal/Insurance
  uid_number?: string | null;
  mwst_number?: string | null;
  business_license?: string | null;
  trade_license_number?: string | null;
  tax_id?: string | null;
  iban?: string | null;
  bank_name?: string | null;
  liability_insurance_provider?: string | null;
  liability_insurance_policy_number?: string | null;
  insurance_valid_until?: string | null;
  // Verification
  is_verified?: boolean | null;
  verification_status?: string | null;
  verification_notes?: string | null;
  verification_documents?: string[] | null;
  verified_at?: string | null;
  verified_by?: string | null;
  portfolio_urls?: string[] | null;
  created_at: string;
  updated_at: string;
}

// Public handwerker profile (limited fields)
export interface HandwerkerProfilePublic {
  id: string;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  company_legal_form?: string | null;
  bio?: string | null;
  website?: string | null;
  logo_url?: string | null;
  categories?: HandwerkerCategory[] | null;
  service_areas?: string[] | null;
  languages?: string[] | null;
  hourly_rate_min?: number | null;
  hourly_rate_max?: number | null;
  response_time_hours?: number | null;
  business_zip?: string | null;
  business_city?: string | null;
  business_canton?: string | null;
  is_verified?: boolean | null;
  verification_status?: string | null;
  verified_at?: string | null;
  portfolio_urls?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// =============================================================================
// User Profile Entity
// =============================================================================
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  company_name?: string | null;
  address?: string | null;
  zip?: string | null;
  city?: string | null;
  canton?: Canton | null;
  languages?: string[] | null;
  date_of_birth?: string | null;
  hourly_rate?: number | null;
  verified_level?: number | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Review Entity - Single Source of Truth
// All components should import Review types from here
// =============================================================================
export interface Review {
  id: string;
  lead_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  handwerker_response?: string | null;
  response_at?: string | null;
  is_public?: boolean | null;
  created_at: string;
}

// Review with joined lead and profile data (for HandwerkerRating component)
export interface ReviewWithDetails extends Review {
  leads?: {
    title: string;
    category?: string;
  };
  profiles?: {
    first_name?: string | null;
    full_name?: string | null;
  };
  // Alternate join syntax used by some components
  reviewer?: {
    full_name?: string | null;
  } | null;
  lead?: {
    title: string;
    category?: string;
  } | null;
}

// Review for admin management (full details)
export interface ReviewForAdmin extends Review {
  reviewer?: { 
    full_name: string; 
    email: string; 
  };
  handwerker?: { 
    first_name: string; 
    last_name: string; 
    company_name: string | null; 
  };
  lead?: { 
    title: string; 
  };
}

// Review for handwerker response component
export interface ReviewForHandwerker extends Review {
  leads?: {
    title: string;
  };
  profiles?: {
    first_name: string | null;
    full_name: string | null;
  };
}

// =============================================================================
// Conversation & Message Entities
// =============================================================================
export interface Conversation {
  id: string;
  lead_id: string;
  homeowner_id: string;
  handwerker_id: string;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  lead: {
    title: string;
    description: string;
  };
  homeowner: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
  handwerker: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
}

export interface Message {
  id: string;
  conversation_id?: string | null;
  lead_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type?: string | null;
  attachments?: string[] | null;
  read_at?: string | null;
  created_at: string;
}

// =============================================================================
// Subscription Entity
// =============================================================================
export interface HandwerkerSubscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  proposals_limit: number;
  proposals_used_this_period: number;
  current_period_start: string;
  current_period_end: string;
  pending_plan?: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Rating Stats (View)
// =============================================================================
export interface HandwerkerRatingStats {
  user_id?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
}

// =============================================================================
// Extended Lead Types for UI Components
// =============================================================================

// Lead for browse/list views (all fields present from database query)
export interface LeadListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_type?: string;
  urgency: string;
  canton: string;
  zip: string;
  city: string;
  created_at: string;
  purchased_count: number | null;
  max_purchases: number | null;
  quality_score: number | null;
  status: string;
  proposals_count?: number | null;
  address?: string | null;
  owner_id?: string;
  accepted_proposal_id?: string | null;
  media_urls?: string[] | null;
  proposal_deadline?: string | null;
}

// Lead with owner contact info (for admin views)
export interface LeadWithOwnerContact extends LeadListItem {
  budget_type: string;
  media_urls: string[] | null;
  owner_name: string | null;
  owner_email: string;
  owner_phone: string | null;
}

// =============================================================================
// Extended Proposal Types for UI Components
// =============================================================================

// Proposal for handwerker's proposal list
export interface ProposalListItem {
  id: string;
  lead_id: string;
  handwerker_id?: string;
  price_min: number;
  price_max: number;
  estimated_duration_days: number | null;
  status: string;
  submitted_at: string;
  responded_at?: string | null;
  message: string;
  view_count?: number | null;
  client_viewed_at?: string | null;
  attachments?: string[] | null;
  leads: {
    title: string;
    category?: string;
    city?: string;
    canton?: string;
    status?: string;
    owner_id?: string;
    description?: string;
  };
}

// Proposal with handwerker info (for client views)
export interface ProposalWithHandwerkerInfo extends ProposalListItem {
  handwerker_profiles?: {
    business_city?: string | null;
    company_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    logo_url?: string | null;
  } | null;
}

// Proposal with client contact (for accepted proposals - handwerker view)
export interface ProposalWithClientInfo extends ProposalListItem {
  client_contact?: {
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

// Admin proposal view with flattened handwerker data
export interface AdminProposal {
  id: string;
  lead_id: string;
  handwerker_id: string;
  price_min: number;
  price_max: number;
  estimated_duration_days: number | null;
  message: string;
  status: string;
  submitted_at: string;
  responded_at: string | null;
  handwerker_first_name: string | null;
  handwerker_last_name: string | null;
  handwerker_company_name: string | null;
  handwerker_email: string | null;
  handwerker_phone: string | null;
  handwerker_city: string | null;
}

// =============================================================================
// Extended User Profile Types
// =============================================================================

// User profile for dropdowns/headers
export interface UserProfileBasic {
  id: string;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  role?: 'homeowner' | 'handwerker' | 'admin' | 'client' | 'user';
}

// Handwerker profile for dashboard
export interface HandwerkerProfileBasic {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  company_name: string | null;
  bio: string | null;
  categories: string[];
  service_areas: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  verification_status: string | null;
  is_verified?: boolean | null;
}
