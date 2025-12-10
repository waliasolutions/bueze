import React from 'react';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';

export interface CategoryRatingsValues {
  quality: number;
  punctuality: number;
  communication: number;
  cleanliness: number;
  value: number;
}

interface CategoryRatingsProps {
  values: CategoryRatingsValues;
  onChange: (values: CategoryRatingsValues) => void;
}

const CATEGORIES: { key: keyof CategoryRatingsValues; label: string; description: string }[] = [
  { key: 'quality', label: 'Qualität der Arbeit', description: 'Wie zufrieden waren Sie mit dem Ergebnis?' },
  { key: 'punctuality', label: 'Pünktlichkeit', description: 'War der Handwerker zuverlässig und pünktlich?' },
  { key: 'communication', label: 'Kommunikation', description: 'Wie gut war die Kommunikation?' },
  { key: 'cleanliness', label: 'Sauberkeit', description: 'Wurde der Arbeitsbereich sauber hinterlassen?' },
  { key: 'value', label: 'Preis-Leistung', description: 'War das Verhältnis von Preis und Leistung angemessen?' },
];

export const CategoryRatings: React.FC<CategoryRatingsProps> = ({
  values,
  onChange,
}) => {
  const handleRatingChange = (category: keyof CategoryRatingsValues, rating: number) => {
    onChange({ ...values, [category]: rating });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Detailbewertung (optional)</Label>
      <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
        {CATEGORIES.map(({ key, label, description }) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>
            </div>
            <div className="flex-shrink-0">
              <StarRating
                rating={values[key]}
                size="sm"
                interactive
                onRatingChange={(rating) => handleRatingChange(key, rating)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
