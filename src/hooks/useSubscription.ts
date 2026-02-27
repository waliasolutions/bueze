/**
 * Single Source of Truth for Subscription Data Fetching
 * Centralized hook to manage subscription state across all components
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_PLANS, FREE_TIER_PROPOSALS_LIMIT, type SubscriptionPlanType } from '@/config/subscriptionPlans';

export interface SubscriptionData {
  id: string;
  plan: SubscriptionPlanType;
  status: string;
  usedProposals: number;
  remainingProposals: number;
  proposalsLimit: number;
  isUnlimited: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  resetDate: Date;
  daysUntilReset: number;
  usagePercentage: number;
  isActive: boolean;
  isLow: boolean;
  isDepleted: boolean;
  pendingPlan: SubscriptionPlanType | null;
}

interface UseSubscriptionOptions {
  userId: string;
  enableAutoCreate?: boolean;
  onError?: (error: Error) => void;
}

export const useSubscription = ({ userId, enableAutoCreate = true, onError }: UseSubscriptionOptions) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchSubscription = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('handwerker_subscriptions')
        .select('id, user_id, plan_type, status, proposals_used_this_period, proposals_limit, current_period_start, current_period_end, pending_plan, updated_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError) throw fetchError;

      let subscriptionData = data;

      // Auto-create default free subscription if none exists
      // Uses 30-day rolling period from registration (Swiss timezone for DST safety)
      if (!subscriptionData && enableAutoCreate) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const { data: newSub, error: insertError } = await supabase
          .from('handwerker_subscriptions')
          .insert({
            user_id: userId,
            plan_type: 'free',
            status: 'active',
            proposals_used_this_period: 0,
            proposals_limit: FREE_TIER_PROPOSALS_LIMIT,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;
        subscriptionData = newSub;
      }

      if (subscriptionData) {
        const planType = subscriptionData.plan_type as SubscriptionPlanType;
        const plan = SUBSCRIPTION_PLANS[planType];
        const isUnlimited = plan.proposalsLimit === -1;
        const usedProposals = subscriptionData.proposals_used_this_period || 0;
        const remainingProposals = isUnlimited ? Infinity : Math.max(0, plan.proposalsLimit - usedProposals);
        const usagePercentage = isUnlimited ? 0 : Math.min(100, (usedProposals / plan.proposalsLimit) * 100);
        const resetDate = new Date(subscriptionData.current_period_end);
        const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        setSubscription({
          id: subscriptionData.id,
          plan: planType,
          status: subscriptionData.status,
          usedProposals,
          remainingProposals: isUnlimited ? Infinity : remainingProposals,
          proposalsLimit: plan.proposalsLimit,
          isUnlimited,
          currentPeriodStart: subscriptionData.current_period_start,
          currentPeriodEnd: subscriptionData.current_period_end,
          resetDate,
          daysUntilReset,
          usagePercentage,
          isActive: subscriptionData.status === 'active',
          isLow: !isUnlimited && remainingProposals <= 2 && remainingProposals > 0,
          isDepleted: !isUnlimited && remainingProposals <= 0,
          pendingPlan: subscriptionData.pending_plan as SubscriptionPlanType | null,
        });
      } else {
        setSubscription(null);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching subscription:', error);
      setError(error);
      
      // Only call onError callback if provided - no default toast
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
  };
};
