import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Eye, MapPin, Coins, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatTimeAgo } from '@/lib/swissTime';

interface Proposal {
  id: string;
  lead_id: string;
  price_min: number;
  price_max: number;
  estimated_duration_days: number | null;
  status: string;
  submitted_at: string;
  responded_at: string | null;
  message: string;
  view_count: number;
  leads: {
    title: string;
    category: string;
    city: string;
    canton: string;
    status: string;
  };
}

interface ProposalsListProps {
  userId: string;
}

export const ProposalsList: React.FC<ProposalsListProps> = ({ userId }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, accepted: 0, rejected: 0, successRate: 0 });
  const { toast } = useToast();

  useEffect(() => {
    fetchProposals();
  }, [userId]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_proposals')
        .select(`
          *,
          leads!lead_proposals_lead_id_fkey(title, category, city, canton, status)
        `)
        .eq('handwerker_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setProposals(data || []);

      // Calculate stats
      const pending = data?.filter(p => p.status === 'pending').length || 0;
      const accepted = data?.filter(p => p.status === 'accepted').length || 0;
      const rejected = data?.filter(p => p.status === 'rejected').length || 0;
      const total = data?.length || 0;
      const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

      setStats({ pending, accepted, rejected, successRate });
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Ausstehend',
          variant: 'secondary' as const,
          icon: Clock,
          bgClass: 'bg-[hsl(var(--pastel-blue-50))] border-[hsl(var(--brand-200))]',
        };
      case 'accepted':
        return {
          label: 'Angenommen',
          variant: 'default' as const,
          icon: CheckCircle,
          bgClass: 'bg-[hsl(var(--pastel-green-50))] border-green-200',
        };
      case 'rejected':
        return {
          label: 'Abgelehnt',
          variant: 'destructive' as const,
          icon: XCircle,
          bgClass: 'bg-red-50 border-red-200',
        };
      case 'withdrawn':
        return {
          label: 'Zurückgezogen',
          variant: 'outline' as const,
          icon: XCircle,
          bgClass: 'bg-[hsl(var(--muted))] border-[hsl(var(--border))]',
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: Clock,
          bgClass: 'bg-[hsl(var(--muted))] border-[hsl(var(--border))]',
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Ausstehend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--brand-500))]">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Angenommen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Abgelehnt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Erfolgsquote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              Sie haben noch keine Offerten eingereicht.
            </p>
            <Button onClick={() => window.location.href = '/browse-leads'}>
              Anfragen durchsuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const statusConfig = getStatusConfig(proposal.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={proposal.id} className={statusConfig.bgClass}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                        {proposal.view_count > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {proposal.view_count}x angesehen
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg mb-1">{proposal.leads.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {proposal.leads.city}, {proposal.leads.canton}
                        </span>
                        <span>{proposal.leads.category}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <div>
                        <div className="text-[hsl(var(--muted-foreground))]">Preis</div>
                        <div className="font-semibold">
                          CHF {proposal.price_min.toLocaleString()} - {proposal.price_max.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {proposal.estimated_duration_days && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <div>
                          <div className="text-[hsl(var(--muted-foreground))]">Dauer</div>
                          <div className="font-semibold">{proposal.estimated_duration_days} Tage</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[hsl(var(--border))]">
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      Eingereicht {formatTimeAgo(proposal.submitted_at)}
                      {proposal.responded_at && ` · Antwort ${formatTimeAgo(proposal.responded_at)}`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
