 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Star } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
 import { ReviewCard } from "@/components/ReviewCard";
import type { ReviewForHandwerker } from "@/types/entities";

interface HandwerkerReviewResponseProps {
  reviews: ReviewForHandwerker[];
  onReviewUpdated: () => void;
}

export const HandwerkerReviewResponse = ({ reviews, onReviewUpdated }: HandwerkerReviewResponseProps) => {
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
       {reviews.map((review) => (
         <ReviewCard
           key={review.id}
           review={review}
           onReviewUpdated={onReviewUpdated}
           canRespond={true}
           showAdminActions={false}
         />
       ))}
    </div>
  );
};
