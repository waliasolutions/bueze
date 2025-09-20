import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, Coins, Star, Users } from 'lucide-react';

interface Lead {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  budget_type: string;
  urgency: string;
  zip: string;
  city: string;
  canton: string;
  quality_score: number;
  purchased_count: number;
  max_purchases: number;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
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

const urgencyLabels: Record<string, string> = {
  today: 'Heute',
  this_week: 'Diese Woche',
  this_month: 'Dieser Monat',
  planning: 'Planung'
};

const urgencyColors: Record<string, string> = {
  today: 'bg-red-100 text-red-800',
  this_week: 'bg-orange-100 text-orange-800',
  this_month: 'bg-blue-100 text-blue-800',
  planning: 'bg-gray-100 text-gray-800'
};

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get search parameters
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const budget = searchParams.get('budget') || '';
  const urgency = searchParams.get('urgency') || '';

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Helper function to parse budget range from search params
  const parseBudgetRange = (budgetParam: string): [number | null, number | null] => {
    if (!budgetParam) return [null, null];
    
    switch (budgetParam) {
      case '0-500':
        return [0, 500];
      case '500-1500':
        return [500, 1500];
      case '1500-5000':
        return [1500, 5000];
      case '5000+':
        return [5000, 999999];
      default:
        return [null, null];
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [searchParams]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('leads')
        .select('*')
        .eq('status', 'active');

      // Apply full-text search if query is provided
      if (query.trim()) {
        const searchTerms = query.trim().split(' ').join(' & ');
        queryBuilder = queryBuilder.textSearch('search_text', searchTerms);
      }

      // Apply category filter
      if (category && Object.keys(categoryLabels).includes(category)) {
        queryBuilder = queryBuilder.eq('category', category as any);
      }
      
      // Apply enhanced location search
      if (location.trim()) {
        const locationTerm = location.trim();
        // Search in city, zip, and canton with better matching
        queryBuilder = queryBuilder.or(`city.ilike.%${locationTerm}%, zip.ilike.${locationTerm}%, zip.ilike.${locationTerm}%, canton.ilike.%${locationTerm}%`);
      }
      
      // Apply urgency filter
      if (urgency && Object.keys(urgencyLabels).includes(urgency)) {
        queryBuilder = queryBuilder.eq('urgency', urgency as any);
      }

      // Note: Budget filtering will be done client-side after fetching data

      // Order by relevance if there's a text search, otherwise by date
      if (query.trim()) {
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
      } else {
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching leads:', error);
        setLeads([]);
      } else {
        let filteredLeads = data || [];
        
        // Apply client-side budget filtering
        if (budget) {
          const [minBudget, maxBudget] = parseBudgetRange(budget);
          if (minBudget !== null && maxBudget !== null) {
            filteredLeads = filteredLeads.filter(lead => {
              // Handle leads with budget on request (null values)
              if (!lead.budget_min && !lead.budget_max) return true;
              
              const leadMin = lead.budget_min || lead.budget_max || 0;
              const leadMax = lead.budget_max || lead.budget_min || 999999;
              
              // Check if budget ranges overlap
              return leadMax >= minBudget && leadMin <= maxBudget;
            });
          }
        }
        
        setLeads(filteredLeads);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (lead: Lead) => {
    if (lead.budget_type === 'hourly') {
      return `CHF ${lead.budget_min || 0}-${lead.budget_max || 0}/h`;
    } else if (lead.budget_min && lead.budget_max) {
      return `CHF ${lead.budget_min}-${lead.budget_max}`;
    } else if (lead.budget_max) {
      return `Bis CHF ${lead.budget_max}`;
    } else {
      return 'Budget auf Anfrage';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Gerade eben';
    } else if (diffInHours < 24) {
      return `vor ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `vor ${diffInDays}d`;
    }
  };

  const handleLeadClick = (leadId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/lead/${leadId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-ink-700">Leads werden geladen...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink-900 mb-4">
            Suchergebnisse
          </h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {query && (
              <Badge variant="outline">
                Suche: "{query}"
              </Badge>
            )}
            {category && (
              <Badge variant="outline">
                Kategorie: {categoryLabels[category] || category}
              </Badge>
            )}
            {location && (
              <Badge variant="outline">
                Ort: {location}
              </Badge>
            )}
            {budget && (
              <Badge variant="outline">
                Budget: {budget === '0-500' ? 'Bis 500 CHF' : 
                        budget === '500-1500' ? '500 - 1\'500 CHF' :
                        budget === '1500-5000' ? '1\'500 - 5\'000 CHF' :
                        budget === '5000+' ? 'Über 5\'000 CHF' : budget}
              </Badge>
            )}
            {urgency && (
              <Badge variant="outline">
                Dringlichkeit: {urgencyLabels[urgency] || urgency}
              </Badge>
            )}
          </div>
          
          <p className="text-ink-700">
            {leads.length} {leads.length === 1 ? 'Lead gefunden' : 'Leads gefunden'}
          </p>
        </div>

        {leads.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-xl font-semibold text-ink-900 mb-2">
                Keine Leads gefunden
              </h3>
              <p className="text-ink-700 mb-6">
                Versuchen Sie es mit anderen Suchkriterien oder erstellen Sie eine Benachrichtigung.
              </p>
              <Button onClick={() => navigate('/')}>
                Neue Suche starten
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => (
              <Card 
                key={lead.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleLeadClick(lead.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">
                      {categoryLabels[lead.category] || lead.category}
                    </Badge>
                    <Badge className={urgencyColors[lead.urgency]}>
                      {urgencyLabels[lead.urgency] || lead.urgency}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-lg">{lead.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {lead.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-ink-700">
                      <MapPin className="h-4 w-4" />
                      {lead.zip} {lead.city}, {lead.canton}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-ink-700">
                      <Coins className="h-4 w-4" />
                      {formatBudget(lead)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-ink-700">
                      <Clock className="h-4 w-4" />
                      {getTimeAgo(lead.created_at)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-brand-500" />
                        <span>{lead.quality_score}/100</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-ink-500" />
                        <span>{lead.purchased_count}/{lead.max_purchases}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeadClick(lead.id);
                      }}
                    >
                      {user ? 'Details ansehen' : 'Anmelden für Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}