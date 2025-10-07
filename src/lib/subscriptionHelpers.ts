/**
 * Subscription Helper Functions
 * Manages subscription access, view tracking, and lead purchase pricing
 */

import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_PLANS, SubscriptionPlanType, getLeadPrice } from '@/config/subscriptionPlans';

export interface SubscriptionAccessCheck {
  canViewLead: boolean;
  remainingViews: number;
  requiresUpgrade: boolean;
  canPurchaseLead: boolean;
  leadPrice: number; // in CHF
  planType: SubscriptionPlanType;
  isUnlimited: boolean;
}

/**
 * Check user's subscription access and limits
 */
export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionAccessCheck> {
  try {
    // Fetch user's subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      // No subscription = free tier
      return {
        canViewLead: subscription?.used_views < 2,
        remainingViews: Math.max(0, 2 - (subscription?.used_views || 0)),
        requiresUpgrade: (subscription?.used_views || 0) >= 2,
        canPurchaseLead: true,
        leadPrice: 20,
        planType: 'free',
        isUnlimited: false,
      };
    }

    const planType = subscription.plan as SubscriptionPlanType;
    const plan = SUBSCRIPTION_PLANS[planType];
    const isUnlimited = plan.viewsLimit === -1;
    const usedViews = subscription.used_views || 0;
    const remainingViews = isUnlimited ? -1 : Math.max(0, plan.viewsLimit - usedViews);

    return {
      canViewLead: isUnlimited || usedViews < plan.viewsLimit,
      remainingViews,
      requiresUpgrade: !isUnlimited && usedViews >= plan.viewsLimit,
      canPurchaseLead: true,
      leadPrice: plan.leadPrice,
      planType,
      isUnlimited,
    };
  } catch (error) {
    console.error('Error checking subscription access:', error);
    // Default to free tier on error
    return {
      canViewLead: false,
      remainingViews: 0,
      requiresUpgrade: true,
      canPurchaseLead: true,
      leadPrice: 20,
      planType: 'free',
      isUnlimited: false,
    };
  }
}

/**
 * Track a lead view (for free tier users)
 */
export async function trackLeadView(userId: string, leadId: string): Promise<boolean> {
  try {
    // Insert into lead_views table
    const { error: viewError } = await supabase
      .from('lead_views')
      .insert({
        lead_id: leadId,
        viewer_id: userId,
      });

    if (viewError && !viewError.message.includes('duplicate key')) {
      console.error('Error inserting lead view:', viewError);
      return false;
    }

    // Increment used_views in subscriptions
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('used_views')
      .eq('user_id', userId)
      .single();

    if (subscription) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ used_views: (subscription.used_views || 0) + 1 })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating view count:', updateError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error tracking lead view:', error);
    return false;
  }
}

/**
 * Determine if user can purchase lead and at what price
 */
export async function canPurchaseLeadWithPrice(
  userId: string
): Promise<{ canPurchase: boolean; price: number }> {
  try {
    const access = await checkSubscriptionAccess(userId);
    
    return {
      canPurchase: access.canPurchaseLead,
      price: access.leadPrice,
    };
  } catch (error) {
    console.error('Error checking purchase eligibility:', error);
    return {
      canPurchase: true,
      price: 20, // Default to free tier price
    };
  }
}
