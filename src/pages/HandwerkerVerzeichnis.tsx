import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Star, Search, Shield, Mail, Phone } from 'lucide-react';
import { SWISS_CANTONS } from '@/config/cantons';
import { getCategoryLabel } from '@/config/categoryLabels';
import { majorCategories } from '@/config/majorCategories';
import { CardSkeleton } from '@/components/ui/page-skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface PublicHandwerker {
  id: string;
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
  service_areas: string[] | null;
}

const HandwerkerVerzeichnis = () => {
  const [handwerkers, setHandwerkers] = useState<PublicHandwerker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanton, setFilterCanton] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchHandwerkers();
  }, []);

  const fetchHandwerkers = async () => {
    try {
      const { data, error } = await supabase
        .from('handwerker_profiles_public')
        .select('id, company_name, first_name, last_name, business_city, business_canton, business_address, business_zip, email, phone_number, categories, bio, logo_url, is_verified, languages, service_areas')
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

  // Collect all unique category values from handwerker data
  const allCategories = [...new Set(handwerkers.flatMap(hw => hw.categories || []))].sort();

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

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name oder Ort suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterCanton} onValueChange={setFilterCanton}>
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
                <Select value={filterCategory} onValueChange={setFilterCategory}>
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
                <Card key={hw.id} className="hover:shadow-md transition-shadow">
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
                        <h3 className="font-semibold truncate">
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
                      {hw.is_verified && (
                        <Shield className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>

                    {hw.business_address && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {hw.business_address}
                      </p>
                    )}

                    {/* Contact details */}
                    <div className="space-y-1 mb-3">
                      {hw.email && (
                        <a href={`mailto:${hw.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{hw.email}</span>
                        </a>
                      )}
                      {hw.phone_number && (
                        <a href={`tel:${hw.phone_number}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <Phone className="h-3 w-3 shrink-0" />
                          {hw.phone_number}
                        </a>
                      )}
                    </div>

                    {hw.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {hw.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HandwerkerVerzeichnis;
