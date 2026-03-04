import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { logWithCorrelation, captureException } from '@/lib/errorTracking';
import { trackError } from '@/lib/errorCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, Coins, X, Filter, Globe } from 'lucide-react';
import { formatTimeAgo, formatBudget } from '@/lib/swissTime';
import { SWISS_CANTONS } from '@/config/cantons';
import { majorCategories } from '@/config/majorCategories';
import { EmptyState } from '@/components/ui/empty-state';
import type { LeadListItem, HandwerkerProfileBasic } from '@/types/entities';
import { getCategoryLabel } from '@/config/categoryLabels';
import { getUrgencyLabel, getUrgencyColor, URGENCY_LEVELS } from '@/config/urgencyLevels';
import { checkCategoryMatch, checkServiceAreaMatch } from '@/lib/leadHelpers';


const BrowseLeads = () => {
  const [allLeads, setAllLeads] = useState<LeadListItem[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajorCategory, setSelectedMajorCategory] = useState('all');
  const [selectedCanton, setSelectedCanton] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [handwerkerProfile, setHandwerkerProfile] = useState<HandwerkerProfileBasic | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    logWithCorrelation('BrowseLeads: Page loaded');
    initPage();
  }, []);

  // Re-apply filters when toggle/filter state changes
  useEffect(() => {
    applyFilters();
  }, [allLeads, searchTerm, selectedMajorCategory, selectedCanton, selectedUrgency, showAllCategories, showAllRegions]);

  const initPage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch handwerker profile
      const { data: profile } = await supabase
        .from('handwerker_profiles')
        .select('id, first_name, last_name, email, phone_number, company_name, bio, categories, service_areas, hourly_rate_min, hourly_rate_max, verification_status, is_verified')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile || !profile.is_verified || profile.verification_status !== 'approved') {
        toast({
          title: 'Profil nicht freigeschaltet',
          description: 'Ihr Profil muss vom Admin-Team freigeschaltet werden, bevor Sie Aufträge durchsuchen können.',
          variant: 'destructive',
          duration: 6000,
        });
        navigate('/dashboard');
        return;
      }

      setHandwerkerProfile(profile);

      // Fetch leads and existing proposals in parallel
      const [leadsResult, proposalsResult] = await Promise.all([
        supabase.from('leads').select('*').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('lead_proposals').select('lead_id').eq('handwerker_id', user.id),
      ]);

      if (leadsResult.error) throw leadsResult.error;

      // Exclude already-proposed leads and leads at max proposals
      const proposedLeadIds = new Set(proposalsResult.data?.map(p => p.lead_id) || []);
      const availableLeads = (leadsResult.data || []).filter(lead =>
        !proposedLeadIds.has(lead.id) &&
        (lead.proposals_count || 0) < (lead.max_purchases || 5)
      );

      setAllLeads(availableLeads);
    } catch (error) {
      const categorized = trackError(error);
      captureException(error as Error, { context: 'BrowseLeads:initPage', category: categorized.category });
      toast({
        title: 'Fehler',
        description: 'Beim Laden der Aufträge ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = allLeads;

    // Profile-based matching (default: only matching leads)
    if (handwerkerProfile) {
      const categories = handwerkerProfile.categories || [];
      const serviceAreas = handwerkerProfile.service_areas || [];

      if (!showAllCategories && categories.length > 0) {
        filtered = filtered.filter(lead => checkCategoryMatch(lead, categories));
      }
      if (!showAllRegions && serviceAreas.length > 0) {
        filtered = filtered.filter(lead => checkServiceAreaMatch(lead, serviceAreas));
      }
    }

    // Manual filters (search, category dropdown, canton, urgency)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.title.toLowerCase().includes(term) ||
        lead.description.toLowerCase().includes(term) ||
        lead.city.toLowerCase().includes(term)
      );
    }

    if (selectedMajorCategory !== 'all') {
      const majorCat = majorCategories[selectedMajorCategory];
      const validCategories = majorCat ? [majorCat.id, ...majorCat.subcategories] : [selectedMajorCategory];
      filtered = filtered.filter(lead => validCategories.includes(lead.category));
    }

    if (selectedCanton !== 'all') {
      filtered = filtered.filter(lead => lead.canton === selectedCanton);
    }

    if (selectedUrgency !== 'all') {
      filtered = filtered.filter(lead => lead.urgency === selectedUrgency);
    }

    setFilteredLeads(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMajorCategory('all');
    setSelectedCanton('all');
    setSelectedUrgency('all');
  };

  const hasActiveFilters = searchTerm || selectedMajorCategory !== 'all' || selectedCanton !== 'all' || selectedUrgency !== 'all';

  const handleViewOpportunity = (leadId: string) => {
    navigate(`/opportunity/${leadId}`);
  };

  // Count how many leads match profile vs total
  const matchingCount = handwerkerProfile ? allLeads.filter(lead => {
    const catMatch = (handwerkerProfile.categories || []).length === 0 || checkCategoryMatch(lead, handwerkerProfile.categories || []);
    const areaMatch = (handwerkerProfile.service_areas || []).length === 0 || checkServiceAreaMatch(lead, handwerkerProfile.service_areas || []);
    return catMatch && areaMatch;
  }).length : allLeads.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Aufträge durchsuchen</h1>
            <p className="text-muted-foreground">
              Finden Sie passende Aufträge in Ihrer Region
            </p>
          </div>

          {/* Profile Matching Toggles */}
          {handwerkerProfile && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground mr-1">
                <Filter className="h-4 w-4 inline mr-1" />
                Profil-Filter:
              </span>
              <Button
                variant={showAllCategories ? 'outline' : 'default'}
                size="sm"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                {showAllCategories ? 'Nur meine Kategorien' : 'Alle Kategorien'}
              </Button>
              <Button
                variant={showAllRegions ? 'outline' : 'default'}
                size="sm"
                onClick={() => setShowAllRegions(!showAllRegions)}
              >
                <Globe className="h-4 w-4 mr-1" />
                {showAllRegions ? 'Nur meine Region' : 'Alle Regionen'}
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                {matchingCount} passend / {allLeads.length} total
              </span>
            </div>
          )}

          {/* Compact Filter Bar */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Suche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={selectedMajorCategory} onValueChange={setSelectedMajorCategory}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Bereiche</SelectItem>
                    {Object.values(majorCategories).map((major) => (
                      <SelectItem key={major.id} value={major.id}>
                        {major.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedCanton} onValueChange={setSelectedCanton}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Kanton" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kantone</SelectItem>
                    {SWISS_CANTONS.map((canton) => (
                      <SelectItem key={canton.value} value={canton.value}>
                        {canton.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Dringlichkeit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Zeitrahmen</SelectItem>
                    {Object.entries(URGENCY_LEVELS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Zurücksetzen
                  </Button>
                )}
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {selectedMajorCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {Object.values(majorCategories).find(c => c.id === selectedMajorCategory)?.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedMajorCategory('all')} />
                  </Badge>
                )}
                {selectedCanton !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {SWISS_CANTONS.find(c => c.value === selectedCanton)?.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCanton('all')} />
                  </Badge>
                )}
                {selectedUrgency !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {getUrgencyLabel(selectedUrgency)}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedUrgency('all')} />
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchTerm}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredLeads.length}</span> {filteredLeads.length === 1 ? 'Auftrag' : 'Aufträge'} gefunden
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <EmptyState 
              variant="search"
              title="Keine Aufträge gefunden"
              description={hasActiveFilters 
                ? 'Versuchen Sie andere Filter oder setzen Sie die Suche zurück.'
                : (!showAllCategories || !showAllRegions)
                  ? 'Keine passenden Aufträge für Ihr Profil. Versuchen Sie "Alle Kategorien" oder "Alle Regionen".'
                  : 'Zurzeit gibt es keine verfügbaren Aufträge.'}
              action={hasActiveFilters ? {
                label: 'Alle Filter zurücksetzen',
                onClick: clearFilters,
              } : (!showAllCategories || !showAllRegions) ? {
                label: 'Alle Aufträge anzeigen',
                onClick: () => { setShowAllCategories(true); setShowAllRegions(true); },
              } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLeads.map((lead) => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg line-clamp-2">{lead.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{lead.zip} {lead.city}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{formatTimeAgo(lead.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        <Badge className={getUrgencyColor(lead.urgency)}>
                          {getUrgencyLabel(lead.urgency)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(lead.category)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {lead.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatBudget(lead.budget_min, lead.budget_max)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Offerten eingereicht</span>
                        <span>{lead.proposals_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/lead/${lead.id}`)}
                      >
                        Details
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewOpportunity(lead.id)}
                      >
                        Offerte einreichen
                      </Button>
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

export default BrowseLeads;
