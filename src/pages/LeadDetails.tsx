import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, Coins, User, Phone, Mail, Star } from 'lucide-react';

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
  address?: string;
  created_at: string;
  owner_id: string;
  purchased_count: number;
  max_purchases: number;
  quality_score: number;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

const categoryLabels = {
  plumbing: 'Sanitär',
  electrical: 'Elektrik',
  painting: 'Malerei',
  carpentry: 'Schreinerei',
  roofing: 'Dacharbeiten',
  flooring: 'Bodenbeläge',
  heating: 'Heizung',
  garden: 'Garten',
};

const urgencyLabels = {
  planning: 'Planung',
  flexible: 'Flexibel',
  soon: 'Bald',
  urgent: 'Dringend',
};

const urgencyColors = {
  planning: 'bg-blue-100 text-blue-800',
  flexible: 'bg-green-100 text-green-800',
  soon: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800',
};

const LeadDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    fetchLead();
    fetchUser();
  }, [id]);

  useEffect(() => {
    if (user && lead) {
      checkPurchaseStatus();
    }
  }, [user, lead]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const checkPurchaseStatus = async () => {
    if (!user || !lead) return;

    try {
      const { data: purchase } = await supabase
        .from('lead_purchases')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      setHasPurchased(!!purchase);
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };

  const fetchLead = async () => {
    if (!id) return;

    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (leadError) throw leadError;

      setLead(leadData);

      // Fetch owner profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', leadData.owner_id)
        .single();

      if (profileError) throw profileError;

      setOwner(profileData);
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast({
        title: "Fehler",
        description: "Der Auftrag konnte nicht geladen werden.",
        variant: "destructive",
      });
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Sie müssen angemeldet sein, um Aufträge zu kaufen.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!lead) return;

    setPurchasing(true);
    try {
      // Check if user already purchased this lead
      const { data: existingPurchase } = await supabase
        .from('lead_purchases')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('buyer_id', user.id)
        .single();

      if (existingPurchase) {
        toast({
          title: "Bereits gekauft",
          description: "Sie haben diesen Auftrag bereits gekauft.",
          variant: "destructive",
        });
        return;
      }

      // Insert purchase record
      const { error: purchaseError } = await supabase
        .from('lead_purchases')
        .insert({
          lead_id: lead.id,
          buyer_id: user.id,
          price: 2000, // 20 CHF in cents
        });

      if (purchaseError) throw purchaseError;

      // Create conversation between buyer and lead owner
      const { error: conversationError } = await supabase
        .from('conversations')
        .insert({
          lead_id: lead.id,
          homeowner_id: lead.owner_id,
          handwerker_id: user.id,
        });

      // Don't throw error if conversation already exists
      if (conversationError && !conversationError.message.includes('duplicate key')) {
        console.error('Conversation creation error:', conversationError);
      }

      toast({
        title: "Auftrag gekauft",
        description: "Sie haben den Auftrag erfolgreich gekauft. Die Kontaktdaten sind jetzt sichtbar.",
      });

      // Update purchase status and refresh lead data
      setHasPurchased(true);
      fetchLead();
    } catch (error) {
      console.error('Error purchasing lead:', error);
      toast({
        title: "Fehler",
        description: "Beim Kauf des Auftrags ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const formatBudget = (min: number, max: number) => {
    return `CHF ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)} Tagen`;
    return `vor ${Math.floor(diffInHours / 168)} Wochen`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Auftrag nicht gefunden</h1>
            <Button onClick={() => navigate('/search')}>Zurück zur Suche</Button>
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
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{lead.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{lead.zip} {lead.city}, {lead.canton}</span>
                        <Clock className="h-4 w-4 ml-4" />
                        <span>{getTimeAgo(lead.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={urgencyColors[lead.urgency as keyof typeof urgencyColors]}>
                        {urgencyLabels[lead.urgency as keyof typeof urgencyLabels]}
                      </Badge>
                      <Badge variant="secondary">
                        {categoryLabels[lead.category as keyof typeof categoryLabels]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Projektbeschreibung</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{lead.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatBudget(lead.budget_min, lead.budget_max)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Qualität: {lead.quality_score}/100</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Verkaufte Plätze</span>
                      <span className="text-sm font-medium">{lead.purchased_count}/{lead.max_purchases}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(lead.purchased_count / lead.max_purchases) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact information and message button - only show if purchased */}
              {user && owner && hasPurchased && (
                <Card>
                  <CardHeader>
                    <CardTitle>Auftraggeber</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={owner.avatar_url} />
                        <AvatarFallback>
                          {owner.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{owner.full_name || 'Unbekannt'}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{owner.email}</span>
                          </div>
                          {owner.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{owner.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate('/conversations')}
                    >
                      Nachricht senden
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Auftrag kaufen</CardTitle>
                  <CardDescription>
                    Erhalten Sie Zugang zu den Kontaktdaten und können sich direkt bewerben.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">CHF 20</div>
                    <div className="text-sm text-muted-foreground">einmalig</div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handlePurchase}
                    disabled={purchasing || !user || hasPurchased}
                    variant={hasPurchased ? "secondary" : "default"}
                  >
                    {hasPurchased ? 'Bereits gekauft' : purchasing ? 'Wird gekauft...' : 'Jetzt kaufen'}
                  </Button>

                  {!user && (
                    <p className="text-xs text-center text-muted-foreground">
                      <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>
                        Anmelden
                      </Button> um diesen Auftrag zu kaufen
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Was Sie erhalten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Vollständige Kontaktdaten</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Direkte Bewerbung möglich</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Exklusiver Zugang (max. {lead.max_purchases} Handwerker)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Integriertes Messaging-System</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LeadDetails;