import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CategorySelectorProps {
  /** 'single' for client lead submission, 'multi' for handwerker profiles */
  mode: 'single' | 'multi';
  /** Selected category ID (single mode) or array of category IDs (multi mode) */
  selected: string | string[];
  /** Callback when selection changes */
  onSelect: (selected: string | string[]) => void;
  /** Show subcategory selection (only for multi mode) */
  showSubcategories?: boolean;
  /** Optional class name */
  className?: string;
}

/**
 * SSOT Category Selector Component
 * 
 * Mobile-optimized icon grid for selecting service categories.
 * Works in two modes:
 * - 'single': For clients selecting one category (lead submission)
 * - 'multi': For handwerkers selecting multiple categories (profile/onboarding)
 */
export const CategorySelector: React.FC<CategorySelectorProps> = ({
  mode,
  selected,
  onSelect,
  showSubcategories = false,
  className,
}) => {
  // Normalize selected to array for easier handling
  const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];
  
  // Track which major categories are expanded (for multi mode with subcategories)
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([]);

  const handleMajorCategoryClick = (categoryId: string) => {
    if (mode === 'single') {
      // Single select: just select this one
      onSelect(categoryId);
    } else {
      // Multi select: toggle selection
      const isSelected = selectedArray.includes(categoryId);
      if (isSelected) {
        // Remove category and all its subcategories
        const majorCat = majorCategories[categoryId];
        const newSelected = selectedArray.filter(
          id => id !== categoryId && !majorCat?.subcategories.includes(id)
        );
        onSelect(newSelected);
        setExpandedCategories(prev => prev.filter(id => id !== categoryId));
      } else {
        // Add category
        onSelect([...selectedArray, categoryId]);
        if (showSubcategories) {
          setExpandedCategories(prev => [...prev, categoryId]);
        }
      }
    }
  };

  const handleSubcategoryToggle = (subcategoryId: string, majorCategoryId: string) => {
    if (mode !== 'multi') return;
    
    const isSelected = selectedArray.includes(subcategoryId);
    if (isSelected) {
      onSelect(selectedArray.filter(id => id !== subcategoryId));
    } else {
      // Ensure major category is also selected
      const newSelected = [...selectedArray];
      if (!newSelected.includes(majorCategoryId)) {
        newSelected.push(majorCategoryId);
      }
      newSelected.push(subcategoryId);
      onSelect(newSelected);
    }
  };

  const isSelected = (categoryId: string) => selectedArray.includes(categoryId);

  const getSelectedSubcategoryCount = (majorCategoryId: string) => {
    const majorCat = majorCategories[majorCategoryId];
    if (!majorCat) return 0;
    return selectedArray.filter(id => majorCat.subcategories.includes(id)).length;
  };

  // Get short label for mobile display
  const getShortLabel = (label: string, categoryId: string): string => {
    // Special cases for long labels
    const shortLabels: Record<string, string> = {
      'elektroinstallationen': 'Elektro',
      'innenausbau_schreiner': 'Schreiner',
      'raeumung_entsorgung': 'Räumung',
      'reinigung_hauswartung': 'Reinigung',
    };
    return shortLabels[categoryId] || label;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Category Grid - Mobile optimized: 2 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {Object.values(majorCategories).map((majorCat) => {
          const Icon = majorCat.icon;
          const categorySelected = isSelected(majorCat.id);
          const subcatCount = getSelectedSubcategoryCount(majorCat.id);
          
          return (
            <Card
              key={majorCat.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md active:scale-95 min-h-[44px]",
                categorySelected && "ring-2 ring-brand-600 bg-brand-50 shadow-md"
              )}
              onClick={() => handleMajorCategoryClick(majorCat.id)}
            >
              <CardContent className="p-2 sm:p-3 flex flex-col items-center text-center gap-1 sm:gap-2">
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-transform",
                  `bg-gradient-to-br ${majorCat.color}`,
                  categorySelected && "scale-110"
                )}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium leading-tight line-clamp-2">
                  {getShortLabel(majorCat.label, majorCat.id)}
                </span>
                {categorySelected && mode === 'single' && (
                  <Badge className="bg-brand-600 text-[8px] sm:text-[10px] px-1 py-0">
                    <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5" />
                    <span className="hidden sm:inline">Gewählt</span>
                  </Badge>
                )}
                {mode === 'multi' && subcatCount > 0 && (
                  <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1 py-0">
                    {subcatCount}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subcategory Selection (only for multi mode with showSubcategories) */}
      {mode === 'multi' && showSubcategories && selectedArray.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Fachgebiete (optional)</h4>
          <Accordion 
            type="multiple" 
            value={expandedCategories}
            onValueChange={setExpandedCategories}
            className="space-y-2"
          >
            {Object.values(majorCategories)
              .filter(cat => isSelected(cat.id))
              .map((majorCat) => {
                const selectedSubcatCount = getSelectedSubcategoryCount(majorCat.id);
                const Icon = majorCat.icon;
                
                return (
                  <AccordionItem 
                    key={majorCat.id} 
                    value={majorCat.id}
                    className="border rounded-lg px-3"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white",
                          `bg-gradient-to-br ${majorCat.color}`
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{majorCat.label}</span>
                        {selectedSubcatCount > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {selectedSubcatCount}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {majorCat.subcategories.map(subcatId => {
                          const subcat = subcategoryLabels[subcatId];
                          if (!subcat) return null;
                          const subcatSelected = isSelected(subcatId);
                          
                          return (
                            <div 
                              key={subcatId} 
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                id={`subcat-${subcatId}`}
                                checked={subcatSelected}
                                onCheckedChange={() => handleSubcategoryToggle(subcatId, majorCat.id)}
                              />
                              <label 
                                htmlFor={`subcat-${subcatId}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {subcat.label}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        </div>
      )}
    </div>
  );
};
