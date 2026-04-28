/**
 * Single Source of Truth for Category Labels
 * All category-related labels should reference this file.
 * Resolves both major category IDs and subcategory enum values.
 */

import { majorCategories } from './majorCategories';
import { subcategoryLabels } from './subcategoryLabels';

// Generate category labels from majorCategories SSOT
export const categoryLabels: Record<string, string> = Object.values(majorCategories).reduce(
  (acc, category) => {
    acc[category.id] = category.label;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Get human-readable label for any category key (major or subcategory).
 * Subcategory labels win over major-category labels for ids present in both
 * (e.g. 'reinigung_hauswartung' is both a major id and a subcategory id —
 * the subcategory label "Hauswartung" is the more specific, correct rendering).
 */
export function getCategoryLabel(category: string): string {
  return subcategoryLabels[category]?.label || categoryLabels[category] || category;
}
