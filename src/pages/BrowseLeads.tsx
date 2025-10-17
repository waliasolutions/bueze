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
import { MapPin, Clock, Coins, Search, ShoppingCart, Crown, AlertCircle } from 'lucide-react';
import { formatTimeAgo, formatNumber } from '@/lib/swissTime';
import { checkSubscriptionAccess, canPurchaseLeadWithPrice } from '@/lib/subscriptionHelpers';
import { canViewLead as canViewLeadByStatus } from '@/config/leadStatuses';
import type { SubscriptionAccessCheck } from '@/lib/subscriptionHelpers';
import { SWISS_CANTONS } from '@/config/cantons';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCanton, setSelectedCanton] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccessCheck | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    logWithCorrelation('BrowseLeads: Page loaded');
    fetchLeads();
    checkUserSubscription();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, selectedCategory, selectedCanton, selectedUrgency]);

  const checkUserSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const access = await checkSubscriptionAccess(user.id);
        setSubscriptionAccess(access);
      }
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Calculate pagination range
      const { from, to } = calculatePagination({ page: currentPage, pageSize });

      // Fetch with retry and timeout
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .neq('owner_id', user.id)
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

      // Check subscription access
      const { canPurchase, price } = await canPurchaseLeadWithPrice(user.id);

      if (!canPurchase) {
        toast({
          title: "Upgrade erforderlich",
          description: "Bitte upgraden Sie Ihr Abonnement, um Aufträge zu kaufen.",
          variant: "destructive",
        });
        navigate('/profile?tab=subscription');
        return;
      }

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

          {/* Subscription Status Banner */}
          {subscriptionAccess && !subscriptionAccess.isUnlimited && (
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
          )}

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCanton} onValueChange={setSelectedCanton}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kanton" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kantone</SelectItem>
                    {SWISS_CANTONS.map((canton) => (
                      <SelectItem key={canton.value} value={canton.value}>{canton.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dringlichkeit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {Object.entries(urgencyLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredLeads.length} Aufträge gefunden
          </div>

          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Keine Aufträge gefunden. Versuchen Sie andere Filter.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedCanton('all');
                    setSelectedUrgency('all');
                  }}
                >
                  Filter zurücksetzen
                </Button>
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
                        <Badge variant="secondary">
                          {categoryLabels[lead.category as keyof typeof categoryLabels]}
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
                        CHF {subscriptionAccess?.leadPrice || 20}
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