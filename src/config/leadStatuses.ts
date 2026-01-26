/**
 * Single Source of Truth for Lead Statuses
 * All lead status-related configuration should reference this file
 */

export type LeadStatusType = 'draft' | 'active' | 'paused' | 'completed' | 'expired' | 'deleted';

export interface LeadStatusConfig {
  id: LeadStatusType;
  label: string;
  description: string;
  color: string; // Tailwind color classes
  canView: boolean; // Whether lead is visible in search
  canPurchase: boolean; // Whether lead can be purchased
}

export const LEAD_STATUSES: Record<LeadStatusType, LeadStatusConfig> = {
  draft: {
    id: 'draft',
    label: 'Entwurf',
    description: 'Lead ist noch nicht veröffentlicht',
    color: 'bg-gray-100 text-gray-800',
    canView: false,
    canPurchase: false,
  },
  active: {
    id: 'active',
    label: 'Aktiv',
    description: 'Lead ist veröffentlicht und kann gekauft werden',
    color: 'bg-green-100 text-green-800',
    canView: true,
    canPurchase: true,
  },
  paused: {
    id: 'paused',
    label: 'Pausiert',
    description: 'Lead ist vorübergehend nicht sichtbar',
    color: 'bg-yellow-100 text-yellow-800',
    canView: false,
    canPurchase: false,
  },
  completed: {
    id: 'completed',
    label: 'Erledigt',
    description: 'Lead wurde erfolgreich abgeschlossen',
    color: 'bg-blue-100 text-blue-800',
    canView: false,
    canPurchase: false,
  },
  expired: {
    id: 'expired',
    label: 'Abgelaufen',
    description: 'Die Angebotsfrist ist abgelaufen',
    color: 'bg-orange-100 text-orange-800',
    canView: false,
    canPurchase: false,
  },
  deleted: {
    id: 'deleted',
    label: 'Gelöscht',
    description: 'Lead wurde gelöscht',
    color: 'bg-red-100 text-red-800',
    canView: false,
    canPurchase: false,
  },
};

/**
 * Check if a lead can be viewed in search based on its status
 */
export function canViewLead(status: LeadStatusType): boolean {
  return LEAD_STATUSES[status]?.canView || false;
}

/**
 * Check if a lead can be purchased based on its status
 */
export function canPurchaseLead(status: LeadStatusType): boolean {
  return LEAD_STATUSES[status]?.canPurchase || false;
}

/**
 * Get lead status configuration
 */
export function getLeadStatus(status: LeadStatusType): LeadStatusConfig {
  return LEAD_STATUSES[status];
}

/**
 * Get all active statuses (statuses that can be shown to users)
 */
export function getActiveStatuses(): LeadStatusType[] {
  return Object.keys(LEAD_STATUSES).filter(
    (status) => LEAD_STATUSES[status as LeadStatusType].canView
  ) as LeadStatusType[];
}
