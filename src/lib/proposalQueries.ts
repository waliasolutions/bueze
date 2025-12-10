/**
 * Proposal Query Helpers - Single Source of Truth for Proposal Data Fetching
 * Consolidates duplicate proposal fetching logic across components
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProposalWithLead, ProposalWithClientContact } from '@/types/entities';

/**
 * Fetch proposals for a handwerker with associated lead info
 */
export const fetchHandwerkerProposals = async (
  handwerkerId: string
): Promise<ProposalWithClientContact[]> => {
  const { data, error } = await supabase
    .from('lead_proposals')
    .select(`
      *,
      leads (
        title,
        city,
        canton,
        owner_id,
        description,
        category
      )
    `)
    .eq('handwerker_id', handwerkerId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;

  // For accepted proposals, fetch client contact details
  const proposalsWithContacts = await Promise.all(
    (data || []).map(async (proposal) => {
      if (proposal.status === 'accepted' && proposal.leads?.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', proposal.leads.owner_id)
          .single();

        return {
          ...proposal,
          client_contact: ownerProfile,
        } as ProposalWithClientContact;
      }
      return proposal as ProposalWithClientContact;
    })
  );

  return proposalsWithContacts;
};

/**
 * Fetch proposals for a specific lead (for lead owners)
 */
export const fetchLeadProposals = async (
  leadId: string
): Promise<ProposalWithHandwerker[]> => {
  const { data, error } = await supabase
    .from('lead_proposals')
    .select('*')
    .eq('lead_id', leadId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;

  // Fetch handwerker profiles separately since there's no direct FK relation
  const proposalsWithHandwerker = await Promise.all(
    (data || []).map(async (proposal) => {
      const { data: handwerkerProfile } = await supabase
        .from('handwerker_profiles')
        .select('id, first_name, last_name, company_name, logo_url, hourly_rate_min, hourly_rate_max, response_time_hours, bio')
        .eq('user_id', proposal.handwerker_id)
        .single();

      return {
        ...proposal,
        handwerker: handwerkerProfile || undefined,
      } as ProposalWithHandwerker;
    })
  );

  return proposalsWithHandwerker;
};

/**
 * Fetch all proposals for a client's leads
 */
export const fetchClientProposals = async (
  clientId: string
): Promise<ProposalWithLeadAndHandwerker[]> => {
  // First get all leads owned by this client
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('id')
    .eq('owner_id', clientId);

  if (leadsError) throw leadsError;
  if (!leads || leads.length === 0) return [];

  const leadIds = leads.map((l) => l.id);

  const { data, error } = await supabase
    .from('lead_proposals')
    .select(`
      *,
      leads (
        id,
        title,
        city,
        canton,
        category,
        status
      )
    `)
    .in('lead_id', leadIds)
    .order('submitted_at', { ascending: false });

  if (error) throw error;

  // Fetch handwerker profiles separately
  const proposalsWithHandwerker = await Promise.all(
    (data || []).map(async (proposal) => {
      const { data: handwerkerProfile } = await supabase
        .from('handwerker_profiles')
        .select('id, first_name, last_name, company_name, logo_url, phone_number, email')
        .eq('user_id', proposal.handwerker_id)
        .single();

      return {
        ...proposal,
        handwerker: handwerkerProfile || undefined,
      } as ProposalWithLeadAndHandwerker;
    })
  );

  return proposalsWithHandwerker;
};

// =============================================================================
// REMOVED: Duplicate proposal action functions
// Use functions from src/lib/proposalHelpers.ts instead:
// - acceptProposal(proposalId)
// - rejectProposal(proposalId)
// - acceptProposalsBatch(proposalIds)
// - rejectProposalsBatch(proposalIds)
// =============================================================================

/**
 * Withdraw a proposal (handwerker action)
 */
export const withdrawProposal = async (proposalId: string): Promise<void> => {
  const { error } = await supabase
    .from('lead_proposals')
    .update({ 
      status: 'withdrawn',
      updated_at: new Date().toISOString()
    })
    .eq('id', proposalId);

  if (error) throw error;
};

/**
 * Check if handwerker can submit a proposal (quota check)
 */
export const canSubmitProposal = async (handwerkerId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('can_submit_proposal', {
    handwerker_user_id: handwerkerId,
  });

  if (error) throw error;
  return data || false;
};

// =============================================================================
// Extended types for joined queries
// =============================================================================
export interface ProposalWithHandwerker {
  id: string;
  lead_id: string;
  handwerker_id: string;
  price_min: number;
  price_max: number;
  message: string;
  estimated_duration_days: number | null;
  status: string;
  submitted_at: string;
  responded_at: string | null;
  handwerker?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    logo_url: string | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    response_time_hours: number | null;
    bio: string | null;
  };
}

export interface ProposalWithLeadAndHandwerker {
  id: string;
  lead_id: string;
  handwerker_id: string;
  price_min: number;
  price_max: number;
  message: string;
  estimated_duration_days: number | null;
  status: string;
  submitted_at: string;
  responded_at: string | null;
  leads?: {
    id: string;
    title: string;
    city: string;
    canton: string;
    category: string;
    status: string;
  };
  handwerker?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    logo_url: string | null;
    phone_number: string | null;
    email: string | null;
  };
}
