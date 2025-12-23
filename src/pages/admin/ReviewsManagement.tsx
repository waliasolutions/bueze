import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ManagementPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdminGuard } from '@/hooks/useAuthGuard';
import { Star, Eye, EyeOff, Trash2, Search, ArrowLeft, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { EmptyState } from '@/components/ui/empty-state';
import { StarRating } from '@/components/ui/star-rating';
import { invalidateReviewQueries } from '@/lib/queryInvalidation';
import type { ReviewForAdmin } from '@/types/entities';

const ReviewsManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { loading: authLoading, isAuthorized } = useAdminGuard();
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewForAdmin[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewForAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && isAuthorized) {
      loadReviews();
    }
  }, [authLoading, isAuthorized]);

  useEffect(() => {
    applyFilters();
  }, [reviews, searchTerm, filterRating, filterVisibility]);

  const loadReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related data for each review
      const enrichedReviews = await Promise.all(
        (reviewsData || []).map(async (review) => {
          // Get reviewer info
          const { data: reviewer } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', review.reviewer_id)
            .single();

          // Get handwerker info
          const { data: handwerker } = await supabase
            .from('handwerker_profiles')
            .select('first_name, last_name, company_name')
            .eq('user_id', review.reviewed_id)
            .single();

          // Get lead info
          const { data: lead } = await supabase
            .from('leads')
            .select('title')
            .eq('id', review.lead_id)
            .single();

          return {
            ...review,
            reviewer,
            handwerker,
            lead,
          };
        })
      );

      setReviews(enrichedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: 'Fehler',
        description: 'Bewertungen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(term) ||
        r.comment?.toLowerCase().includes(term) ||
        r.reviewer?.full_name?.toLowerCase().includes(term) ||
        r.handwerker?.first_name?.toLowerCase().includes(term) ||
        r.handwerker?.last_name?.toLowerCase().includes(term) ||
        r.handwerker?.company_name?.toLowerCase().includes(term)
      );
    }

    // Rating filter
    if (filterRating !== 'all') {
      filtered = filtered.filter(r => r.rating === parseInt(filterRating));
    }

    // Visibility filter
    if (filterVisibility === 'public') {
      filtered = filtered.filter(r => r.is_public);
    } else if (filterVisibility === 'hidden') {
      filtered = filtered.filter(r => !r.is_public);
    }

    setFilteredReviews(filtered);
  };

  const toggleVisibility = async (reviewId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_public: !currentVisibility })
        .eq('id', reviewId);

      if (error) throw error;

      const review = reviews.find(r => r.id === reviewId);
      
      setReviews(prev =>
        prev.map(r => r.id === reviewId ? { ...r, is_public: !currentVisibility } : r)
      );

      // Invalidate review queries to refresh cache
      await invalidateReviewQueries(queryClient, review?.reviewed_id);

      toast({
        title: 'Erfolg',
        description: `Bewertung ist jetzt ${!currentVisibility ? 'öffentlich' : 'versteckt'}.`,
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht geändert werden.',
        variant: 'destructive',
      });
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.filter(r => r.id !== reviewId));

      // Invalidate review queries to refresh cache
      await invalidateReviewQueries(queryClient, review?.reviewed_id);

      toast({
        title: 'Erfolg',
        description: 'Bewertung wurde gelöscht.',
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Fehler',
        description: 'Bewertung konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const totalReviews = reviews.length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0';
  const publicCount = reviews.filter(r => r.is_public).length;
  const hiddenCount = reviews.filter(r => !r.is_public).length;
  const withResponse = reviews.filter(r => r.handwerker_response).length;

  const isReady = !authLoading && isAuthorized && !isLoading;

  if (authLoading) {
    return (
      <AdminLayout title="Bewertungen verwalten" description="Übersicht und Moderation aller Plattform-Bewertungen">
        <ManagementPageSkeleton />
      </AdminLayout>
    );
  }

  if (!isAuthorized) return null;

  return (
    <AdminLayout title="Bewertungen verwalten" description="Übersicht und Moderation aller Plattform-Bewertungen" isLoading={!isReady}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalReviews}</div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold flex items-center gap-1">
                  {averageRating}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-sm text-muted-foreground">Durchschnitt</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{publicCount}</div>
                <p className="text-sm text-muted-foreground">Öffentlich</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-600">{hiddenCount}</div>
                <p className="text-sm text-muted-foreground">Versteckt</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{withResponse}</div>
                <p className="text-sm text-muted-foreground">Mit Antwort</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suchen nach Name, Firma, Kommentar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Bewertung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Sterne</SelectItem>
                    <SelectItem value="5">5 Sterne</SelectItem>
                    <SelectItem value="4">4 Sterne</SelectItem>
                    <SelectItem value="3">3 Sterne</SelectItem>
                    <SelectItem value="2">2 Sterne</SelectItem>
                    <SelectItem value="1">1 Stern</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterVisibility} onValueChange={setFilterVisibility}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Sichtbarkeit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="public">Öffentlich</SelectItem>
                    <SelectItem value="hidden">Versteckt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bewertungen ({filteredReviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReviews.length === 0 ? (
                <EmptyState 
                  variant="reviews"
                  title="Keine Bewertungen gefunden"
                  description="Es wurden keine Bewertungen gefunden, die Ihren Filterkriterien entsprechen."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden sm:table-cell">Datum</TableHead>
                        <TableHead>Bewertung</TableHead>
                        <TableHead className="hidden md:table-cell">Kunde</TableHead>
                        <TableHead>Handwerker</TableHead>
                        <TableHead className="hidden lg:table-cell">Kommentar</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="hidden sm:table-cell whitespace-nowrap">
                            {format(new Date(review.created_at), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <StarRating rating={review.rating} size="sm" />
                              {review.title && (
                                <span className="text-sm font-medium">{review.title}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm">
                              {review.reviewer?.full_name || 'Unbekannt'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {review.handwerker?.company_name || 
                               `${review.handwerker?.first_name} ${review.handwerker?.last_name}`}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-xs">
                            <div className="text-sm truncate" title={review.comment || ''}>
                              {review.comment || '-'}
                            </div>
                            {review.handwerker_response && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                                <MessageSquare className="h-3 w-3" />
                                Antwort vorhanden
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={review.is_public ? 'default' : 'secondary'}>
                              {review.is_public ? 'Öffentlich' : 'Versteckt'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleVisibility(review.id, review.is_public)}
                                title={review.is_public ? 'Verstecken' : 'Öffentlich machen'}
                              >
                                {review.is_public ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Bewertung löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Diese Aktion kann nicht rückgängig gemacht werden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                    <AlertDialogCancel className="w-full sm:w-auto">Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteReview(review.id)}
                                      className="w-full sm:w-auto bg-destructive text-destructive-foreground"
                                    >
                                      Löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
    </AdminLayout>
  );
};

export default ReviewsManagement;
