/**
 * Single Source of Truth for Lead Statuses
 * All lead status-related configuration should reference this file
 */

export type LeadStatusType = 'draft' | 'active' | 'paused' | 'completed' | 'expired' | 'deleted' | 'cancelled' | 'closed';

export type LeadStatusBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface LeadStatusConfig {
  id: LeadStatusType;
  label: string;
  description: string;
  color: string; // Tailwind color classes
  variant: LeadStatusBadgeVariant;
  canView: boolean; // Whether lead is visible in search
  canPurchase: boolean; // Whether lead can be purchased
}

export const LEAD_STATUSES: Record<LeadStatusType, LeadStatusConfig> = {
  draft: {
    id: 'draft',
    label: 'Entwurf',
    description: 'Lead ist noch nicht veröffentlicht',
    color: 'bg-gray-100 text-gray-800',
    variant: 'outline',
    canView: false,
    canPurchase: false,
  },
  active: {
    id: 'active',
    label: 'Aktiv',
    description: 'Lead ist veröffentlicht und kann gekauft werden',
    color: 'bg-green-100 text-green-800',
    variant: 'default',
    canView: true,
    canPurchase: true,
  },
  paused: {
    id: 'paused',
    label: 'Pausiert',
    description: 'Lead ist vorübergehend nicht sichtbar',
    color: 'bg-yellow-100 text-yellow-800',
    variant: 'secondary',
    canView: false,
    canPurchase: false,
  },
  completed: {
    id: 'completed',
    label: 'Erledigt',
    description: 'Lead wurde erfolgreich abgeschlossen',
    color: 'bg-blue-100 text-blue-800',
    variant: 'default',
    canView: false,
    canPurchase: false,
  },
  expired: {
    id: 'expired',
    label: 'Abgelaufen',
    description: 'Die Angebotsfrist ist abgelaufen',
    color: 'bg-orange-100 text-orange-800',
    variant: 'secondary',
    canView: false,
    canPurchase: false,
  },
  deleted: {
    id: 'deleted',
    label: 'Gelöscht',
    description: 'Lead wurde gelöscht',
    color: 'bg-red-100 text-red-800',
    variant: 'destructive',
    canView: false,
    canPurchase: false,
  },
  cancelled: {
    id: 'cancelled',
    label: 'Abgebrochen',
    description: 'Lead wurde vom Auftraggeber abgebrochen',
    color: 'bg-orange-100 text-orange-800',
    variant: 'destructive',
    canView: false,
    canPurchase: false,
  },
  closed: {
    id: 'closed',
    label: 'Geschlossen',
    description: 'Lead wurde geschlossen',
    color: 'bg-slate-100 text-slate-800',
    variant: 'secondary',
    canView: false,
    canPurchase: false,
  },
};

/**
 * Derived "awarded but not yet delivered" state — not a DB status,
 * shown when an offer was accepted (status='completed') but
 * delivered_at has not been set yet.
 */
export const LEAD_STATUS_IN_PROGRESS = {
  label: 'In Bearbeitung',
  variant: 'default' as LeadStatusBadgeVariant,
  color: 'bg-indigo-100 text-indigo-800',
};

export interface LeadDisplayInput {
  status: string;
  accepted_proposal_id?: string | null;
  delivered_at?: string | null;
}

export interface LeadDisplay {
  label: string;
  variant: LeadStatusBadgeVariant;
  color: string;
}

/**
 * Single source of truth for how a lead status is rendered to humans.
 * Combines DB status with delivered_at / accepted_proposal_id so the
 * "completed" status (closed-for-new-offers) doesn't prematurely
 * read as "Erledigt" while work is still in progress.
 */
export function getLeadDisplayStatus(input: LeadDisplayInput): LeadDisplay {
  const { status, accepted_proposal_id, delivered_at } = input;

  if (status === 'completed') {
    if (delivered_at) {
      const c = LEAD_STATUSES.completed;
      return { label: c.label, variant: c.variant, color: c.color };
    }
    if (accepted_proposal_id) {
      return { ...LEAD_STATUS_IN_PROGRESS };
    }
    const c = LEAD_STATUSES.completed;
    return { label: c.label, variant: c.variant, color: c.color };
  }

  const cfg = LEAD_STATUSES[status as LeadStatusType];
  if (cfg) {
    return { label: cfg.label, variant: cfg.variant, color: cfg.color };
  }
  return { label: status, variant: 'outline', color: 'bg-gray-100 text-gray-800' };
}

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
