import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Star, Search, Mail, Phone, ArrowLeft, Eye } from 'lucide-react';
import { SWISS_CANTONS, getCantonLabel } from '@/config/cantons';
import { formatPhoneDisplay, formatPhoneHref } from '@/lib/displayFormatters';
import { getCategoryLabel } from '@/config/categoryLabels';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { CardSkeleton } from '@/components/ui/page-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { HandwerkerProfileModal } from '@/components/HandwerkerProfileModal';

interface PublicHandwerker {
  id: string;
  user_id: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  business_city: string | null;
  business_canton: string | null;
  business_address: string | null;
  business_zip: string | null;
  email: string | null;
  phone_number: string | null;
  categories: string[];
  bio: string | null;
  logo_url: string | null;
  is_verified: boolean | null;
  languages: string[] | null;
}

const HandwerkerVerzeichnis = () => {
  const [handwerkers, setHandwerkers] = useState<PublicHandwerker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanton, setFilterCanton] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showResults, setShowResults] = useState(false);
  const [selectedHandwerkerId, setSelectedHandwerkerId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleCardClick = (userId: string | null) => {
    if (!userId) return;
    setSelectedHandwerkerId(userId);
    setProfileModalOpen(true);
  };

  useEffect(() => {
    fetchHandwerkers();
  }, []);

  // Show results whenever a filter is active
  useEffect(() => {
    if (filterCanton !== 'all' || filterCategory !== 'all') {
      setShowResults(true);
    }
  }, [filterCanton, filterCategory]);

  const fetchHandwerkers = async () => {
    try {
      const { data, error } = await supabase
        .from('handwerker_profiles_public')
        .select('id, user_id, company_name, first_name, last_name, business_city, business_canton, business_address, business_zip, email, phone_number, categories, bio, logo_url, is_verified, languages')
        .eq('verification_status', 'approved')
        .eq('is_verified', true);

      if (error) throw error;
      setHandwerkers(data || []);
    } catch (error) {
      console.error('Error fetching handwerkers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHandwerkers = handwerkers.filter(hw => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      hw.company_name?.toLowerCase().includes(term) ||
      hw.first_name?.toLowerCase().includes(term) ||
      hw.last_name?.toLowerCase().includes(term) ||
      hw.business_city?.toLowerCase().includes(term);

    const matchesCanton = filterCanton === 'all' || hw.business_canton === filterCanton;
    const matchesCategory = filterCategory === 'all' || hw.categories?.includes(filterCategory);

    return matchesSearch && matchesCanton && matchesCategory;
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setShowResults(true);
    }
  };

  const handleCantonClick = (canton: string) => {
    setFilterCanton(canton);
    setShowResults(true);
  };

  const handleCategoryClick = (category: string) => {
    setFilterCategory(category);
    setShowResults(true);
  };

  const availableCantons = useMemo(() => {
    const result = new Set<string>();
    handwerkers.forEach(hw => {
      if (hw.business_canton) result.add(hw.business_canton);
    });
    return result;
  }, [handwerkers]);


  const handleBackToBrowse = () => {
    setShowResults(false);
    setFilterCanton('all');
    setFilterCategory('all');
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title="Handwerkerverzeichnis – Verifizierte Schweizer Handwerker | Büeze.ch"
        description="Finden Sie verifizierte Schweizer Handwerker in Ihrer Region. Qualitätsgeprüfte Fachleute für alle Handwerksarbeiten."
      />
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Handwerkerverzeichnis</h1>
            <p className="text-muted-foreground">
              Verifizierte Schweizer Handwerker in Ihrer Region
            </p>
          </div>

          {!showResults ? (
            <BrowseLayer
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onSearch={handleSearch}
              onCantonClick={handleCantonClick}
              onCategoryClick={handleCategoryClick}
              availableCantons={availableCantons}
            />
          ) : (
            <ResultsLayer
              loading={loading}
              searchTerm={searchTerm}
              filterCanton={filterCanton}
              filterCategory={filterCategory}
              filteredHandwerkers={filteredHandwerkers}
              handwerkers={handwerkers}
              onSearchTermChange={setSearchTerm}
              onFilterCantonChange={setFilterCanton}
              onFilterCategoryChange={setFilterCategory}
              onBackToBrowse={handleBackToBrowse}
              onCardClick={handleCardClick}
            />
          )}
          <HandwerkerProfileModal
            handwerkerId={selectedHandwerkerId}
            open={profileModalOpen}
            onOpenChange={(open) => {
              setProfileModalOpen(open);
              if (!open) setSelectedHandwerkerId(null);
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ── Browse Layer (Phase 1) ──────────────────────────────────────────

interface BrowseLayerProps {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  onSearch: () => void;
  onCantonClick: (canton: string) => void;
  onCategoryClick: (category: string) => void;
  availableCantons: Set<string>;
}

const BrowseLayer = ({ searchTerm, onSearchTermChange, onSearch, onCantonClick, onCategoryClick, availableCantons }: BrowseLayerProps) => {
  const filteredCantons = SWISS_CANTONS.filter(c => availableCantons.has(c.value));

  const categoriesWithSubs = Object.values(majorCategories)
    .map(category => {
      const subs = category.subcategories
        .map(subId => subcategoryLabels[subId])
        .filter(Boolean);
      return { ...category, subs };
    })
    .filter(category => category.subs.length > 0);

  return (
    <div className="space-y-10">
      {/* Search bar */}
      <div className="flex gap-2 max-w-2xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Handwerker, Firma oder Ort suchen..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={onSearch}>Suchen</Button>
      </div>

      {/* Cantons */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Kantone</h2>
        <div className="flex flex-wrap gap-2">
          {filteredCantons.map(canton => (
            <button
              key={canton.value}
              onClick={() => onCantonClick(canton.value)}
              className="px-3 py-1.5 rounded-full border border-border bg-card text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              {canton.label}
            </button>
          ))}
        </div>
      </section>

      {/* Categories with subcategories */}
      <section>
        <h2 className="text-xl font-semibold mb-6">Alle Kategorien</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesWithSubs.map(category => (
            <div key={category.id} className="space-y-2">
              <button
                onClick={() => onCategoryClick(category.subcategories[0] || category.id)}
                className="font-semibold text-foreground hover:text-primary transition-colors text-left text-base"
              >
                {category.label}
              </button>
              <ul className="space-y-1">
                {category.subs.map(sub => (
                  <li key={sub.value}>
                    <button
                      onClick={() => onCategoryClick(sub.value)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors text-left w-full"
                    >
                      {sub.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// ── Results Layer (Phase 2) ─────────────────────────────────────────

interface ResultsLayerProps {
  loading: boolean;
  searchTerm: string;
  filterCanton: string;
  filterCategory: string;
  filteredHandwerkers: PublicHandwerker[];
  handwerkers: PublicHandwerker[];
  onSearchTermChange: (v: string) => void;
  onFilterCantonChange: (v: string) => void;
  onFilterCategoryChange: (v: string) => void;
  onBackToBrowse: () => void;
  onCardClick: (userId: string | null) => void;
}

const ResultsLayer = ({
  loading, searchTerm, filterCanton, filterCategory,
  filteredHandwerkers, handwerkers,
  onSearchTermChange, onFilterCantonChange, onFilterCategoryChange,
  onBackToBrowse, onCardClick
}: ResultsLayerProps) => {
  const allCategories = Object.values(majorCategories)
    .flatMap(cat => cat.subcategories)
    .sort();

  return (
    <>
      {/* Back link */}
      <button
        onClick={onBackToBrowse}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </button>

      {/* Active filter badges */}
      {(filterCanton !== 'all' || filterCategory !== 'all') && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterCanton !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {getCantonLabel(filterCanton)}
              <button onClick={() => onFilterCantonChange('all')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          {filterCategory !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {getCategoryLabel(filterCategory)}
              <button onClick={() => onFilterCategoryChange('all')} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name oder Ort suchen..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCanton} onValueChange={onFilterCantonChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kanton" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kantone</SelectItem>
                {SWISS_CANTONS.map(canton => (
                  <SelectItem key={canton.value} value={canton.value}>
                    {canton.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {filteredHandwerkers.length} Handwerker gefunden
      </p>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : filteredHandwerkers.length === 0 ? (
        <EmptyState
          variant="search"
          description="Keine Handwerker mit diesen Filterkriterien gefunden."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredHandwerkers.map(hw => (
            <Card
              key={hw.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onCardClick(hw.user_id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-3">
                  {hw.logo_url ? (
                    <img
                      src={hw.logo_url}
                      alt={hw.company_name || ''}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold text-lg">
                      {(hw.company_name || hw.first_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">
                      {hw.company_name || `${hw.first_name || ''} ${hw.last_name || ''}`.trim()}
                    </h3>
                    {hw.business_city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hw.business_zip && `${hw.business_zip} `}{hw.business_city}
                        {hw.business_canton && `, ${hw.business_canton}`}
                      </p>
                    )}
                  </div>
                </div>

                {hw.business_address && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {hw.business_address}
                  </p>
                )}

                <div className="space-y-1 mb-3">
                  {hw.email && (
                    <a href={`mailto:${hw.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{hw.email}</span>
                    </a>
                  )}
                  {hw.phone_number && (
                    <a href={formatPhoneHref(hw.phone_number)} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="h-3 w-3 shrink-0" />
                      {formatPhoneDisplay(hw.phone_number)}
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(hw.categories || []).slice(0, 3).map(cat => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {getCategoryLabel(cat)}
                    </Badge>
                  ))}
                  {(hw.categories || []).length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{hw.categories.length - 3}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
                  <Eye className="h-3 w-3" />
                  Profil ansehen
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default HandwerkerVerzeichnis;
