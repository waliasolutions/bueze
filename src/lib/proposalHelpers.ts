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
 * Accept a proposal - updates proposal status, lead status, rejects other proposals, sends emails
 */
export async function acceptProposal(proposalId: string): Promise<ProposalActionResult> {
  try {
    // Single atomic RPC: locks lead+proposal, validates ownership/state,
    // updates lead + proposal + rejects siblings in one transaction.
    // Acceptance emails + conversation creation are dispatched by the DB trigger
    // `on_proposal_accepted` (pg_net -> send-acceptance-emails). Do NOT also
    // invoke the edge function from the client — that produced duplicate
    // conversations and duplicate emails on every acceptance.
    const { data, error } = await supabase.rpc('accept_proposal_atomic', {
      p_proposal_id: proposalId,
    });

    if (error) {
      console.error('Error accepting proposal:', error);
      return {
        success: false,
        message: 'Offerte konnte nicht angenommen werden',
        error: error.message,
      };
    }

    const result = (data ?? {}) as { success?: boolean; message?: string };
    return {
      success: !!result.success,
      message: result.message ?? (result.success
        ? 'Offerte angenommen! Beide Parteien wurden benachrichtigt.'
        : 'Offerte konnte nicht angenommen werden'),
    };
  } catch (error) {
    console.error('Error accepting proposal:', error);
    return {
      success: false,
      message: 'Offerte konnte nicht angenommen werden',
      error: error instanceof Error ? error.message : 'Unknown error',
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

/**
 * Revoke an accepted proposal (Storno).
 * SSOT: all three surfaces (client, handwerker, admin) call the same RPC.
 * Authorization + time window are enforced server-side:
 * - Handwerker & Admin: any time
 * - Client (Auftraggeber): within 24h of acceptance
 */
export async function revokeProposalAcceptance(proposalId: string): Promise<ProposalActionResult> {
  try {
    const { data, error } = await supabase.rpc('revoke_proposal_acceptance', {
      p_proposal_id: proposalId,
    });

    if (error) {
      console.error('Error revoking proposal acceptance:', error);
      return {
        success: false,
        message: 'Auftrag konnte nicht storniert werden',
        error: error.message,
      };
    }

    const result = (data ?? {}) as { success?: boolean; message?: string };
    return {
      success: !!result.success,
      message: result.message ?? (result.success
        ? 'Auftrag storniert.'
        : 'Auftrag konnte nicht storniert werden'),
    };
  } catch (error) {
    console.error('Error revoking proposal acceptance:', error);
    return {
      success: false,
      message: 'Auftrag konnte nicht storniert werden',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
