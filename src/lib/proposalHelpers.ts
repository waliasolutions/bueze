/**
 * Single Source of Truth for Proposal Operations
 * All proposal acceptance/rejection logic should use these helpers
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProposalActionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Accept a proposal - atomic RPC that updates lead, accepts proposal, rejects others in one transaction.
 * Uses proposal_id as natural idempotency key (safe for double-clicks / network retries).
 */
export async function acceptProposal(proposalId: string): Promise<ProposalActionResult> {
  try {
    // Get the proposal's lead_id (needed for the RPC call)
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select('lead_id, status')
      .eq('id', proposalId)
      .single();

    if (proposalError) throw proposalError;

    if (proposal.status !== 'pending') {
      return {
        success: false,
        message: 'Diese Offerte wurde bereits bearbeitet.'
      };
    }

    // Atomic RPC: updates lead + accepts proposal + rejects others in single transaction
    const { data: result, error: rpcError } = await supabase.rpc('accept_proposal_atomic', {
      p_proposal_id: proposalId,
      p_lead_id: proposal.lead_id,
    });

    if (rpcError) throw rpcError;

    if (!result.success) {
      const errorMessages: Record<string, string> = {
        lead_not_active: 'Für diesen Auftrag wurde bereits eine Offerte angenommen.',
        lead_not_found: 'Der Auftrag wurde nicht gefunden.',
        proposal_not_pending: 'Diese Offerte wurde bereits bearbeitet.',
        proposal_not_found: 'Die Offerte wurde nicht gefunden.',
      };
      return {
        success: false,
        message: errorMessages[result.error] || 'Offerte konnte nicht angenommen werden',
      };
    }

    // Trigger acceptance emails and conversation creation (fire-and-forget, outside transaction)
    try {
      await supabase.functions.invoke('send-acceptance-emails', {
        body: { proposalId }
      });
    } catch (emailError) {
      console.error('Failed to send acceptance emails:', emailError);
      // Don't fail the whole operation if emails fail
    }

    return {
      success: true,
      message: result.idempotent
        ? 'Diese Offerte wurde bereits angenommen.'
        : 'Offerte angenommen! Beide Parteien wurden benachrichtigt.'
    };
  } catch (error) {
    console.error('Error accepting proposal:', error);
    return {
      success: false,
      message: 'Offerte konnte nicht angenommen werden',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Reject a proposal - updates proposal status and sends rejection email
 */
export async function rejectProposal(proposalId: string): Promise<ProposalActionResult> {
  try {
    const { error } = await supabase
      .from('lead_proposals')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (error) throw error;

    // Send rejection email to handwerker
    try {
      await supabase.functions.invoke('send-proposal-rejection-email', {
        body: { proposalId }
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the whole operation if email fails
    }

    return {
      success: true,
      message: 'Offerte abgelehnt. Der Handwerker wurde benachrichtigt.'
    };
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return {
      success: false,
      message: 'Offerte konnte nicht abgelehnt werden',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Accept multiple proposals in batch - using Promise.all for parallel execution
 */
export async function acceptProposalsBatch(proposalIds: string[]): Promise<ProposalActionResult> {
  if (proposalIds.length === 0) {
    return { success: false, message: 'Keine Offerten ausgewählt' };
  }

  // Execute all accept operations in parallel
  const results = await Promise.all(
    proposalIds.map(proposalId => acceptProposal(proposalId))
  );

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  if (failCount === 0) {
    return {
      success: true,
      message: `${successCount} Offerte(n) angenommen`
    };
  } else if (successCount > 0) {
    return {
      success: true,
      message: `${successCount} Offerte(n) angenommen, ${failCount} fehlgeschlagen`
    };
  } else {
    return {
      success: false,
      message: 'Keine Offerten konnten angenommen werden'
    };
  }
}

/**
 * Reject multiple proposals in batch - using Promise.all for parallel execution
 */
export async function rejectProposalsBatch(proposalIds: string[]): Promise<ProposalActionResult> {
  if (proposalIds.length === 0) {
    return { success: false, message: 'Keine Offerten ausgewählt' };
  }

  // Execute all reject operations in parallel
  const results = await Promise.all(
    proposalIds.map(proposalId => rejectProposal(proposalId))
  );

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  if (failCount === 0) {
    return {
      success: true,
      message: `${successCount} Offerte(n) abgelehnt`
    };
  } else if (successCount > 0) {
    return {
      success: true,
      message: `${successCount} Offerte(n) abgelehnt, ${failCount} fehlgeschlagen`
    };
  } else {
    return {
      success: false,
      message: 'Keine Offerten konnten abgelehnt werden'
    };
  }
}
