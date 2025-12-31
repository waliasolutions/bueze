import { useState, useEffect, useMemo } from 'react';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/ui/star-rating';
import { HandwerkerProfileModal } from '@/components/HandwerkerProfileModal';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Filter, Building2, X, ArrowUpDown } from 'lucide-react';
import { categoryLabels } from '@/config/categoryLabels';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { SWISS_CANTONS } from '@/config/cantons';
import { majorCategories } from '@/config/majorCategories';
import { cn } from '@/lib/utils';

interface HandwerkerListItem {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  logo_url: string | null;
  categories: string[];
  service_areas: string[];
  business_city: string | null;
  business_canton: string | null;
  is_verified: boolean | null;
  verification_status: string | null;
  created_at: string | null;
}

interface RatingStats {
  user_id: string;
  average_rating: number | null;
  review_count: number | null;
}

export default function HandwerkerVerzeichnis() {
  const [handwerkers, setHandwerkers] = useState<HandwerkerListItem[]>([]);
  const [ratings, setRatings] = useState<Map<string, RatingStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCanton, setSelectedCanton] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'newest'>('newest');
  
  // Modal state
  const [selectedHandwerkerId, setSelectedHandwerkerId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchHandwerkers();
  }, []);

  const fetchHandwerkers = async () => {
    setLoading(true);
    try {
      const [handwerkersRes, ratingsRes] = await Promise.all([
        supabase
          .from('handwerker_profiles_public')
          .select('id, user_id, first_name, last_name, company_name, logo_url, categories, service_areas, business_city, business_canton, is_verified, verification_status, created_at')
          .eq('verification_status', 'approved'),
        supabase
          .from('handwerker_rating_stats')
          .select('user_id, average_rating, review_count')
      ]);

      if (handwerkersRes.data) {
        setHandwerkers(handwerkersRes.data);
      }

      if (ratingsRes.data) {
        const ratingsMap = new Map<string, RatingStats>();
        ratingsRes.data.forEach(r => {
          if (r.user_id) ratingsMap.set(r.user_id, r);
        });
        setRatings(ratingsMap);
      }
    } catch (error) {
      console.error('Error fetching handwerkers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHandwerkers = useMemo(() => {
    let result = handwerkers.filter(h => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = `${h.first_name || ''} ${h.last_name || ''} ${h.company_name || ''}`.toLowerCase();
        if (!name.includes(query)) return false;
      }

      // Canton filter
      if (selectedCanton !== 'all') {
        if (!h.service_areas?.includes(selectedCanton) && h.business_canton !== selectedCanton) {
          return false;
        }
      }

      // Category filter - match if any of handwerker's categories belong to the selected major category
      if (selectedCategory !== 'all') {
        const hasMatchingCategory = h.categories?.some(cat => {
          // Direct match with major category
          if (cat === selectedCategory) return true;
          
          // Check if subcategory belongs to selected major category via subcategoryLabels
          const subcatInfo = subcategoryLabels[cat];
          if (subcatInfo && subcatInfo.majorCategoryId === selectedCategory) return true;
          
          // Handle legacy categories - check if it's listed in the major category's subcategories
          const majorCat = Object.values(majorCategories).find(m => m.id === selectedCategory);
          if (majorCat?.subcategories.includes(cat)) return true;
          
          return false;
        });
        
        if (!hasMatchingCategory) return false;
      }

      return true;
    });

    // Sort results
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = getDisplayName(a).toLowerCase();
        const nameB = getDisplayName(b).toLowerCase();
        return nameA.localeCompare(nameB);
      }
      
      if (sortBy === 'rating') {
        const ratingA = a.user_id ? ratings.get(a.user_id)?.average_rating ?? 0 : 0;
        const ratingB = b.user_id ? ratings.get(b.user_id)?.average_rating ?? 0 : 0;
        return ratingB - ratingA; // Descending
      }
      
      // newest
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Descending
    });

    return result;
  }, [handwerkers, searchQuery, selectedCanton, selectedCategory, sortBy, ratings]);

  const getDisplayName = (h: HandwerkerListItem) => {
    if (h.company_name) return h.company_name;
    return `${h.first_name || ''} ${h.last_name || ''}`.trim() || 'Handwerker';
  };

  const getCategoryLabel = (category: string) => {
    // First check major categories by exact ID
    if (categoryLabels[category as keyof typeof categoryLabels]) {
      return categoryLabels[category as keyof typeof categoryLabels];
    }
    
    // Then check subcategories
    if (subcategoryLabels[category]) {
      return subcategoryLabels[category].label;
    }
    
    // Try to match partial major category ID (e.g., innenausbau -> innenausbau_schreiner)
    const partialMatch = Object.keys(categoryLabels).find(key => key.startsWith(category) || category.startsWith(key));
    if (partialMatch) {
      return categoryLabels[partialMatch as keyof typeof categoryLabels];
    }
    
    // Final fallback: format the raw value nicely
    return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const isMajorCategory = (category: string): boolean => {
    return !!categoryLabels[category as keyof typeof categoryLabels] || 
           Object.keys(categoryLabels).some(k => k.startsWith(category) || category.startsWith(k));
  };

  const openProfile = (handwerkerId: string | null) => {
    if (handwerkerId) {
      setSelectedHandwerkerId(handwerkerId);
      setModalOpen(true);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCanton('all');
    setSelectedCategory('all');
  };

  const hasActiveFilters = searchQuery || selectedCanton !== 'all' || selectedCategory !== 'all';

  const majorCategoryList = Object.values(majorCategories);

  return (
    <>
      <DynamicHelmet
        title="Handwerker-Verzeichnis | Geprüfte Fachbetriebe in der Schweiz"
        description="Finden Sie geprüfte Handwerker in Ihrer Region. Durchsuchen Sie unser Verzeichnis nach Kategorie, Kanton und Bewertungen. Kostenlos und unverbindlich."
        robotsMeta="noindex,nofollow"
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Handwerker-Verzeichnis
              </h1>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
                Finden Sie den passenden Fachbetrieb für Ihr Projekt. Alle Handwerker wurden geprüft.
              </p>

              {/* Search & Filters */}
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Nach Name oder Firma suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base bg-background"
                  />
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap gap-3">
                  <Select value={selectedCanton} onValueChange={setSelectedCanton}>
                    <SelectTrigger className="w-[180px] bg-background">
                      <MapPin className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Kanton" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Kantone</SelectItem>
                      {SWISS_CANTONS.map((canton) => (
                        <SelectItem key={canton.value} value={canton.value}>{canton.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px] bg-background">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Kategorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Kategorien</SelectItem>
                      {majorCategoryList.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'rating' | 'newest')}>
                    <SelectTrigger className="w-[180px] bg-background">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sortieren" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Neueste zuerst</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="rating">Beste Bewertung</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="gap-2">
                      <X className="h-4 w-4" />
                      Filter zurücksetzen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section className="py-8 md:py-12">
            <div className="container mx-auto px-4">
              {/* Results Count */}
              <p className="text-sm text-muted-foreground mb-6">
                {filteredHandwerkers.length} Handwerker gefunden
              </p>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Skeleton className="h-16 w-16 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-full mt-4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredHandwerkers.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine Handwerker gefunden</h3>
                  <p className="text-muted-foreground mb-4">
                    Versuchen Sie andere Filterkriterien oder setzen Sie die Filter zurück.
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Filter zurücksetzen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHandwerkers.map((handwerker) => {
                    const ratingData = handwerker.user_id ? ratings.get(handwerker.user_id) : null;
                    
                    return (
                      <Card 
                        key={handwerker.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => openProfile(handwerker.user_id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {handwerker.logo_url ? (
                              <div className="h-16 w-16 rounded-full border border-border flex items-center justify-center bg-white overflow-hidden">
                                <img
                                  src={handwerker.logo_url}
                                  alt={getDisplayName(handwerker)}
                                  className="max-h-14 max-w-14 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-primary" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                {getDisplayName(handwerker)}
                              </h3>
                              
                              {(handwerker.business_city || handwerker.business_canton) && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {handwerker.business_city}
                                  {handwerker.business_canton && ` (${handwerker.business_canton})`}
                                </p>
                              )}

                              {ratingData && ratingData.review_count && ratingData.review_count > 0 && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <StarRating rating={ratingData.average_rating || 0} size="sm" />
                                  <span className="text-xs text-muted-foreground">
                                    ({ratingData.review_count})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Categories */}
                          {handwerker.categories && handwerker.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4">
                              {handwerker.categories.slice(0, 3).map((cat) => (
                                <Badge 
                                  key={cat} 
                                  variant={isMajorCategory(cat) ? "default" : "secondary"}
                                  className={cn("text-xs", isMajorCategory(cat) && "bg-primary/90")}
                                >
                                  {getCategoryLabel(cat)}
                                </Badge>
                              ))}
                              {handwerker.categories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{handwerker.categories.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* Profile Modal */}
      <HandwerkerProfileModal
        handwerkerId={selectedHandwerkerId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
