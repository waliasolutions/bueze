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
    // Get the proposal to find the lead
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select('lead_id')
      .eq('id', proposalId)
      .single();

    if (proposalError) throw proposalError;

    // Update proposal status to accepted
    const { error: updateError } = await supabase
      .from('lead_proposals')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (updateError) throw updateError;

    // Update lead status to completed and set accepted proposal
    const { error: leadError } = await supabase
      .from('leads')
      .update({
        status: 'completed',
        accepted_proposal_id: proposalId
      })
      .eq('id', proposal.lead_id);

    if (leadError) throw leadError;

    // Reject all other pending proposals for this lead
    await supabase
      .from('lead_proposals')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('lead_id', proposal.lead_id)
      .neq('id', proposalId)
      .eq('status', 'pending');

    // Trigger acceptance emails and conversation creation
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
      message: 'Offerte angenommen! Beide Parteien wurden benachrichtigt.'
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
 * Accept multiple proposals in batch
 */
export async function acceptProposalsBatch(proposalIds: string[]): Promise<ProposalActionResult> {
  let successCount = 0;
  let failCount = 0;

  for (const proposalId of proposalIds) {
    const result = await acceptProposal(proposalId);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

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
 * Reject multiple proposals in batch
 */
export async function rejectProposalsBatch(proposalIds: string[]): Promise<ProposalActionResult> {
  let successCount = 0;
  let failCount = 0;

  for (const proposalId of proposalIds) {
    const result = await rejectProposal(proposalId);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

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
