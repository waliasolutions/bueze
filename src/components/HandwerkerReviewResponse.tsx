import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, Send, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { StarRating } from "@/components/ui/star-rating";
import { invalidateReviewQueries } from "@/lib/queryInvalidation";
import type { ReviewForHandwerker } from "@/types/entities";

interface HandwerkerReviewResponseProps {
  reviews: ReviewForHandwerker[];
  onReviewUpdated: () => void;
}

export const HandwerkerReviewResponse = ({ reviews, onReviewUpdated }: HandwerkerReviewResponseProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Antwort ein.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          handwerker_response: responseText.trim(),
          response_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      // Invalidate review queries to refresh cache
      const review = reviews.find(r => r.id === reviewId);
      await invalidateReviewQueries(queryClient, review?.reviewed_id);

      toast({
        title: "Antwort gespeichert",
        description: "Ihre Antwort wurde erfolgreich veröffentlicht.",
      });

      setRespondingTo(null);
      setResponseText("");
      onReviewUpdated();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Fehler",
        description: "Antwort konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Noch keine Bewertungen</h3>
          <p className="text-muted-foreground">
            Sobald Kunden Ihre Arbeit bewerten, erscheinen die Bewertungen hier.
          </p>
        </CardContent>
      </Card>
    );
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StarRating rating={averageRating} size="sm" />
            Ihre Bewertungen
          </CardTitle>
          <CardDescription>
            Durchschnitt: {averageRating.toFixed(1)} von 5 Sternen ({reviews.length} Bewertung{reviews.length !== 1 ? 'en' : ''})
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Individual Reviews */}
      {reviews.map((review) => {
        const reviewerName = review.profiles?.first_name || 
          review.profiles?.full_name?.split(' ')[0] || 
          'Kunde';
        const projectTitle = review.leads?.title || 'Projekt';

        return (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} size="sm" />
                    <Badge variant="outline" className="text-xs">
                      {review.rating}/5
                    </Badge>
                  </div>
                  {review.title && (
                    <CardTitle className="text-base">{review.title}</CardTitle>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {reviewerName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(review.created_at), "dd. MMM yyyy", { locale: de })}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Projekt: {projectTitle}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Customer Comment */}
              {review.comment && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">{review.comment}</p>
                </div>
              )}

              {/* Handwerker Response */}
              {review.handwerker_response ? (
                <div className="border-l-2 border-primary pl-4 mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                    <MessageSquare className="h-4 w-4" />
                    Ihre Antwort
                    {review.response_at && (
                      <span className="text-xs text-muted-foreground font-normal">
                        • {format(new Date(review.response_at), "dd. MMM yyyy", { locale: de })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.handwerker_response}</p>
                </div>
              ) : respondingTo === review.id ? (
                <div className="space-y-3 mt-4">
                  <Textarea
                    placeholder="Schreiben Sie eine professionelle Antwort auf diese Bewertung..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitResponse(review.id)}
                      disabled={submitting || !responseText.trim()}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {submitting ? "Senden..." : "Antwort senden"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRespondingTo(null);
                        setResponseText("");
                      }}
                    >
                      Abbrechen
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tipp: Eine freundliche und professionelle Antwort zeigt Engagement und verbessert Ihren Eindruck bei zukünftigen Kunden.
                  </p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRespondingTo(review.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Antworten
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
