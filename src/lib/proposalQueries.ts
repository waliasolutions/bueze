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
