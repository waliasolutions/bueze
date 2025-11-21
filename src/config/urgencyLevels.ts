/**
 * Single Source of Truth for Urgency Levels
 * All urgency-related configuration should reference this file
 */

export type UrgencyLevel = 'today' | 'this_week' | 'this_month' | 'planning';

export interface UrgencyConfig {
  value: UrgencyLevel;
  label: string;
  description?: string;
}

export const URGENCY_LEVELS: Record<UrgencyLevel, UrgencyConfig> = {
  today: {
    value: 'today',
    label: 'Heute / Sofort',
    description: 'Dringende Anfrage für heute oder sofort',
  },
  this_week: {
    value: 'this_week',
    label: 'Diese Woche',
    description: 'Anfrage für diese Woche',
  },
  this_month: {
    value: 'this_month',
    label: 'Diesen Monat',
    description: 'Anfrage für diesen Monat',
  },
  planning: {
    value: 'planning',
    label: 'Planung (nächste Monate)',
    description: 'Langfristige Planung',
  },
};

/**
 * Get urgency level label
 */
export function getUrgencyLabel(urgency: string): string {
  return URGENCY_LEVELS[urgency as UrgencyLevel]?.label || urgency;
}

/**
 * Get all urgency levels as array for select dropdowns
 */
export function getUrgencyOptions(): UrgencyConfig[] {
  return Object.values(URGENCY_LEVELS);
}
