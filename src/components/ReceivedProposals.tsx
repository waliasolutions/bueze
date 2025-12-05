import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, Clock, Star, MapPin, Coins, Calendar, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatTimeAgo } from '@/lib/swissTime';
import { HandwerkerRating } from './HandwerkerRating';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import { acceptProposal, rejectProposal, acceptProposalsBatch, rejectProposalsBatch } from '@/lib/proposalHelpers';

interface Proposal {
  id: string;
  lead_id: string;
  handwerker_id: string;
  price_min: number;
  price_max: number;
  estimated_duration_days: number | null;
  status: string;
  submitted_at: string;
  message: string;
  handwerker_profiles: {
    business_city: string | null;
    profiles: {
      full_name: string;
    };
  } | null;
  leads: {
    title: string;
    category: string;
    status: string;
  } | null;
}

interface ReceivedProposalsProps {
  userId: string;
}

export const ReceivedProposals: React.FC<ReceivedProposalsProps> = ({ userId }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'price_low' | 'price_high'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchProposals();
  }, [userId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [proposals, sortBy, filterStatus]);

  const fetchProposals = async () => {
    try {
      // Get all leads owned by user
      const { data: userLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .eq('owner_id', userId);

      if (leadsError) throw leadsError;

      const leadIds = userLeads?.map(l => l.id) || [];

      if (leadIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get proposals for those leads
      const { data, error } = await supabase
        .from('lead_proposals')
        .select(`
          *,
          leads!lead_proposals_lead_id_fkey(title, category, status)
        `)
        .in('lead_id', leadIds)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch handwerker profiles separately
      const proposalsWithProfiles = await Promise.all(
        (data || []).map(async (proposal) => {
          const { data: hwProfile } = await supabase
            .from('handwerker_profiles')
            .select('business_city')
            .eq('user_id', proposal.handwerker_id)
            .single();

          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', proposal.handwerker_id)
            .single();

          return {
            ...proposal,
            handwerker_profiles: hwProfile && userProfile ? {
              business_city: hwProfile.business_city,
              profiles: { full_name: userProfile.full_name }
            } : null,
          };
        })
      );

      setProposals(proposalsWithProfiles as Proposal[]);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: 'Fehler',
        description: 'Offerten konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...proposals];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price_min - b.price_min;
        case 'price_high':
          return b.price_max - a.price_max;
        case 'date':
        default:
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      }
    });

    setFilteredProposals(filtered);
  };

  const handleSelectProposal = (proposalId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(proposalId)) {
      newSelected.delete(proposalId);
    } else {
      newSelected.add(proposalId);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchAction = async (action: 'accept' | 'reject') => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    const result = action === 'accept' 
      ? await acceptProposalsBatch(ids)
      : await rejectProposalsBatch(ids);

    toast({
      title: result.success ? 'Erfolg' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    setSelectedIds(new Set());
    fetchProposals();
  };

  const handleAccept = async (proposalId: string) => {
    const result = await acceptProposal(proposalId);

    toast({
      title: result.success ? 'Offerte angenommen!' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) fetchProposals();
  };

  const handleReject = async (proposalId: string) => {
    const result = await rejectProposal(proposalId);

    toast({
      title: result.success ? 'Offerte abgelehnt' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) fetchProposals();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="pending">Ausstehend</SelectItem>
              <SelectItem value="accepted">Angenommen</SelectItem>
              <SelectItem value="rejected">Abgelehnt</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sortieren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Neueste zuerst</SelectItem>
              <SelectItem value="price_low">Preis: Niedrig → Hoch</SelectItem>
              <SelectItem value="price_high">Preis: Hoch → Niedrig</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button onClick={() => handleBatchAction('accept')} size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              {selectedIds.size} Annehmen
            </Button>
            <Button onClick={() => handleBatchAction('reject')} size="sm" variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              {selectedIds.size} Ablehnen
            </Button>
          </div>
        )}
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              {filterStatus === 'all' 
                ? 'Sie haben noch keine Offerten erhalten.'
                : 'Keine Offerten mit diesem Status gefunden.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const handwerkerName = proposal.handwerker_profiles?.profiles?.full_name?.split(' ')[0] || 'Handwerker';

            return (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {proposal.status === 'pending' && (
                      <Checkbox
                        checked={selectedIds.has(proposal.id)}
                        onCheckedChange={() => handleSelectProposal(proposal.id)}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <ProposalStatusBadge status={proposal.status} />
                        <Badge variant="outline">{proposal.leads?.category || 'Kategorie'}</Badge>
                      </div>
                      <CardTitle className="text-lg mb-1">{proposal.leads?.title || 'Projekt'}</CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                        <span className="font-medium">{handwerkerName}</span>
                        {proposal.handwerker_profiles?.business_city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {proposal.handwerker_profiles.business_city}
                          </span>
                        )}
                        <HandwerkerRating handwerkerId={proposal.handwerker_id} compact />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                      <div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">Preis</div>
                        <div className="font-semibold">
                          CHF {proposal.price_min.toLocaleString()} - {proposal.price_max.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {proposal.estimated_duration_days && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                        <div>
                          <div className="text-sm text-[hsl(var(--muted-foreground))]">Dauer</div>
                          <div className="font-semibold">{proposal.estimated_duration_days} Tage</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-[hsl(var(--muted))] rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{proposal.message}</p>
                  </div>

                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Eingereicht {formatTimeAgo(proposal.submitted_at)}
                  </div>

                  {proposal.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => handleAccept(proposal.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Annehmen
                      </Button>
                      <Button onClick={() => handleReject(proposal.id)} variant="outline" className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />
                        Ablehnen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
