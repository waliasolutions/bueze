import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, AlertCircle, AlertTriangle, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StarRating, getRatingLabel } from '@/components/ui/star-rating';
import { CategoryRatings, CategoryRatingsValues } from '@/components/CategoryRatings';
import { ReviewPreviewModal } from '@/components/ReviewPreviewModal';
import { validateReviewContent, MIN_REVIEW_LENGTH, MAX_REVIEW_LENGTH } from '@/lib/reviewValidation';
import { invalidateReviewQueries } from '@/lib/queryInvalidation';

interface RatingFormProps {
  leadId: string;
  handwerkerId: string;
  handwerkerName: string;
  leadTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialCategoryRatings: CategoryRatingsValues = {
  quality: 0,
  punctuality: 0,
  communication: 0,
  cleanliness: 0,
  value: 0,
};

export const RatingForm: React.FC<RatingFormProps> = ({
  leadId,
  handwerkerId,
  handwerkerName,
  leadTitle,
  onSuccess,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatingsValues>(initialCategoryRatings);
  const [hoveredCategoryRatings, setHoveredCategoryRatings] = useState<CategoryRatingsValues>(initialCategoryRatings);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCategoryHover = (category: keyof CategoryRatingsValues, rating: number) => {
    setHoveredCategoryRatings(prev => ({ ...prev, [category]: rating }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check overall rating
    if (rating === 0) {
      errors.push('Bitte wählen Sie mindestens einen Stern aus.');
    }

    // Validate comment content if provided
    if (comment.trim().length > 0) {
      const validation = validateReviewContent(comment);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);

    return errors.length === 0;
  };

  const handlePreviewClick = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if this is a verified review (proposal accepted and lead completed)
      const { data: proposalData } = await supabase
        .from('lead_proposals')
        .select('status')
        .eq('lead_id', leadId)
        .eq('handwerker_id', handwerkerId)
        .eq('status', 'accepted')
        .maybeSingle();

      const isVerified = !!proposalData;

      const { error } = await supabase
        .from('reviews')
        .insert({
          lead_id: leadId,
          reviewer_id: user.id,
          reviewed_id: handwerkerId,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
          is_public: true,
          quality_rating: categoryRatings.quality || null,
          punctuality_rating: categoryRatings.punctuality || null,
          communication_rating: categoryRatings.communication || null,
          cleanliness_rating: categoryRatings.cleanliness || null,
          value_rating: categoryRatings.value || null,
          would_recommend: wouldRecommend,
          is_verified: isVerified,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Bereits bewertet',
            description: 'Sie haben diesen Auftrag bereits bewertet.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      // Invalidate review queries to refresh cache
      await invalidateReviewQueries(queryClient, handwerkerId);

      toast({
        title: 'Bewertung abgegeben',
        description: 'Vielen Dank für Ihre Bewertung!',
      });

      setShowPreview(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Fehler',
        description: 'Die Bewertung konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bewertung abgeben</CardTitle>
          <CardDescription>
            Wie war Ihre Erfahrung mit {handwerkerName} für "{leadTitle}"?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Overall Star Rating */}
            <div>
              <Label className="mb-2 block">Gesamtbewertung *</Label>
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onRatingChange={setRating}
                hoveredRating={hoveredRating}
                onHover={setHoveredRating}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {getRatingLabel(displayRating)}
              </p>
            </div>

            {/* Category Ratings */}
            <CategoryRatings
              values={categoryRatings}
              onChange={setCategoryRatings}
              hoveredRatings={hoveredCategoryRatings}
              onHover={handleCategoryHover}
            />

            {/* Would Recommend Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="would-recommend" className="cursor-pointer">
                  Würde ich weiterempfehlen
                </Label>
              </div>
              <Switch
                id="would-recommend"
                checked={wouldRecommend === true}
                onCheckedChange={(checked) => setWouldRecommend(checked ? true : false)}
              />
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Titel (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Sehr zufrieden mit der Arbeit"
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment">Kommentar (optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  // Clear validation on change
                  if (validationErrors.length > 0 || validationWarnings.length > 0) {
                    setValidationErrors([]);
                    setValidationWarnings([]);
                  }
                }}
                placeholder="Beschreiben Sie Ihre Erfahrung..."
                rows={4}
                maxLength={MAX_REVIEW_LENGTH}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {comment.length > 0 && comment.length < MIN_REVIEW_LENGTH && (
                    <span className="text-destructive">
                      Mindestens {MIN_REVIEW_LENGTH} Zeichen erforderlich
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {comment.length}/{MAX_REVIEW_LENGTH} Zeichen
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handlePreviewClick}
                disabled={submitting || rating === 0}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Vorschau anzeigen
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Abbrechen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <ReviewPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        handwerkerName={handwerkerName}
        leadTitle={leadTitle}
        rating={rating}
        categoryRatings={categoryRatings}
        wouldRecommend={wouldRecommend}
        title={title}
        comment={comment}
        onEdit={() => setShowPreview(false)}
        onConfirm={handleSubmit}
        isSubmitting={submitting}
      />
    </>
  );
};
