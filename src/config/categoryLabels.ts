/**
 * Single Source of Truth for Category Labels
 * All category-related labels should reference this file
 */

import { majorCategories } from './majorCategories';

// Generate category labels from majorCategories SSOT
export const categoryLabels: Record<string, string> = Object.values(majorCategories).reduce(
  (acc, category) => {
    acc[category.id] = category.label;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Get category label by key
 */
export function getCategoryLabel(category: string): string {
  return categoryLabels[category] || category;
}
