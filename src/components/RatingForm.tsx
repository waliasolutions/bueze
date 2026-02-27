import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/ui/star-rating';
import { validateReviewContent, MAX_REVIEW_LENGTH } from '@/lib/reviewValidation';
import { invalidateReviewQueries } from '@/lib/queryInvalidation';

interface RatingFormProps {
  leadId: string;
  handwerkerId: string;
  handwerkerName: string;
  leadTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RatingForm: React.FC<RatingFormProps> = ({
  leadId,
  handwerkerId,
  handwerkerName,
  leadTitle,
  onSuccess,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    // Validate
    if (rating === 0) {
      setError('Bitte wählen Sie mindestens einen Stern aus.');
      return;
    }

    // Validate comment if provided
    if (comment.trim().length > 0) {
      const validation = validateReviewContent(comment);
      if (validation.errors.length > 0) {
        setError(validation.errors[0]);
        return;
      }
    }

    setError(null);
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the lead has been delivered by the handwerker before allowing review
      const { data: leadData } = await supabase
        .from('leads')
        .select('delivered_at, accepted_proposal_id')
        .eq('id', leadId)
        .single();

      if (!leadData?.delivered_at) {
        setError('Bewertung erst möglich, nachdem der Handwerker den Auftrag als erledigt gemeldet hat.');
        return;
      }

      // Check if this is a verified review (accepted proposal exists)
      const isVerified = !!leadData.accepted_proposal_id;

      const { data: insertedReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          lead_id: leadId,
          reviewer_id: user.id,
          reviewed_id: handwerkerId,
          rating,
          comment: comment.trim() || null,
          is_public: true,
          is_verified: isVerified,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          toast({
            title: 'Bereits bewertet',
            description: 'Sie haben diesen Auftrag bereits bewertet.',
            variant: 'destructive',
          });
        } else {
          throw insertError;
        }
        return;
      }

      // Create admin notification for low-star reviews (1-2 stars)
      if (rating <= 2 && insertedReview) {
        try {
          await supabase.from('admin_notifications').insert({
            type: 'low_rating_alert',
            title: 'Niedrige Bewertung erhalten',
            message: `${handwerkerName} hat eine ${rating}-Sterne Bewertung für "${leadTitle}" erhalten.`,
            related_id: insertedReview.id,
            metadata: {
              review_id: insertedReview.id,
              handwerker_id: handwerkerId,
              lead_id: leadId,
              rating,
              has_comment: !!comment.trim(),
            }
          });
        } catch (notifError) {
          console.error('Failed to create admin notification for low rating:', notifError);
        }
      }

      await invalidateReviewQueries(queryClient, handwerkerId);

      toast({
        title: 'Bewertung abgegeben',
        description: 'Vielen Dank für Ihre Bewertung!',
      });

      onSuccess?.();
    } catch (err) {
      console.error('Error submitting review:', err);
      toast({
        title: 'Fehler',
        description: 'Die Bewertung konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Bewertung für {handwerkerName}</CardTitle>
        <CardDescription className="text-sm">
          Auftrag: {leadTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Star Rating - Simple, no hover state */}
          <div>
            <Label className="mb-2 block text-sm">Wie zufrieden waren Sie? *</Label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={(newRating) => {
                setRating(newRating);
                setError(null);
              }}
            />
          </div>

          {/* Comment - Optional */}
          <div>
            <Label htmlFor="comment" className="text-sm">Kommentar (optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError(null);
              }}
              placeholder="Beschreiben Sie kurz Ihre Erfahrung..."
              rows={3}
              maxLength={MAX_REVIEW_LENGTH}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {comment.length}/{MAX_REVIEW_LENGTH}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Wird gesendet...' : 'Bewertung abgeben'}
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
  );
};
