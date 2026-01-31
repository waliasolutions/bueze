// Centralized admin notification types - SSOT for notification management
// All notification type constants should be defined here

export interface NotificationTypeConfig {
  label: string;
  description: string;
  icon: string;
  color: 'default' | 'warning' | 'error' | 'success' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Admin notification type configuration
 */
export const ADMIN_NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
  // Registration & Approvals
  new_handwerker_registration: {
    label: 'Neue Handwerker-Registrierung',
    description: 'Ein neuer Handwerker hat sich registriert und wartet auf Freigabe',
    icon: 'UserPlus',
    color: 'info',
    priority: 'high',
  },
  handwerker_approved: {
    label: 'Handwerker freigeschaltet',
    description: 'Ein Handwerker wurde erfolgreich freigeschaltet',
    icon: 'UserCheck',
    color: 'success',
    priority: 'low',
  },
  handwerker_rejected: {
    label: 'Handwerker abgelehnt',
    description: 'Ein Handwerker wurde abgelehnt',
    icon: 'UserX',
    color: 'warning',
    priority: 'medium',
  },

  // Leads & Proposals
  new_lead: {
    label: 'Neuer Auftrag',
    description: 'Ein neuer Auftrag wurde erstellt',
    icon: 'Briefcase',
    color: 'info',
    priority: 'medium',
  },
  orphan_lead: {
    label: 'Auftrag ohne Handwerker',
    description: 'Ein Auftrag hat keine passenden Handwerker gefunden (keine Kategorie-/Gebiets-Übereinstimmung)',
    icon: 'AlertCircle',
    color: 'error',
    priority: 'critical',
  },
  proposal_accepted: {
    label: 'Offerte angenommen',
    description: 'Eine Offerte wurde vom Kunden angenommen',
    icon: 'CheckCircle',
    color: 'success',
    priority: 'low',
  },

  // Reviews & Ratings
  low_rating: {
    label: 'Niedrige Bewertung',
    description: 'Ein Handwerker hat eine niedrige Bewertung erhalten (1-2 Sterne)',
    icon: 'Star',
    color: 'warning',
    priority: 'high',
  },
  new_review: {
    label: 'Neue Bewertung',
    description: 'Eine neue Bewertung wurde abgegeben',
    icon: 'MessageSquare',
    color: 'info',
    priority: 'low',
  },

  // Payments & Subscriptions
  payment_failed: {
    label: 'Zahlung fehlgeschlagen',
    description: 'Eine Zahlung konnte nicht verarbeitet werden',
    icon: 'CreditCard',
    color: 'error',
    priority: 'critical',
  },
  subscription_cancelled: {
    label: 'Abo gekündigt',
    description: 'Ein Handwerker hat sein Abonnement gekündigt',
    icon: 'XCircle',
    color: 'warning',
    priority: 'medium',
  },
  subscription_expired: {
    label: 'Abo abgelaufen',
    description: 'Ein Abonnement ist abgelaufen',
    icon: 'Clock',
    color: 'warning',
    priority: 'medium',
  },

  // System & Errors
  deletion_failed: {
    label: 'Löschung fehlgeschlagen',
    description: 'Eine Benutzerlöschung konnte nicht vollständig durchgeführt werden',
    icon: 'AlertTriangle',
    color: 'error',
    priority: 'critical',
  },
  deletion_warning: {
    label: 'Löschung mit Warnungen',
    description: 'Eine Benutzerlöschung wurde mit Warnungen abgeschlossen',
    icon: 'AlertCircle',
    color: 'warning',
    priority: 'high',
  },
  orphaned_records: {
    label: 'Verwaiste Datensätze',
    description: 'Verwaiste Datensätze wurden im System gefunden',
    icon: 'Database',
    color: 'warning',
    priority: 'high',
  },
  scheduled_function_failed: {
    label: 'Geplante Funktion fehlgeschlagen',
    description: 'Eine geplante Funktion konnte nicht ausgeführt werden',
    icon: 'Zap',
    color: 'error',
    priority: 'critical',
  },
  email_send_failed: {
    label: 'E-Mail-Versand fehlgeschlagen',
    description: 'Eine E-Mail konnte nicht versendet werden',
    icon: 'Mail',
    color: 'error',
    priority: 'high',
  },

  // Documents
  document_expired: {
    label: 'Dokument abgelaufen',
    description: 'Ein Dokument ist abgelaufen und muss erneuert werden',
    icon: 'FileX',
    color: 'error',
    priority: 'high',
  },
  document_expiring_soon: {
    label: 'Dokument läuft bald ab',
    description: 'Ein Dokument läuft in Kürze ab',
    icon: 'FileWarning',
    color: 'warning',
    priority: 'medium',
  },
};

/**
 * Get notification type config
 */
export function getNotificationTypeConfig(type: string): NotificationTypeConfig | undefined {
  return ADMIN_NOTIFICATION_TYPES[type];
}

/**
 * Get notification label
 */
export function getNotificationLabel(type: string): string {
  return ADMIN_NOTIFICATION_TYPES[type]?.label || type;
}

/**
 * Get notification color
 */
export function getNotificationColor(type: string): NotificationTypeConfig['color'] {
  return ADMIN_NOTIFICATION_TYPES[type]?.color || 'default';
}

/**
 * Get notification priority
 */
export function getNotificationPriority(type: string): NotificationTypeConfig['priority'] {
  return ADMIN_NOTIFICATION_TYPES[type]?.priority || 'low';
}

/**
 * Get all notification types for filtering
 */
export function getAllNotificationTypes(): Array<{ value: string; label: string }> {
  return Object.entries(ADMIN_NOTIFICATION_TYPES).map(([value, config]) => ({
    value,
    label: config.label,
  }));
}
