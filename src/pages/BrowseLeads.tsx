import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { logWithCorrelation, captureException } from '@/lib/errorTracking';
import { trackError } from '@/lib/errorCategories';
import { supabaseQuery, calculatePagination, buildPaginatedResult, type PaginatedResult } from '@/lib/fetchHelpers';
import { getOrCreateRequestId, clearRequestId } from '@/lib/idempotency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, Coins, Search, ShoppingCart, Crown, AlertCircle, Filter, X } from 'lucide-react';
import { formatTimeAgo, formatNumber } from '@/lib/swissTime';
// TODO: Re-enable after types regenerate
// import { checkSubscriptionAccess, canPurchaseLeadWithPrice } from '@/lib/subscriptionHelpers';
import { canViewLead as canViewLeadByStatus } from '@/config/leadStatuses';
// import type { SubscriptionAccessCheck } from '@/lib/subscriptionHelpers';
import { SWISS_CANTONS } from '@/config/cantons';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';

interface Lead {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  urgency: string;
  canton: string;
  zip: string;
  city: string;
  created_at: string;
  purchased_count: number;
  max_purchases: number;
  quality_score: number;
  status: string;
}

const categoryLabels = {
  elektriker: 'Elektriker',
  sanitaer: 'Sanitär',
  heizung: 'Heizungsinstallateur',
  klimatechnik: 'Klimatechnik',
  maler: 'Maler',
  gipser: 'Gipser',
  bodenleger: 'Bodenleger',
  plattenleger: 'Plattenleger',
  schreiner: 'Schreiner',
  maurer: 'Maurer',
  zimmermann: 'Zimmermann',
  dachdecker: 'Dachdecker',
  fassadenbauer: 'Fassadenbauer',
  gartenbau: 'Gartenbau',
  pflasterarbeiten: 'Pflasterarbeiten',
  zaun_torbau: 'Zaun- und Torbau',
  fenster_tueren: 'Fenster & Türen',
  kuechenbau: 'Küchenbau',
  badumbau: 'Badumbau',
  umzug: 'Umzug & Transport',
  reinigung: 'Reinigung',
  schlosserei: 'Schlosserei',
  spengler: 'Spengler'
};

const urgencyLabels = {
  today: 'Heute',
  this_week: 'Diese Woche',
  this_month: 'Dieser Monat',
  planning: 'Planung'
};

const urgencyColors = {
  today: 'bg-red-100 text-red-800',
  this_week: 'bg-orange-100 text-orange-800',
  this_month: 'bg-blue-100 text-blue-800',
  planning: 'bg-gray-100 text-gray-800'
};


const BrowseLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajorCategory, setSelectedMajorCategory] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCanton, setSelectedCanton] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  // TODO: Re-enable after types regenerate
  // const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccessCheck | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get subcategories for selected major category
  const availableSubcategories = selectedMajorCategory !== 'all'
    ? Object.values(subcategoryLabels).filter(
        (sub) => sub.majorCategoryId === selectedMajorCategory
      )
    : Object.values(subcategoryLabels);

  useEffect(() => {
    logWithCorrelation('BrowseLeads: Page loaded');
    fetchLeads();
    checkUserSubscription();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, selectedMajorCategory, selectedCategory, selectedCanton, selectedUrgency]);

  // Reset subcategory when major category changes
  useEffect(() => {
    if (selectedMajorCategory !== 'all') {
      setSelectedCategory('all');
    }
  }, [selectedMajorCategory]);

  const checkUserSubscription = async () => {
    try {
      // TODO: Re-enable after types regenerate - DEMO MODE: Mock subscription access for pitch
      // setSubscriptionAccess({ 
      //   canViewLead: true, 
      //   canPurchaseLead: true, 
      //   isUnlimited: true, 
      //   remainingViews: 999, 
      //   requiresUpgrade: false,
      //   leadPrice: 20,
      //   planType: 'annual' 
      // });
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      logWithCorrelation('BrowseLeads: Fetching leads with pagination', { 
        page: currentPage, 
        pageSize 
      });
      
      // DEMO MODE: Mock user for pitch presentation
      const mockUser = { id: 'demo-user-123', email: 'demo@bueze.ch' };
      
      // if (!user) {
      //   navigate('/auth');
      //   return;
      // }

      // Calculate pagination range
      const { from, to } = calculatePagination({ page: currentPage, pageSize });

      // Fetch with retry and timeout - show all for demo
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      // Filter out leads that have reached max purchases (client-side for now)
      const availableLeads = (leadsData || []).filter(
        (lead: Lead) => lead.purchased_count < lead.max_purchases
      );

      logWithCorrelation('BrowseLeads: Leads fetched', { 
        count: availableLeads.length,
        page: currentPage
      });
      
      setLeads(availableLeads);
      setTotalCount(availableLeads.length);
    } catch (error) {
      const categorized = trackError(error);
      captureException(error as Error, { 
        context: 'fetchLeads',
        category: categorized.category,
        page: currentPage
      });
      logWithCorrelation('BrowseLeads: Error fetching leads', categorized);
      toast({
        title: "Fehler",
        description: "Beim Laden der Aufträge ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by major category first
    if (selectedMajorCategory && selectedMajorCategory !== 'all') {
      const majorCatSubcategories = Object.values(subcategoryLabels)
        .filter((sub) => sub.majorCategoryId === selectedMajorCategory)
        .map((sub) => sub.value);
      
      filtered = filtered.filter(lead => 
        majorCatSubcategories.includes(lead.category)
      );
    }

    // Then filter by specific subcategory
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(lead => lead.category === selectedCategory);
    }

    if (selectedCanton && selectedCanton !== 'all') {
      filtered = filtered.filter(lead => lead.canton === selectedCanton);
    }

    if (selectedUrgency && selectedUrgency !== 'all') {
      filtered = filtered.filter(lead => lead.urgency === selectedUrgency);
    }

    setFilteredLeads(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMajorCategory('all');
    setSelectedCategory('all');
    setSelectedCanton('all');
    setSelectedUrgency('all');
  };

  const hasActiveFilters = searchTerm || selectedMajorCategory !== 'all' || selectedCategory !== 'all' || selectedCanton !== 'all' || selectedUrgency !== 'all';

  const handlePurchaseLead = async (leadId: string) => {
    try {
      logWithCorrelation('BrowseLeads: Purchasing lead', { leadId });
      
      // Generate or retrieve request ID for idempotency
      const requestId = getOrCreateRequestId(`purchase_${leadId}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // TODO: Re-enable after types regenerate - Check subscription access
      // const { canPurchase, price } = await canPurchaseLeadWithPrice(user.id);
      // if (!canPurchase) {
      //   toast({
      //     title: "Upgrade erforderlich",
      //     description: "Bitte upgraden Sie Ihr Abonnement, um Aufträge zu kaufen.",
      //     variant: "destructive",
      //   });
      //   navigate('/profile?tab=subscription');
      //   return;
      // }

      // Temporary: Allow all purchases for now
      const price = 25;

      // Insert lead purchase with request_id for idempotency
      const { error: purchaseError } = await supabase
        .from('lead_purchases')
        .insert({
          lead_id: leadId,
          buyer_id: user.id,
          price: price * 100, // Convert CHF to cents
          request_id: requestId
        })
        .select();

      if (purchaseError) {
        throw purchaseError;
      }

      // Clear request ID after successful purchase
      clearRequestId(`purchase_${leadId}`);

      logWithCorrelation('BrowseLeads: Purchase successful', { 
        leadId, 
        requestId 
      });

      toast({
        title: "Auftrag gekauft!",
        description: `Sie haben den Auftrag für CHF ${price} erfolgreich gekauft.`,
      });
      
      // Refresh leads and subscription status
      fetchLeads();
      checkUserSubscription();
      
      // Navigate to lead details
      navigate(`/lead/${leadId}`);
    } catch (error) {
      const categorized = trackError(error);
      
      // Handle duplicate purchase error specifically
      if (categorized.category === 'duplicate_key') {
        toast({
          title: "Bereits gekauft",
          description: "Sie haben diesen Auftrag bereits gekauft.",
          variant: "destructive",
        });
        return;
      }

      captureException(error as Error, { 
        context: 'handlePurchaseLead',
        category: categorized.category 
      });
      
      logWithCorrelation('BrowseLeads: Purchase error', categorized);
      
      toast({
        title: "Fehler",
        description: categorized.message || "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    }
  };

  const formatBudget = (min: number, max: number) => {
    return `CHF ${formatNumber(min)} - ${formatNumber(max)}`;
  };

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

          {/* TODO: Re-enable after types regenerate - Subscription Status Banner */}
          {/* {subscriptionAccess && !subscriptionAccess.isUnlimited && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {subscriptionAccess.requiresUpgrade ? 'Upgrade erforderlich' : 'Ansichten verbleibend'}
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {subscriptionAccess.requiresUpgrade
                    ? 'Sie haben Ihr Anzeigelimit erreicht. Upgraden Sie für unbegrenzten Zugriff.'
                    : `Sie haben noch ${subscriptionAccess.remainingViews} Ansicht${subscriptionAccess.remainingViews !== 1 ? 'en' : ''} in diesem Monat.`}
                </span>
                {subscriptionAccess.requiresUpgrade && (
                  <Button size="sm" onClick={() => navigate('/checkout')}>
                    <Crown className="h-4 w-4 mr-2" />
                    Jetzt upgraden
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )} */}

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter
                </CardTitle>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Zurücksetzen
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <Input
                  placeholder="Nach Auftrag, Ort oder Beschreibung suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Category Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hauptkategorie</label>
                  <Select value={selectedMajorCategory} onValueChange={setSelectedMajorCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Bereiche" />
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Unterkategorie</label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={setSelectedCategory}
                    disabled={availableSubcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Spezifischer Bereich" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Unterkategorien</SelectItem>
                      {availableSubcategories.map((sub) => (
                        <SelectItem key={sub.value} value={sub.value}>
                          {sub.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location and Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kanton</label>
                  <Select value={selectedCanton} onValueChange={setSelectedCanton}>
                    <SelectTrigger>
                      <SelectValue placeholder="Region wählen" />
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Dringlichkeit</label>
                  <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Zeitrahmen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Zeitrahmen</SelectItem>
                      {Object.entries(urgencyLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Aktive Filter:</span>
                  {selectedMajorCategory !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {Object.values(majorCategories).find(c => c.id === selectedMajorCategory)?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSelectedMajorCategory('all')}
                      />
                    </Badge>
                  )}
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {subcategoryLabels[selectedCategory]?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSelectedCategory('all')}
                      />
                    </Badge>
                  )}
                  {selectedCanton !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {SWISS_CANTONS.find(c => c.value === selectedCanton)?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSelectedCanton('all')}
                      />
                    </Badge>
                  )}
                  {selectedUrgency !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {urgencyLabels[selectedUrgency as keyof typeof urgencyLabels]}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSelectedUrgency('all')}
                      />
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Suche: "{searchTerm}"
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSearchTerm('')}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredLeads.length}</span> {filteredLeads.length === 1 ? 'Auftrag' : 'Aufträge'} gefunden
            </div>
            {filteredLeads.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Zeige {Math.min(filteredLeads.length, pageSize)} von {filteredLeads.length}
              </div>
            )}
          </div>

          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Keine Aufträge gefunden
                </p>
                <p className="text-muted-foreground mb-6">
                  {hasActiveFilters 
                    ? 'Versuchen Sie andere Filter oder setzen Sie die Suche zurück.'
                    : 'Zurzeit gibt es keine verfügbaren Aufträge.'
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Alle Filter zurücksetzen
                  </Button>
                )}
              </CardContent>
            </Card>
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
                        <Badge className={urgencyColors[lead.urgency as keyof typeof urgencyColors]}>
                          {urgencyLabels[lead.urgency as keyof typeof urgencyLabels]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {subcategoryLabels[lead.category]?.label || categoryLabels[lead.category as keyof typeof categoryLabels] || lead.category}
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
                      <div className="text-sm text-primary font-medium">
                        CHF 25
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Verfügbare Plätze</span>
                        <span>{lead.max_purchases - lead.purchased_count}/{lead.max_purchases}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${((lead.max_purchases - lead.purchased_count) / lead.max_purchases) * 100}%` }}
                        />
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
                        onClick={() => handlePurchaseLead(lead.id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Kaufen
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