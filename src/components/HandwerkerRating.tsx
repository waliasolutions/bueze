import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateRelative } from '@/lib/swissTime';
import { StarRating } from '@/components/ui/star-rating';
import type { ReviewWithDetails, HandwerkerRatingStats } from '@/types/entities';

interface HandwerkerRatingProps {
  handwerkerId: string;
  showReviews?: boolean;
  compact?: boolean;
}

export const HandwerkerRating: React.FC<HandwerkerRatingProps> = ({
  handwerkerId,
  showReviews = false,
  compact = false,
}) => {
  const [stats, setStats] = useState<HandwerkerRatingStats | null>(null);
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatingData();
  }, [handwerkerId]);

  const fetchRatingData = async () => {
    try {
      // Fetch rating statistics
      const { data: statsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', handwerkerId)
        .eq('is_public', true);

      if (statsData && statsData.length > 0) {
        const avgRating = statsData.reduce((sum, r) => sum + r.rating, 0) / statsData.length;
        setStats({
          average_rating: Math.round(avgRating * 10) / 10,
          review_count: statsData.length,
        });
      }

      // Fetch individual reviews if needed
      if (showReviews) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            title,
            comment,
            created_at,
            handwerker_response,
            response_at,
            lead_id,
            reviewer_id,
            reviewed_id,
            is_public,
            reviewer:profiles!reviewer_id(full_name),
            lead:leads!lead_id(title, category)
          `)
          .eq('reviewed_id', handwerkerId)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        setReviews((reviewsData as ReviewWithDetails[]) || []);
      }
    } catch (error) {
      console.error('Error fetching rating data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-6 w-24 bg-muted animate-pulse rounded" />;
  }

  if (!stats) {
    if (compact) return null;
    return (
      <p className="text-sm text-muted-foreground">Noch keine Bewertungen</p>
    );
  }

  // Compact display for cards/lists
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StarRating rating={stats.average_rating ?? 0} size="sm" />
        <span className="text-sm font-medium">{stats.average_rating}</span>
        <span className="text-sm text-muted-foreground">
          ({stats.review_count})
        </span>
      </div>
    );
  }

  // Full display with optional reviews list
  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="flex items-center gap-4">
        <StarRating rating={stats.average_rating ?? 0} />
        <div>
          <span className="text-2xl font-bold">{stats.average_rating}</span>
          <span className="text-muted-foreground ml-2">
            ({stats.review_count} {stats.review_count === 1 ? 'Bewertung' : 'Bewertungen'})
          </span>
        </div>
      </div>

      {/* Reviews List */}
      {showReviews && reviews.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="font-semibold">Bewertungen</h3>
          {reviews.map((review) => {
            const reviewerName = review.reviewer?.full_name?.split(' ')[0] || 'Kunde';
            
            return (
              <Card key={review.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <StarRating rating={review.rating} size="sm" />
                      {review.title && (
                        <h4 className="font-medium mt-1">{review.title}</h4>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateRelative(review.created_at)}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {review.comment}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{reviewerName}</span>
                    {review.lead && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {review.lead.category}
                        </Badge>
                      </>
                    )}
                  </div>

                  {/* Handwerker Response */}
                  {review.handwerker_response && (
                    <div className="mt-3 ml-4 pl-3 border-l-2 border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium">Antwort des Handwerkers</span>
                        {review.response_at && (
                          <span className="text-xs text-muted-foreground">
                            • {formatDateRelative(review.response_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.handwerker_response}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};