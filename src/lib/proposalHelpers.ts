/**
 * Proposal Helper Functions
 * Manages proposal submission, viewing, and acceptance workflows
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProposalSubmissionData {
  leadId: string;
  handwerkerId: string;
  priceMin: number;
  priceMax: number;
  estimatedDurationDays: number | null;
  message: string;
  availabilityDate: string | null;
  attachments: string[];
}

export interface ProposalDetails {
  id: string;
  leadId: string;
  handwerkerId: string;
  priceMin: number;
  priceMax: number;
  estimatedDurationDays: number | null;
  message: string;
  availabilityDate: string | null;
  attachments: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  viewedByClientAt: string | null;
  createdAt: string;
  acceptedAt: string | null;
  handwerkerProfile?: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    city: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Submit a new proposal
 */
export async function submitProposal(data: ProposalSubmissionData): Promise<{
  success: boolean;
  proposalId?: string;
  error?: string;
}> {
  try {
    const { data: proposal, error } = await supabase
      .from('lead_proposals')
      .insert({
        lead_id: data.leadId,
        handwerker_id: data.handwerkerId,
        price_min: data.priceMin,
        price_max: data.priceMax,
        estimated_duration_days: data.estimatedDurationDays,
        message: data.message,
        availability_date: data.availabilityDate,
        attachments: data.attachments,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('duplicate key')) {
        return { success: false, error: 'Sie haben bereits eine Offerte für diese Anfrage eingereicht.' };
      }
      console.error('Error submitting proposal:', error);
      return { success: false, error: 'Fehler beim Einreichen der Offerte.' };
    }

    return { success: true, proposalId: proposal.id };
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
  }
}

/**
 * Get proposals for a specific lead (for lead owner)
 */
export async function getProposalsForLead(leadId: string): Promise<ProposalDetails[]> {
  try {
    const { data, error } = await supabase
      .from('lead_proposals')
      .select(`
        *,
        handwerkerProfile:profiles!handwerker_id (
          first_name,
          last_name,
          company_name,
          city,
          avatar_url
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching proposals:', error);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      leadId: p.lead_id,
      handwerkerId: p.handwerker_id,
      priceMin: p.price_min,
      priceMax: p.price_max,
      estimatedDurationDays: p.estimated_duration_days,
      message: p.message,
      availabilityDate: p.availability_date,
      attachments: p.attachments || [],
      status: p.status,
      viewedByClientAt: p.viewed_by_client_at,
      createdAt: p.created_at,
      acceptedAt: p.accepted_at,
      handwerkerProfile: p.handwerkerProfile ? {
        firstName: p.handwerkerProfile.first_name,
        lastName: p.handwerkerProfile.last_name,
        companyName: p.handwerkerProfile.company_name,
        city: p.handwerkerProfile.city,
        avatarUrl: p.handwerkerProfile.avatar_url,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
}

/**
 * Get handwerker's own proposals
 */
export async function getMyProposals(handwerkerId: string): Promise<ProposalDetails[]> {
  try {
    const { data, error } = await supabase
      .from('lead_proposals')
      .select(`
        *,
        lead:leads (
          title,
          city,
          category
        )
      `)
      .eq('handwerker_id', handwerkerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my proposals:', error);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      leadId: p.lead_id,
      handwerkerId: p.handwerker_id,
      priceMin: p.price_min,
      priceMax: p.price_max,
      estimatedDurationDays: p.estimated_duration_days,
      message: p.message,
      availabilityDate: p.availability_date,
      attachments: p.attachments || [],
      status: p.status,
      viewedByClientAt: p.viewed_by_client_at,
      createdAt: p.created_at,
      acceptedAt: p.accepted_at,
    }));
  } catch (error) {
    console.error('Error fetching my proposals:', error);
    return [];
  }
}

/**
 * Mark proposal as viewed by client
 */
export async function markProposalAsViewed(proposalId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('lead_proposals')
      .update({ viewed_by_client_at: new Date().toISOString() })
      .eq('id', proposalId)
      .is('viewed_by_client_at', null);

    if (error) {
      console.error('Error marking proposal as viewed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking proposal as viewed:', error);
    return false;
  }
}

/**
 * Accept a proposal (can only accept one)
 */
export async function acceptProposal(proposalId: string, leadId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if lead already has an accepted proposal
    const { data: lead } = await supabase
      .from('leads')
      .select('accepted_proposal_id')
      .eq('id', leadId)
      .single();

    if (lead?.accepted_proposal_id) {
      return { success: false, error: 'Sie haben bereits eine Offerte angenommen.' };
    }

    // Update proposal status to accepted
    const { error: proposalError } = await supabase
      .from('lead_proposals')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (proposalError) {
      console.error('Error accepting proposal:', proposalError);
      return { success: false, error: 'Fehler beim Annehmen der Offerte.' };
    }

    // Update lead to mark this proposal as accepted
    const { error: leadError } = await supabase
      .from('leads')
      .update({ accepted_proposal_id: proposalId })
      .eq('id', leadId);

    if (leadError) {
      console.error('Error updating lead:', leadError);
      return { success: false, error: 'Fehler beim Aktualisieren der Anfrage.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error accepting proposal:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
  }
}

/**
 * Reject a proposal
 */
export async function rejectProposal(proposalId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('lead_proposals')
      .update({ status: 'rejected' })
      .eq('id', proposalId);

    if (error) {
      console.error('Error rejecting proposal:', error);
      return { success: false, error: 'Fehler beim Ablehnen der Offerte.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten.' };
  }
}

/**
 * Check if user has already submitted a proposal for a lead
 */
export async function hasSubmittedProposal(leadId: string, handwerkerId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('lead_proposals')
      .select('id')
      .eq('lead_id', leadId)
      .eq('handwerker_id', handwerkerId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}
