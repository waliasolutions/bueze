/**
 * Subscription Helper Functions
 * Manages subscription access and proposal quota tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType, getProposalLimit } from '@/config/subscriptionPlans';

export interface ProposalQuotaCheck {
  canSubmitProposal: boolean;
  remainingProposals: number;
  requiresUpgrade: boolean;
  planType: SubscriptionPlanType;
  isUnlimited: boolean;
  usedThisMonth: number;
  resetDate: Date | null;
}

/**
 * Check user's proposal quota and limits
 */
export async function checkProposalQuota(userId: string): Promise<ProposalQuotaCheck> {
  try {
    // Fetch user's subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      // No subscription = free tier (5 proposals per month)
      return {
        canSubmitProposal: true,
        remainingProposals: 5,
        requiresUpgrade: false,
        planType: 'free',
        isUnlimited: false,
        usedThisMonth: 0,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      };
    }

    const planType = subscription.plan as SubscriptionPlanType;
    const plan = SUBSCRIPTION_PLANS[planType];
    const proposalLimit = plan.proposalsLimit;
    const isUnlimited = proposalLimit === -1;
    const usedProposals = subscription.used_proposals || 0;
    const remainingProposals = isUnlimited ? -1 : Math.max(0, proposalLimit - usedProposals);

    return {
      canSubmitProposal: isUnlimited || usedProposals < proposalLimit,
      remainingProposals,
      requiresUpgrade: !isUnlimited && usedProposals >= proposalLimit,
      planType,
      isUnlimited,
      usedThisMonth: usedProposals,
      resetDate: subscription.proposals_reset_at ? new Date(subscription.proposals_reset_at) : null,
    };
  } catch (error) {
    console.error('Error checking proposal quota:', error);
    // Default to free tier on error
    return {
      canSubmitProposal: false,
      remainingProposals: 0,
      requiresUpgrade: true,
      planType: 'free',
      isUnlimited: false,
      usedThisMonth: 0,
      resetDate: null,
    };
  }
}

/**
 * Increment proposal count after successful submission
 */
export async function incrementProposalCount(userId: string): Promise<boolean> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('used_proposals')
      .eq('user_id', userId)
      .single();

    if (subscription) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ used_proposals: (subscription.used_proposals || 0) + 1 })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating proposal count:', updateError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error incrementing proposal count:', error);
    return false;
  }
}

/**
 * Check if user has an active subscription (not free tier)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return false;
    }

    return subscription.plan !== 'free';
  } catch (error) {
    console.error('Error checking active subscription:', error);
    return false;
  }
}
