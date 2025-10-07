/**
 * Lead Management Helper Functions
 * Handles lead status updates and analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { LeadStatusType } from '@/config/leadStatuses';

export interface LeadUpdateResult {
  success: boolean;
  message: string;
  error?: any;
}

export interface LeadAnalytics {
  totalViews: number;
  totalPurchases: number;
  revenue: number;
  conversionRate: number;
}

/**
 * Update lead status (generic function)
 */
export async function updateLeadStatus(
  leadId: string,
  userId: string,
  newStatus: LeadStatusType
): Promise<LeadUpdateResult> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .eq('owner_id', userId); // RLS enforcement

    if (error) {
      return {
        success: false,
        message: 'Fehler beim Aktualisieren des Status',
        error,
      };
    }

    return {
      success: true,
      message: 'Status erfolgreich aktualisiert',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Ein unerwarteter Fehler ist aufgetreten',
      error,
    };
  }
}

/**
 * Get status-specific success messages
 */
function getStatusSuccessMessage(status: LeadStatusType): string {
  switch (status) {
    case 'paused':
      return 'Auftrag pausiert. Handwerker können ihn nicht mehr sehen.';
    case 'active':
      return 'Auftrag reaktiviert. Handwerker können ihn wieder finden.';
    case 'completed':
      return 'Auftrag als erledigt markiert. Vielen Dank!';
    case 'deleted':
      return 'Auftrag gelöscht.';
    default:
      return 'Status erfolgreich aktualisiert.';
  }
}

/**
 * Pause a lead (hide from search)
 */
export async function pauseLead(leadId: string, userId: string): Promise<LeadUpdateResult> {
  const result = await updateLeadStatus(leadId, userId, 'paused');
  if (result.success) {
    result.message = getStatusSuccessMessage('paused');
  }
  return result;
}

/**
 * Mark lead as completed
 */
export async function completeLead(leadId: string, userId: string): Promise<LeadUpdateResult> {
  const result = await updateLeadStatus(leadId, userId, 'completed');
  if (result.success) {
    result.message = getStatusSuccessMessage('completed');
  }
  return result;
}

/**
 * Delete a lead (soft delete - status change)
 */
export async function deleteLead(leadId: string, userId: string): Promise<LeadUpdateResult> {
  const result = await updateLeadStatus(leadId, userId, 'deleted');
  if (result.success) {
    result.message = getStatusSuccessMessage('deleted');
  }
  return result;
}

/**
 * Reactivate a paused lead
 */
export async function reactivateLead(leadId: string, userId: string): Promise<LeadUpdateResult> {
  const result = await updateLeadStatus(leadId, userId, 'active');
  if (result.success) {
    result.message = getStatusSuccessMessage('active');
  }
  return result;
}

/**
 * Get lead analytics for owner
 */
export async function getLeadAnalytics(leadId: string, userId: string): Promise<LeadAnalytics> {
  try {
    // Get total purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('lead_purchases')
      .select('price')
      .eq('lead_id', leadId);

    if (purchaseError) {
      console.error('Error fetching purchases:', purchaseError);
    }

    // Get total views
    const { data: views, error: viewError } = await supabase
      .from('lead_views')
      .select('id')
      .eq('lead_id', leadId);

    if (viewError) {
      console.error('Error fetching views:', viewError);
    }

    const totalPurchases = purchases?.length || 0;
    const totalViews = views?.length || 0;
    const revenue = purchases?.reduce((sum, p) => sum + (p.price / 100), 0) || 0;
    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    return {
      totalViews,
      totalPurchases,
      revenue,
      conversionRate,
    };
  } catch (error) {
    console.error('Error getting lead analytics:', error);
    return {
      totalViews: 0,
      totalPurchases: 0,
      revenue: 0,
      conversionRate: 0,
    };
  }
}
