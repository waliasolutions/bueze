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
  proposals_count?: number;
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
  const [hasProposal, setHasProposal] = useState(false);
  const [analytics, setAnalytics] = useState<LeadAnalytics | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    logWithCorrelation('LeadDetails: Page loaded', { leadId: id });
    fetchLead();
    fetchUser();
  }, [id]);

  useEffect(() => {
    if (user && lead) {
      checkProposalStatus();
      trackView();
      if (lead.owner_id === user.id) {
        fetchAnalytics();
      }
    }
  }, [user, lead]);

  const trackView = async () => {
    if (!user || !lead || lead.owner_id === user.id || hasProposal) return;
    
    // TODO: Re-enable after types regenerate - Track view for non-owners who haven't submitted proposal
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

  const checkProposalStatus = async () => {
    if (!user || !lead) return;

    try {
      const { data: proposal } = await supabase
        .from('lead_proposals')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('handwerker_id', user.id)
        .maybeSingle();

      console.log('Proposal check:', { 
        leadId: lead.id, 
        userId: user.id, 
        leadOwnerId: lead.owner_id,
        proposalFound: !!proposal,
        isOwnLead: lead.owner_id === user.id 
      });
      
      setHasProposal(!!proposal);
    } catch (error) {
      console.error('Error checking proposal status:', error);
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

  const handleViewOpportunity = () => {
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Sie müssen angemeldet sein, um eine Offerte einzureichen.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    navigate(`/opportunity/${lead.id}`);
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
  const shouldShowContactInfo = user && owner && (hasProposal || isOwnLead);
  const shouldShowProposalSection = !isOwnLead;
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
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{lead.proposals_count || 0}</p>
                <p className="text-sm text-muted-foreground">Offerten erhalten</p>
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
                               {isOwnLead || hasProposal ? 
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
                      <span className="text-sm text-muted-foreground">Offerten eingereicht</span>
                      <span className="text-sm font-medium">{lead.proposals_count || 0}</span>
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
                    {hasProposal && (
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
              {/* Proposal section - only show for other's leads */}
              {shouldShowProposalSection && !hasProposal && (
                <Card className="bg-gradient-to-br from-brand-50 to-brand-100/30 border-brand-200">
                  <CardHeader>
                    <CardTitle>Offerte einreichen</CardTitle>
                    <CardDescription>
                      Reichen Sie Ihre Offerte ein und zeigen Sie dem Kunden, warum Sie der richtige Handwerker für dieses Projekt sind.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleViewOpportunity}
                      size="lg"
                      className="w-full"
                    >
                      Jetzt Offerte einreichen
                    </Button>
                    
                    {!user && (
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>
                          Login
                        </Button> um eine Offerte einzureichen
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {hasProposal && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6 text-center">
                    <div className="text-green-600 text-4xl mb-3">✓</div>
                    <h3 className="font-semibold text-green-900 mb-2">Offerte eingereicht</h3>
                    <p className="text-green-700 mb-4">
                      Sie haben bereits eine Offerte für diesen Auftrag eingereicht.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/handwerker-dashboard')}
                    >
                      Zum Dashboard
                    </Button>
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