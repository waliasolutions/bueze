import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

/**
 * Reusable StarRating component - Single Source of Truth for star rendering
 * Uses CSS-only hover effects to prevent flickering (no React state on hover)
 */
export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 'md',
  showCount = false,
  count,
  interactive = false,
  onRatingChange,
  className,
}) => {
  const sizeClass = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className={cn('flex gap-0.5', interactive && 'star-rating-interactive')}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;
          const isPartiallyFilled = !isFilled && star <= Math.ceil(rating) && rating % 1 !== 0;

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                onClick={() => onRatingChange?.(star)}
                className="star-button p-0.5 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                data-star={star}
              >
                <Star
                  className={cn(
                    sizeClass,
                    'star-icon transition-transform',
                    isFilled
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  )}
                />
              </button>
            );
          }

          return (
            <Star
              key={star}
              className={cn(
                sizeClass,
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : isPartiallyFilled
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          );
        })}
      </div>
      
      {showCount && typeof count === 'number' && (
        <span className="text-sm text-muted-foreground ml-1">
          ({count})
        </span>
      )}
    </div>
  );
};

/**
 * Get rating label text for a given rating value
 */
export const getRatingLabel = (rating: number): string => {
  switch (rating) {
    case 1: return 'Sehr schlecht';
    case 2: return 'Schlecht';
    case 3: return 'Okay';
    case 4: return 'Gut';
    case 5: return 'Ausgezeichnet';
    default: return '';
  }
};
