import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { logWithCorrelation, captureException } from '@/lib/errorTracking';
import { trackError } from '@/lib/errorCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, Coins, User, Phone, Mail, Edit2, Pause, CheckCircle, Trash2, Play, Eye, Users } from 'lucide-react';
import { formatTimeAgo, formatNumber } from '@/lib/swissTime';
// TODO: Re-enable after types regenerate
// import { trackLeadView, checkSubscriptionAccess } from '@/lib/subscriptionHelpers';
import { pauseLead, completeLead, deleteLead, reactivateLead, getLeadAnalytics } from '@/lib/leadHelpers';
import { getLeadStatus } from '@/config/leadStatuses';
import type { LeadAnalytics } from '@/lib/leadHelpers';

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
  status: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
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
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    logWithCorrelation('LeadDetails: Page loaded', { leadId: id });
    fetchLead();
    fetchUser();
  }, [id]);

  useEffect(() => {
    if (user && lead) {
      checkPurchaseStatus();
      trackView();
      if (lead.owner_id === user.id) {
        fetchAnalytics();
      }
    }
  }, [user, lead]);

  const trackView = async () => {
    if (!user || !lead || lead.owner_id === user.id || hasPurchased) return;
    
    // TODO: Re-enable after types regenerate - Track view for non-owners who haven't purchased
    // await trackLeadView(user.id, lead.id);
  };

  const fetchAnalytics = async () => {
    if (!user || !lead) return;
    const data = await getLeadAnalytics(lead.id, user.id);
    setAnalytics(data);
  };

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

      console.log('Purchase check:', { 
        leadId: lead.id, 
        userId: user.id, 
        leadOwnerId: lead.owner_id,
        purchaseFound: !!purchase,
        isOwnLead: lead.owner_id === user.id 
      });
      
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
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          lead_id: lead.id,
          homeowner_id: lead.owner_id,
          handwerker_id: user.id,
        })
        .select()
        .single();

      let conversationId = conversation?.id;

      // If conversation already exists, get it
      if (conversationError && conversationError.message.includes('duplicate key')) {
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('lead_id', lead.id)
          .eq('homeowner_id', lead.owner_id)
          .eq('handwerker_id', user.id)
          .single();
        
        conversationId = existingConversation?.id;
      }

      toast({
        title: "Auftrag gekauft",
        description: "Sie haben den Auftrag erfolgreich gekauft und können jetzt eine Nachricht senden.",
      });

      // Update purchase status and navigate to conversation
      setHasPurchased(true);
      if (conversationId) {
        navigate(`/messages/${conversationId}`);
      } else {
        navigate('/conversations');
      }
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

  const handleStatusChange = async (action: 'pause' | 'complete' | 'delete' | 'reactivate') => {
    if (!lead || !user) return;
    
    setUpdating(true);
    let result;
    
    switch (action) {
      case 'pause':
        result = await pauseLead(lead.id, user.id);
        break;
      case 'complete':
        result = await completeLead(lead.id, user.id);
        break;
      case 'delete':
        result = await deleteLead(lead.id, user.id);
        break;
      case 'reactivate':
        result = await reactivateLead(lead.id, user.id);
        break;
    }
    
    if (result.success) {
      toast({
        title: "Erfolg",
        description: result.message,
      });
      
      if (action === 'delete') {
        navigate('/dashboard');
      } else {
        fetchLead(); // Refresh lead data
      }
    } else {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
    
    setUpdating(false);
  };

  const formatBudget = (min: number, max: number) => {
    return `CHF ${formatNumber(min)} - ${formatNumber(max)}`;
  };

  const isOwnLead = user && lead && lead.owner_id === user.id;
  const shouldShowContactInfo = user && owner && (hasPurchased || isOwnLead);
  const shouldShowPurchaseSection = !isOwnLead;
  const leadStatus = lead ? getLeadStatus(lead.status as any) : null;

  // Helper to get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
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

  // Owner view - simplified
  if (isOwnLead) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
          {/* Status Badge and Title */}
          <div className="mb-6">
            <Badge 
              variant={getStatusVariant(lead.status)} 
              className="mb-3 text-base px-4 py-2"
            >
              {leadStatus?.label}
            </Badge>
            <h1 className="text-4xl font-bold mb-2">{lead.title}</h1>
            <div className="flex items-center text-muted-foreground text-sm space-x-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {lead.city}, {lead.canton}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatTimeAgo(lead.created_at)}
              </div>
            </div>
          </div>

          {/* Action Buttons - Prominent */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate(`/lead/${id}/edit`)}
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>

                {lead.status === 'active' && (
                  <Button
                    onClick={() => handleStatusChange('pause')}
                    variant="outline"
                    size="lg"
                    disabled={updating}
                    className="flex-1 sm:flex-none"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausieren
                  </Button>
                )}

                {lead.status === 'paused' && (
                  <Button
                    onClick={() => handleStatusChange('reactivate')}
                    variant="outline"
                    size="lg"
                    disabled={updating}
                    className="flex-1 sm:flex-none"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Reaktivieren
                  </Button>
                )}

                {(lead.status === 'active' || lead.status === 'paused') && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        disabled={updating}
                        className="flex-1 sm:flex-none"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Als erledigt markieren
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Auftrag abschließen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Der Auftrag wird als erledigt markiert und ist nicht mehr für Handwerker sichtbar.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleStatusChange('complete')}>
                          Bestätigen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="lg" 
                      disabled={updating}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Der Auftrag wird dauerhaft gelöscht.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange('delete')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Simple Stats */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{lead.purchased_count}</p>
                  <p className="text-sm text-muted-foreground">Handwerker interessiert</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{lead.max_purchases - lead.purchased_count}</p>
                  <p className="text-sm text-muted-foreground">Plätze noch verfügbar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center text-lg">
                  Beschreibung
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{lead.description}</p>
              </div>

              <div className="border-t pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Budget</h3>
                  <p className="text-2xl font-bold text-primary">
                    {formatBudget(lead.budget_min, lead.budget_max)}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Kategorie</h3>
                  <Badge className={`${urgencyColors[lead.urgency as keyof typeof urgencyColors]} text-base px-3 py-1`}>
                    {urgencyLabels[lead.urgency as keyof typeof urgencyLabels]}
                  </Badge>
                  <p className="text-lg mt-2">{categoryLabels[lead.category as keyof typeof categoryLabels]}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Standort
                </h3>
                <p className="text-muted-foreground">
                  {lead.address && `${lead.address}, `}
                  {lead.zip} {lead.city}, {lead.canton}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information - Compact */}
          {owner && (
            <Card>
              <CardHeader>
                <CardTitle>Ihre Kontaktdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-semibold">{owner.full_name}</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${owner.email}`} className="hover:underline">
                      {owner.email}
                    </a>
                  </div>
                  {owner.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <a href={`tel:${owner.phone}`} className="hover:underline">
                        {owner.phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  // Handwerker view (non-owner)
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
                            <span>
                              {isOwnLead || hasPurchased ? 
                                `${lead.address ? lead.address + ', ' : ''}${lead.zip} ${lead.city}, ${lead.canton}` : 
                                `${lead.zip} ${lead.city}, ${lead.canton}`
                              }
                            </span>
                            <Clock className="h-4 w-4 ml-4" />
                            <span>{formatTimeAgo(lead.created_at)}</span>
                          </div>
                        </div>
                    <div className="flex flex-col gap-1 items-end">
                      {leadStatus && (
                        <Badge className={leadStatus.color}>
                          {leadStatus.label}
                        </Badge>
                      )}
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

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatBudget(lead.budget_min, lead.budget_max)}</span>
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

              {/* Contact information - show if purchased */}
              {shouldShowContactInfo && (
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
                    {hasPurchased && (
                      <Button 
                        className="w-full" 
                        onClick={async () => {
                          const { data: conversation } = await supabase
                            .from('conversations')
                            .select('id')
                            .eq('lead_id', lead.id)
                            .eq('handwerker_id', user.id)
                            .single();
                          
                          if (conversation) {
                            navigate(`/messages/${conversation.id}`);
                          } else {
                            navigate('/conversations');
                          }
                        }}
                      >
                        Nachricht senden
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Purchase section - only show for other's leads */}
              {shouldShowPurchaseSection && (
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
                      {hasPurchased 
                        ? 'Bereits gekauft' 
                        : purchasing 
                          ? 'Wird gekauft...' 
                          : 'Jetzt kaufen'
                      }
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
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LeadDetails;