import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, Coins, Calendar, AlertCircle } from 'lucide-react';

const OpportunityView = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasProposal, setHasProposal] = useState(false);

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [leadId]);

  const fetchData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, title, description, category, budget_min, budget_max, urgency, city, canton, zip, proposal_deadline, created_at')
        .eq('id', leadId)
        .eq('status', 'active')
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      if (currentUser) {
        const { data: existingProposal } = await supabase
          .from('lead_proposals')
          .select('id')
          .eq('lead_id', leadId)
          .eq('handwerker_id', currentUser.id)
          .maybeSingle();

        setHasProposal(!!existingProposal);
      }

    } catch (error) {
      console.error('Error fetching opportunity:', error);
      toast({
        title: 'Fehler',
        description: 'Anfrage konnte nicht geladen werden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Anmeldung erforderlich',
        description: 'Bitte melden Sie sich an, um eine Offerte einzureichen',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (message.length < 50) {
      toast({
        title: 'Nachricht zu kurz',
        description: 'Bitte schreiben Sie mindestens 50 Zeichen',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      // Check if user can submit proposal
      const { data: canSubmit, error: checkError } = await supabase
        .rpc('can_submit_proposal', { handwerker_user_id: user.id });

      if (checkError) throw checkError;

      if (!canSubmit) {
        toast({
          title: 'Kontingent erschöpft',
          description: 'Sie haben Ihr monatliches Offerten-Limit erreicht. Bitte upgraden Sie Ihr Abo.',
          variant: 'destructive'
        });
        navigate('/checkout');
        return;
      }

      const { error: proposalError } = await supabase
        .from('lead_proposals')
        .insert({
          lead_id: leadId,
          handwerker_id: user.id,
          price_min: parseInt(priceMin),
          price_max: parseInt(priceMax),
          estimated_duration_days: duration ? parseInt(duration) : null,
          message
        });

      if (proposalError) throw proposalError;

      toast({
        title: 'Offerte eingereicht!',
        description: 'Der Kunde wurde benachrichtigt und wird Ihre Offerte prüfen.',
      });

      setHasProposal(true);

    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast({
        title: 'Fehler',
        description: 'Offerte konnte nicht eingereicht werden',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Lädt...</div>;
  }

  if (!lead) {
    return <div className="min-h-screen flex items-center justify-center">Anfrage nicht gefunden</div>;
  }

  const isExpired = lead.proposal_deadline && new Date(lead.proposal_deadline) < new Date();
  const daysUntilDeadline = lead.proposal_deadline 
    ? Math.ceil((new Date(lead.proposal_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{lead.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 text-base">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {lead.city}, {lead.canton}
                  </span>
                  <Badge>{lead.category}</Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Projektbeschreibung</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{lead.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Budget</div>
                  <div className="font-medium">
                    CHF {lead.budget_min?.toLocaleString()} - {lead.budget_max?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Dringlichkeit</div>
                  <div className="font-medium capitalize">{lead.urgency}</div>
                </div>
              </div>
            </div>

            {lead.proposal_deadline && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Frist für Offerten</div>
                    <div className="text-sm text-muted-foreground">
                      {isExpired ? 'Abgelaufen' : `Noch ${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'Tag' : 'Tage'}`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isExpired ? (
              <div className="bg-muted border rounded-lg p-6 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Frist abgelaufen</h3>
                <p className="text-muted-foreground">Die Frist für diese Anfrage ist abgelaufen.</p>
              </div>
            ) : hasProposal ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-green-600 text-5xl mb-3">✓</div>
                <h3 className="font-semibold text-green-900 mb-2">Offerte eingereicht</h3>
                <p className="text-green-700">Sie haben bereits eine Offerte für diese Anfrage eingereicht.</p>
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => navigate('/handwerker-dashboard')}
                >
                  Zum Dashboard
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-4">
                <h3 className="font-semibold text-lg">Ihre Offerte einreichen</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceMin">Preis von (CHF) *</Label>
                    <Input
                      id="priceMin"
                      type="number"
                      required
                      min="0"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="z.B. 1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceMax">Preis bis (CHF) *</Label>
                    <Input
                      id="priceMax"
                      type="number"
                      required
                      min="0"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="z.B. 1500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Geschätzte Dauer (Tage)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="z.B. 5"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Ihre Nachricht * (min. 50 Zeichen)</Label>
                  <Textarea
                    id="message"
                    required
                    minLength={50}
                    maxLength={2000}
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Beschreiben Sie Ihre Erfahrung, Herangehensweise und warum Sie der richtige Handwerker für dieses Projekt sind..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {message.length}/2000 Zeichen
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Wird eingereicht...' : 'Offerte einreichen'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default OpportunityView;
