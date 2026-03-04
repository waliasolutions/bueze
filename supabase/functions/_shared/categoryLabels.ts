// SSOT for category labels used across edge functions
// Uses subcategoryLabels as the comprehensive source for all category/subcategory names

import { subcategoryLabels } from './subcategoryLabels.ts';

// Re-export major category labels for backward compatibility
export const categoryLabels: Record<string, string> = {
  'bau_renovation': 'Bau & Renovation',
  'elektroinstallationen': 'Elektroinstallationen',
  'heizung_klima': 'Heizung & Klima',
  'sanitaer': 'Sanitär',
  'bodenbelaege': 'Bodenbeläge',
  'innenausbau_schreiner': 'Innenausbau & Schreiner',
  'kueche': 'Küche',
  'garten_umgebung': 'Garten & Aussenbereich',
  'reinigung_hauswartung': 'Reinigung & Hauswartung',
  'raeumung_entsorgung': 'Räumung & Entsorgung',
};

export const urgencyLabels: Record<string, string> = {
  'today': 'Heute',
  'this_week': 'Diese Woche',
  'this_month': 'Diesen Monat',
  'planning': 'Planungsphase',
  'normal': 'Normal',
};

/**
 * Get human-readable category label (major or subcategory)
 */
export function getCategoryLabel(category: string): string {
  return categoryLabels[category] || subcategoryLabels[category] || category;
}

/**
 * Get human-readable urgency label
 */
export function getUrgencyLabel(urgency: string): string {
  return urgencyLabels[urgency] || urgency;
}

/**
 * Format budget range for display
 */
export function formatBudget(budgetMin?: number | null, budgetMax?: number | null): string {
  if (budgetMin && budgetMax) {
    return `CHF ${budgetMin.toLocaleString('de-CH')} - ${budgetMax.toLocaleString('de-CH')}`;
  }
  if (budgetMin) {
    return `Ab CHF ${budgetMin.toLocaleString('de-CH')}`;
  }
  if (budgetMax) {
    return `Bis CHF ${budgetMax.toLocaleString('de-CH')}`;
  }
  return 'Budget nicht angegeben';
}

/**
 * Format price range for display
 */
export function formatPrice(priceMin?: number | null, priceMax?: number | null): string {
  if (priceMin && priceMax) {
    return `CHF ${priceMin.toLocaleString('de-CH')} - ${priceMax.toLocaleString('de-CH')}`;
  }
  return 'Preis auf Anfrage';
}
