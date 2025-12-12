import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, Clock, Star, MapPin, Coins, Calendar, Filter, LayoutGrid, Phone, Mail, Globe, MessageSquare, User, Paperclip, Download, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatTimeAgo } from '@/lib/swissTime';
import { HandwerkerRating } from './HandwerkerRating';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import { acceptProposal, rejectProposal, acceptProposalsBatch, rejectProposalsBatch } from '@/lib/proposalHelpers';
import { CardSkeleton } from '@/components/ui/page-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ProposalComparisonDialog } from './ProposalComparisonDialog';
import { invalidateProposalQueries } from '@/lib/queryInvalidation';
import type { ProposalWithHandwerkerInfo } from '@/types/entities';

// Extended type for ReceivedProposals with specific joined data
interface ReceivedProposal extends ProposalWithHandwerkerInfo {
  handwerker_id: string;
  handwerker_profiles: {
    business_city: string | null;
    company_name?: string | null;
    logo_url?: string | null;
    verification_status?: string | null;
    liability_insurance_provider?: string | null;
    bio?: string | null;
    phone_number?: string | null;
    email?: string | null;
    business_address?: string | null;
    business_zip?: string | null;
    business_canton?: string | null;
    website?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    profiles: {
      full_name: string;
    };
  } | null;
  rating_stats?: {
    average_rating: number | null;
    review_count: number | null;
  };
}

interface ReceivedProposalsProps {
  userId: string;
}

export const ReceivedProposals: React.FC<ReceivedProposalsProps> = ({ userId }) => {
  const [proposals, setProposals] = useState<ReceivedProposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<ReceivedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [comparisonIds, setComparisonIds] = useState<Set<string>>(new Set());
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'price_low' | 'price_high'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

      // Batch fetch all unique handwerker IDs
      const handwerkerIds = [...new Set((data || []).map(p => p.handwerker_id))];
      
      // Fetch handwerker profiles in batch with additional fields including contact details
      const { data: hwProfiles } = await supabase
        .from('handwerker_profiles')
        .select('user_id, business_city, company_name, logo_url, verification_status, liability_insurance_provider, bio, phone_number, email, business_address, business_zip, business_canton, website, first_name, last_name')
        .in('user_id', handwerkerIds);

      // Fetch user profiles in batch
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', handwerkerIds);

      // Fetch rating stats in batch
      const { data: ratingStats } = await supabase
        .from('handwerker_rating_stats')
        .select('user_id, average_rating, review_count')
        .in('user_id', handwerkerIds);

      // Create lookup maps for O(1) access
      const hwProfileMap = new Map(hwProfiles?.map(p => [p.user_id, p]) || []);
      const userProfileMap = new Map(userProfiles?.map(p => [p.id, p]) || []);
      const ratingStatsMap = new Map(ratingStats?.map(r => [r.user_id, r]) || []);

      // Map profiles to proposals
      const proposalsWithProfiles = (data || []).map(proposal => {
        const hwProfile = hwProfileMap.get(proposal.handwerker_id);
        const userProfile = userProfileMap.get(proposal.handwerker_id);
        const stats = ratingStatsMap.get(proposal.handwerker_id);

        return {
          ...proposal,
          handwerker_profiles: hwProfile && userProfile ? {
            business_city: hwProfile.business_city,
            company_name: hwProfile.company_name,
            logo_url: hwProfile.logo_url,
            verification_status: hwProfile.verification_status,
            liability_insurance_provider: hwProfile.liability_insurance_provider,
            bio: hwProfile.bio,
            phone_number: hwProfile.phone_number,
            email: hwProfile.email,
            business_address: hwProfile.business_address,
            business_zip: hwProfile.business_zip,
            business_canton: hwProfile.business_canton,
            website: hwProfile.website,
            first_name: hwProfile.first_name,
            last_name: hwProfile.last_name,
            profiles: { full_name: userProfile.full_name }
          } : null,
          rating_stats: stats ? {
            average_rating: stats.average_rating,
            review_count: stats.review_count
          } : undefined,
        };
      });

      setProposals(proposalsWithProfiles as ReceivedProposal[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching proposals:', error);
      }
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
    await invalidateProposalQueries(queryClient, undefined, undefined, userId);
    fetchProposals();
  };

  const handleAccept = async (proposalId: string) => {
    const result = await acceptProposal(proposalId);

    toast({
      title: result.success ? 'Offerte angenommen!' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
      setComparisonOpen(false);
      setComparisonIds(new Set());
      await invalidateProposalQueries(queryClient, proposalId, undefined, userId);
      fetchProposals();
    }
  };

  const handleReject = async (proposalId: string) => {
    const result = await rejectProposal(proposalId);

    toast({
      title: result.success ? 'Offerte abgelehnt' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
      await invalidateProposalQueries(queryClient, proposalId, undefined, userId);
      fetchProposals();
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
        handwerkerName: p.handwerker_profiles?.profiles?.full_name || 'Handwerker',
        handwerkerCity: p.handwerker_profiles?.business_city || null,
        companyName: p.handwerker_profiles?.company_name || null,
        logoUrl: p.handwerker_profiles?.logo_url || null,
        rating: p.rating_stats?.average_rating || undefined,
        reviewCount: p.rating_stats?.review_count || undefined,
        isVerified: p.handwerker_profiles?.verification_status === 'approved',
        hasInsurance: !!p.handwerker_profiles?.liability_insurance_provider,
        bio: p.handwerker_profiles?.bio || undefined,
      }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
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
        <EmptyState 
          variant="proposals"
          description={filterStatus === 'all' 
            ? 'Sie haben noch keine Offerten erhalten.'
            : 'Keine Offerten mit diesem Status gefunden.'}
        />
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const handwerkerName = proposal.handwerker_profiles?.profiles?.full_name?.split(' ')[0] || 'Handwerker';
            const isInComparison = comparisonIds.has(proposal.id);

            return (
              <Card key={proposal.id} className={`hover:shadow-md transition-shadow ${isInComparison ? 'ring-2 ring-primary' : ''}`}>
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
                    {proposal.status === 'pending' && (
                      <Button
                        variant={isInComparison ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleComparisonToggle(proposal.id)}
                        className="shrink-0"
                      >
                        <LayoutGrid className="h-4 w-4 mr-1" />
                        {isInComparison ? 'Ausgewählt' : 'Vergleichen'}
                      </Button>
                    )}
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

                  {/* Attachments */}
                  {proposal.attachments && proposal.attachments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-[hsl(var(--muted))] rounded-lg">
                      <Paperclip className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-sm">Dokumente:</span>
                      {proposal.attachments.map((url, idx) => {
                        const fileName = url.split('/').pop() || `Dokument ${idx + 1}`;
                        const displayName = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName;
                        const isPdf = url.toLowerCase().endsWith('.pdf');
                        return (
                          <a 
                            key={idx}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            {isPdf ? <FileText className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                            <Download className="h-3 w-3" />
                            {displayName}
                          </a>
                        );
                      })}
                    </div>
                  )}

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

                  {/* Contact Details for Accepted Proposals */}
                  {proposal.status === 'accepted' && proposal.handwerker_profiles && (
                    <div className="border-t pt-4 mt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-muted-foreground">Kontaktdaten</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/handwerker/${proposal.handwerker_id}`}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Profil ansehen
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {/* Full Name */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {proposal.handwerker_profiles.profiles?.full_name || 
                              `${proposal.handwerker_profiles.first_name || ''} ${proposal.handwerker_profiles.last_name || ''}`.trim() || 
                              'Handwerker'}
                          </span>
                          {proposal.handwerker_profiles.company_name && (
                            <span className="text-muted-foreground">
                              ({proposal.handwerker_profiles.company_name})
                            </span>
                          )}
                        </div>
                        
                        {/* Phone */}
                        {proposal.handwerker_profiles.phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={`tel:${proposal.handwerker_profiles.phone_number}`} 
                              className="text-primary hover:underline"
                            >
                              {proposal.handwerker_profiles.phone_number}
                            </a>
                          </div>
                        )}
                        
                        {/* Email */}
                        {proposal.handwerker_profiles.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={`mailto:${proposal.handwerker_profiles.email}`} 
                              className="text-primary hover:underline"
                            >
                              {proposal.handwerker_profiles.email}
                            </a>
                          </div>
                        )}
                        
                        {/* Address */}
                        {(proposal.handwerker_profiles.business_address || proposal.handwerker_profiles.business_city) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {[
                                proposal.handwerker_profiles.business_address,
                                proposal.handwerker_profiles.business_zip,
                                proposal.handwerker_profiles.business_city
                              ].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        
                        {/* Website */}
                        {proposal.handwerker_profiles.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={proposal.handwerker_profiles.website.startsWith('http') 
                                ? proposal.handwerker_profiles.website 
                                : `https://${proposal.handwerker_profiles.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Message Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          const { data: conversation } = await supabase
                            .from('conversations')
                            .select('id')
                            .eq('lead_id', proposal.lead_id)
                            .eq('handwerker_id', proposal.handwerker_id)
                            .maybeSingle();
                          
                          if (conversation) {
                            navigate(`/messages/${conversation.id}`);
                          } else {
                            toast({
                              title: "Keine Unterhaltung gefunden",
                              description: "Es wurde noch keine Unterhaltung mit diesem Handwerker erstellt.",
                            });
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Nachricht senden
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
    </div>
  );
};
