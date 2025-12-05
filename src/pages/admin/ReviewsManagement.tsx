import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, Eye, EyeOff, Trash2, Search, ArrowLeft, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  handwerker_response: string | null;
  response_at: string | null;
  is_public: boolean;
  created_at: string;
  reviewer_id: string;
  reviewed_id: string;
  lead_id: string;
  reviewer?: { full_name: string; email: string };
  handwerker?: { first_name: string; last_name: string; company_name: string | null };
  lead?: { title: string };
}

const ReviewsManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reviews, searchTerm, filterRating, filterVisibility]);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin']);

      if (!roleData || roleData.length === 0) {
        toast({
          title: 'Zugriff verweigert',
          description: 'Sie haben keine Berechtigung für diese Seite.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadReviews();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

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

      setReviews(prev =>
        prev.map(r => r.id === reviewId ? { ...r, is_public: !currentVisibility } : r)
      );

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
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.filter(r => r.id !== reviewId));

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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // Stats
  const totalReviews = reviews.length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0';
  const publicCount = reviews.filter(r => r.is_public).length;
  const hiddenCount = reviews.filter(r => !r.is_public).length;
  const withResponse = reviews.filter(r => r.handwerker_response).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-2">Bewertungen verwalten</h1>
            <p className="text-muted-foreground">
              Übersicht und Moderation aller Plattform-Bewertungen
            </p>
          </div>

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
                  <SelectTrigger className="w-[150px]">
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
                  <SelectTrigger className="w-[150px]">
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
                <p className="text-center py-8 text-muted-foreground">
                  Keine Bewertungen gefunden.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Bewertung</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Handwerker</TableHead>
                        <TableHead>Kommentar</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(review.created_at), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {renderStars(review.rating)}
                              {review.title && (
                                <span className="text-sm font-medium">{review.title}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
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
                          <TableCell className="max-w-xs">
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
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteReview(review.id)}
                                      className="bg-destructive text-destructive-foreground"
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReviewsManagement;
