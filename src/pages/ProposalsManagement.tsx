import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Eye, MapPin, Calendar, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ProposalStatusBadge } from '@/components/ProposalStatusBadge';
import { acceptProposal, rejectProposal } from '@/lib/proposalHelpers';
import { EmptyState } from '@/components/ui/empty-state';
import { ProposalComparisonDialog } from '@/components/ProposalComparisonDialog';
import type { ProposalStatus } from '@/types/entities';

// Local interface for this component's specific joined data shape
interface ProposalManagementItem {
  id: string;
  lead_id: string;
  handwerker_id: string;
  price_min: number;
  price_max: number;
  estimated_duration_days: number | null;
  message: string;
  status: ProposalStatus;
  submitted_at: string;
  client_viewed_at: string | null;
  view_count: number;
  lead: {
    title: string;
    category: string;
    city: string;
    canton: string;
  };
  handwerker_profile: {
    company_name: string | null;
    first_name: string;
    last_name: string;
    logo_url: string | null;
    city: string;
    business_city?: string | null;
    verification_status?: string | null;
    liability_insurance_provider?: string | null;
    bio?: string | null;
  };
  rating_stats?: {
    average_rating: number | null;
    review_count: number | null;
  };
}

const ProposalsManagement = () => {
  const [proposals, setProposals] = useState<ProposalManagementItem[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<ProposalManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [user, setUser] = useState<any>(null);
  const [comparisonIds, setComparisonIds] = useState<Set<string>>(new Set());
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    filterProposals();
  }, [activeTab, proposals]);

  const checkAuthAndFetch = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);
      await fetchProposals(currentUser.id);
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/auth');
    }
  };

  const fetchProposals = async (userId: string) => {
    try {
      // Get all leads owned by the user
      const { data: userLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .eq('owner_id', userId);

      if (leadsError) throw leadsError;

      const leadIds = userLeads.map(lead => lead.id);

      if (leadIds.length === 0) {
        setProposals([]);
        return;
      }

      // Get all proposals for those leads
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('lead_proposals')
        .select(`
          *,
          lead:leads(title, category, city, canton),
          handwerker_profile:handwerker_profiles!lead_proposals_handwerker_id_fkey(
            company_name, first_name, last_name, logo_url, business_city, city,
            verification_status, liability_insurance_provider, bio
          )
        `)
        .in('lead_id', leadIds)
        .order('submitted_at', { ascending: false });

      if (proposalsError) throw proposalsError;

      // Batch fetch rating stats
      const handwerkerIds = [...new Set((proposalsData || []).map(p => p.handwerker_id))];
      const { data: ratingStats } = await supabase
        .from('handwerker_rating_stats')
        .select('user_id, average_rating, review_count')
        .in('user_id', handwerkerIds);

      const ratingStatsMap = new Map(ratingStats?.map(r => [r.user_id, r]) || []);

      const proposalsWithRatings = (proposalsData || []).map(p => ({
        ...p,
        rating_stats: ratingStatsMap.get(p.handwerker_id) || undefined,
      }));

      setProposals(proposalsWithRatings as any);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: 'Fehler',
        description: 'Offerten konnten nicht geladen werden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProposals = () => {
    if (activeTab === 'all') {
      setFilteredProposals(proposals);
    } else {
      setFilteredProposals(proposals.filter(p => p.status === activeTab));
    }
  };

  const handleComparisonToggle = (proposalId: string) => {
    const newComparison = new Set(comparisonIds);
    if (newComparison.has(proposalId)) {
      newComparison.delete(proposalId);
    } else if (newComparison.size < 3) {
      newComparison.add(proposalId);
    } else {
      toast({
        title: 'Maximum erreicht',
        description: 'Sie können maximal 3 Offerten vergleichen',
      });
      return;
    }
    setComparisonIds(newComparison);
  };

  const handleAccept = async (proposalId: string) => {
    const result = await acceptProposal(proposalId);

    toast({
      title: result.success ? 'Offerte angenommen' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive'
    });

    if (result.success) {
      setComparisonOpen(false);
      setComparisonIds(new Set());
      if (user) await fetchProposals(user.id);
    }
  };

  const handleReject = async (proposalId: string) => {
    const result = await rejectProposal(proposalId);

    toast({
      title: result.success ? 'Offerte abgelehnt' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive'
    });

    if (result.success && user) {
      await fetchProposals(user.id);
    }
  };

  const getComparisonProposals = () => {
    return filteredProposals
      .filter(p => comparisonIds.has(p.id))
      .map(p => ({
        id: p.id,
        handwerker_id: p.handwerker_id,
        price_min: p.price_min,
        price_max: p.price_max,
        estimated_duration_days: p.estimated_duration_days,
        message: p.message,
        status: p.status,
        handwerkerName: `${p.handwerker_profile.first_name} ${p.handwerker_profile.last_name}`,
        handwerkerCity: p.handwerker_profile.city || p.handwerker_profile.business_city || null,
        companyName: p.handwerker_profile.company_name || null,
        logoUrl: p.handwerker_profile.logo_url || null,
        rating: p.rating_stats?.average_rating || undefined,
        reviewCount: p.rating_stats?.review_count || undefined,
        isVerified: p.handwerker_profile.verification_status === 'approved',
        hasInsurance: !!p.handwerker_profile.liability_insurance_provider,
        bio: p.handwerker_profile.bio || undefined,
      }));
  };

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const acceptedCount = proposals.filter(p => p.status === 'accepted').length;
  const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-12 w-full" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Offerten verwalten</h1>
            <p className="text-muted-foreground">
              Überprüfen und verwalten Sie eingehende Offerten für Ihre Projekte
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                Ausstehend {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Angenommen {acceptedCount > 0 && `(${acceptedCount})`}
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Abgelehnt {rejectedCount > 0 && `(${rejectedCount})`}
              </TabsTrigger>
              <TabsTrigger value="all">
                Alle ({proposals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredProposals.length === 0 ? (
                <EmptyState 
                  variant="proposals"
                  description={activeTab === 'pending' 
                    ? 'Sie haben keine ausstehenden Offerten.'
                    : `Keine ${activeTab === 'accepted' ? 'angenommenen' : activeTab === 'rejected' ? 'abgelehnten' : ''} Offerten gefunden.`}
                />
              ) : (
                filteredProposals.map((proposal) => {
                  const isInComparison = comparisonIds.has(proposal.id);
                  
                  return (
                    <Card key={proposal.id} className={isInComparison ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl">{proposal.lead.title}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {proposal.lead.city}, {proposal.lead.canton}
                              </span>
                              <Badge variant="outline">{proposal.lead.category}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {proposal.status === 'pending' && (
                              <Button
                                variant={isInComparison ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleComparisonToggle(proposal.id)}
                              >
                                <LayoutGrid className="h-4 w-4 mr-1" />
                                {isInComparison ? 'Ausgewählt' : 'Vergleichen'}
                              </Button>
                            )}
                            <ProposalStatusBadge status={proposal.status} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Handwerker Info */}
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          {proposal.handwerker_profile.logo_url ? (
                            <img 
                              src={proposal.handwerker_profile.logo_url} 
                              alt="Logo"
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                              {proposal.handwerker_profile.first_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">
                              {proposal.handwerker_profile.company_name || 
                               `${proposal.handwerker_profile.first_name} ${proposal.handwerker_profile.last_name}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {proposal.handwerker_profile.city}
                            </p>
                          </div>
                        </div>

                        {/* Proposal Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Preis</p>
                            <p className="font-semibold">
                              CHF {proposal.price_min.toLocaleString()} - {proposal.price_max.toLocaleString()}
                            </p>
                          </div>
                          {proposal.estimated_duration_days && (
                            <div>
                              <p className="text-sm text-muted-foreground">Dauer</p>
                              <p className="font-semibold">{proposal.estimated_duration_days} Tage</p>
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Nachricht</p>
                          <p className="whitespace-pre-wrap text-sm">{proposal.message}</p>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Eingereicht {format(new Date(proposal.submitted_at), 'dd.MM.yyyy', { locale: de })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {proposal.view_count} Mal angesehen
                          </span>
                        </div>

                        {/* Actions */}
                        {proposal.status === 'pending' && (
                          <div className="flex gap-2 pt-2">
                            <Button 
                              onClick={() => handleAccept(proposal.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Annehmen
                            </Button>
                            <Button 
                              onClick={() => handleReject(proposal.id)}
                              variant="outline"
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Ablehnen
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Floating comparison bar */}
      {comparisonIds.size >= 2 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background shadow-lg rounded-full px-6 py-3 border flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{comparisonIds.size} Offerten ausgewählt</span>
          <Button onClick={() => setComparisonOpen(true)} size="sm">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Vergleichen
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setComparisonIds(new Set())}>
            Abbrechen
          </Button>
        </div>
      )}

      {/* Comparison Dialog */}
      <ProposalComparisonDialog
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        proposals={getComparisonProposals()}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      <Footer />
    </div>
  );
};

export default ProposalsManagement;
