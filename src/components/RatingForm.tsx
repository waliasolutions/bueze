import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StarRating, getRatingLabel } from '@/components/ui/star-rating';
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
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: 'Bewertung erforderlich',
        description: 'Bitte wählen Sie mindestens einen Stern aus.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bewertung abgeben</CardTitle>
        <CardDescription>
          Wie war Ihre Erfahrung mit {handwerkerName} für "{leadTitle}"?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <Label className="mb-2 block">Bewertung *</Label>
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
              onChange={(e) => setComment(e.target.value)}
              placeholder="Beschreiben Sie Ihre Erfahrung..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000 Zeichen
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting || rating === 0} className="flex-1">
              {submitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Bewertung abgeben
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Abbrechen
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};