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
 * Urgency colors for badges - using Tailwind classes
 */
export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  today: 'bg-red-100 text-red-800',
  this_week: 'bg-orange-100 text-orange-800',
  this_month: 'bg-blue-100 text-blue-800',
  planning: 'bg-gray-100 text-gray-800',
};

/**
 * Get urgency level label
 */
export function getUrgencyLabel(urgency: string): string {
  return URGENCY_LEVELS[urgency as UrgencyLevel]?.label || urgency;
}

/**
 * Get urgency color classes
 */
export function getUrgencyColor(urgency: string): string {
  return URGENCY_COLORS[urgency as UrgencyLevel] || 'bg-gray-100 text-gray-800';
}

/**
 * Get all urgency levels as array for select dropdowns
 */
export function getUrgencyOptions(): UrgencyConfig[] {
  return Object.values(URGENCY_LEVELS);
}
