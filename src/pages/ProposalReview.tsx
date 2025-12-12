import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { acceptProposal, rejectProposal } from '@/lib/proposalHelpers';

const ProposalReview = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      // Fetch proposal with lead data (avoid FK ambiguity by fetching profile separately)
      const { data: proposalData, error: proposalError } = await supabase
        .from('lead_proposals')
        .select(`
          *,
          leads(id, title, description, category, budget_min, budget_max)
        `)
        .eq('id', proposalId)
        .maybeSingle();

      if (proposalError) throw proposalError;
      if (!proposalData) {
        setLoading(false);
        return;
      }

      // Fetch handwerker profile separately to avoid FK ambiguity
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, city')
        .eq('id', proposalData.handwerker_id)
        .maybeSingle();

      // Fire-and-forget: Update view tracking
      supabase
        .from('lead_proposals')
        .update({
          client_viewed_at: new Date().toISOString(),
          view_count: (proposalData.view_count || 0) + 1
        })
        .eq('id', proposalId)
        .then(() => {});

      setProposal({
        ...proposalData,
        profiles: profileData
      });
    } catch (error) {
      console.error('Error fetching proposal:', error);
      // Silent fail - show 404 UI instead of toast
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!proposalId) return;
    setResponding(true);
    
    const result = await acceptProposal(proposalId);
    
    toast({
      title: result.success ? 'Offerte angenommen!' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive'
    });

    if (result.success) {
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    
    setResponding(false);
  };

  const handleReject = async () => {
    if (!proposalId) return;
    setResponding(true);
    
    const result = await rejectProposal(proposalId);
    
    toast({
      title: result.success ? 'Offerte abgelehnt' : 'Fehler',
      description: result.message,
      variant: result.success ? 'default' : 'destructive'
    });

    if (result.success) {
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    
    setResponding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Offerte nicht gefunden</h1>
            <p className="text-muted-foreground mb-6">
              Diese Offerte existiert nicht oder Sie haben keinen Zugriff darauf.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Zum Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handwerkerName = proposal.profiles?.full_name?.split(' ')[0] || 'Handwerker';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Offerte für: {proposal.leads?.title}</CardTitle>
            <CardDescription>
              Eingereicht am {new Date(proposal.submitted_at).toLocaleDateString('de-CH')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={proposal.profiles?.avatar_url} />
                <AvatarFallback>{handwerkerName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{handwerkerName}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {proposal.profiles?.city || 'Schweiz'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Offerten-Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Preis</div>
                  <div className="text-xl font-semibold">
                    CHF {proposal.price_min.toLocaleString()} - {proposal.price_max.toLocaleString()}
                  </div>
                </div>
                {proposal.estimated_duration_days && (
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Geschätzte Dauer</div>
                    <div className="text-xl font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      {proposal.estimated_duration_days} Tage
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Nachricht vom Handwerker</h3>
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                {proposal.message}
              </div>
            </div>

            {proposal.status === 'pending' && (
              <div className="flex gap-4">
                <Button
                  onClick={handleAccept}
                  disabled={responding}
                  className="flex-1"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Offerte annehmen
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={responding}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Ablehnen
                </Button>
              </div>
            )}

            {proposal.status === 'accepted' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-green-600 text-5xl mb-3">✓</div>
                <h3 className="font-semibold text-green-900 mb-2">Offerte angenommen</h3>
                <p className="text-green-700">
                  Sie haben die Kontaktdaten per E-Mail erhalten.
                </p>
              </div>
            )}

            {proposal.status === 'rejected' && (
              <div className="bg-muted border rounded-lg p-6 text-center">
                <h3 className="font-semibold mb-2">Offerte abgelehnt</h3>
                <p className="text-muted-foreground">Sie haben diese Offerte abgelehnt.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProposalReview;
