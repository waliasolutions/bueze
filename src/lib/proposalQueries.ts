/**
 * Proposal Query Helpers - Single Source of Truth for Proposal Data Fetching
 * Consolidates duplicate proposal fetching logic across components
 */

import { supabase } from '@/integrations/supabase/client';

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

// =============================================================================
// Pure mappers (testable; no supabase dependency)
// =============================================================================

export interface ClientContact {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface ContactRow {
  lead_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface ProposalLike {
  lead_id: string;
  status: string;
  leads?: { owner_id?: string | null } | null;
  [k: string]: unknown;
}

/**
 * Attach `client_contact` to accepted proposals from a list of contact rows
 * returned by the `get_accepted_client_contacts` RPC.
 * - Only proposals with status='accepted' AND a lead owner get a contact.
 * - Missing contact rows tolerated → `client_contact: null`.
 */
export function mapProposalsToContacts<T extends ProposalLike>(
  proposals: T[],
  contacts: ContactRow[]
): Array<T & { client_contact?: ClientContact | null }> {
  const byLead = new Map<string, ClientContact>(
    contacts.map((c) => [c.lead_id, { full_name: c.full_name, email: c.email, phone: c.phone }])
  );
  return proposals.map((p) => {
    if (p.status === 'accepted' && p.leads?.owner_id) {
      return { ...p, client_contact: byLead.get(p.lead_id) ?? null };
    }
    return p;
  });
}
