import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { CheckCircle, Edit2, Send, ThumbsUp } from 'lucide-react';

interface CategoryRatings {
  quality: number;
  punctuality: number;
  communication: number;
  cleanliness: number;
  value: number;
}

interface ReviewPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handwerkerName: string;
  leadTitle: string;
  rating: number;
  categoryRatings: CategoryRatings;
  wouldRecommend: boolean | null;
  title: string;
  comment: string;
  onEdit: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const CATEGORY_LABELS: Record<keyof CategoryRatings, string> = {
  quality: 'Qualität der Arbeit',
  punctuality: 'Pünktlichkeit',
  communication: 'Kommunikation',
  cleanliness: 'Sauberkeit',
  value: 'Preis-Leistung',
};

export const ReviewPreviewModal: React.FC<ReviewPreviewModalProps> = ({
  open,
  onOpenChange,
  handwerkerName,
  leadTitle,
  rating,
  categoryRatings,
  wouldRecommend,
  title,
  comment,
  onEdit,
  onConfirm,
  isSubmitting,
}) => {
  const hasAnyCategoryRating = Object.values(categoryRatings).some(r => r > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Bewertung überprüfen
          </DialogTitle>
          <DialogDescription>
            So wird Ihre Bewertung für {handwerkerName} angezeigt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Job reference */}
          <div className="text-sm text-muted-foreground">
            Auftrag: "{leadTitle}"
          </div>

          {/* Overall rating */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">{rating.toFixed(1)}</span>
            <StarRating rating={rating} size="md" />
          </div>

          {/* Category ratings */}
          {hasAnyCategoryRating && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-sm font-medium text-muted-foreground">Detailbewertung</p>
              <div className="grid gap-2">
                {(Object.entries(categoryRatings) as [keyof CategoryRatings, number][]).map(
                  ([key, value]) =>
                    value > 0 && (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{CATEGORY_LABELS[key]}</span>
                        <StarRating rating={value} size="sm" />
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Would recommend */}
          {wouldRecommend !== null && (
            <div className="flex items-center gap-2 border-t pt-3">
              <ThumbsUp className={`h-4 w-4 ${wouldRecommend ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm">
                {wouldRecommend ? 'Würde ich weiterempfehlen' : 'Würde ich nicht weiterempfehlen'}
              </span>
            </div>
          )}

          {/* Title */}
          {title && (
            <div className="border-t pt-3">
              <p className="font-medium">{title}</p>
            </div>
          )}

          {/* Comment */}
          {comment && (
            <div className={!title ? 'border-t pt-3' : ''}>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onEdit} disabled={isSubmitting}>
            <Edit2 className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Bewertung absenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
