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
import { useProposalFormValidation } from '@/hooks/useProposalFormValidation';
import { MapPin, Clock, Coins, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { getUrgencyLabel } from '@/config/urgencyLevels';
import { getCantonLabel } from '@/config/cantons';
import { getCategoryLabel } from '@/config/categoryLabels';
import { ProposalFileUpload } from '@/components/ProposalFileUpload';
import { uploadProposalAttachment } from '@/lib/fileUpload';

const OpportunityView = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasProposal, setHasProposal] = useState(false);
  const [handwerkerProfile, setHandwerkerProfile] = useState<{company_name: string | null} | null>(null);

  const [formValues, setFormValues] = useState({
    price_min: '',
    price_max: '',
    message: '',
    estimated_duration_days: ''
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const { errors, touched, handleBlur, validateAll, resetValidation } = useProposalFormValidation(formValues);

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
        // Fetch handwerker profile for default message
        const { data: hwProfile } = await supabase
          .from('handwerker_profiles')
          .select('company_name')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (hwProfile) {
          setHandwerkerProfile(hwProfile);
          // Set default message
          const companyName = hwProfile.company_name || 'Ihr Handwerker-Team';
          setFormValues(prev => ({
            ...prev,
            message: `Guten Tag\n\nGerne schicken wir Ihnen unsere Offerte.\n\nFreundliche Grüsse\n${companyName}`
          }));
        }

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
      // Silent fail - show 404 UI instead of toast
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

    // Use validation hook
    if (!validateAll()) {
      toast({
        title: 'Fehlende Angaben',
        description: 'Bitte korrigieren Sie die markierten Felder.',
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

      // Upload attachment if present
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        setUploadingAttachment(true);
        const uploadResult = await uploadProposalAttachment(attachmentFile, user.id);
        if (uploadResult.error) {
          toast({
            title: 'Upload fehlgeschlagen',
            description: uploadResult.error,
            variant: 'destructive'
          });
          setUploadingAttachment(false);
          setSubmitting(false);
          return;
        }
        attachmentUrl = uploadResult.url;
        setUploadingAttachment(false);
      }

      const { error: proposalError } = await supabase
        .from('lead_proposals')
        .insert({
          lead_id: leadId,
          handwerker_id: user.id,
          price_min: parseInt(formValues.price_min),
          price_max: parseInt(formValues.price_max),
          estimated_duration_days: formValues.estimated_duration_days ? parseInt(formValues.estimated_duration_days) : null,
          message: formValues.message,
          attachments: attachmentUrl ? [attachmentUrl] : []
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
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-md mx-auto text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Anfrage nicht gefunden</h1>
            <p className="text-muted-foreground mb-6">
              Diese Anfrage existiert nicht mehr oder ist nicht mehr aktiv.
            </p>
            <Button onClick={() => navigate('/handwerker-dashboard')}>
              Zum Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
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
                    {lead.city}, {getCantonLabel(lead.canton)}
                  </span>
                  <Badge>{getCategoryLabel(lead.category)}</Badge>
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
                  <div className="font-medium">{getUrgencyLabel(lead.urgency)}</div>
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
                  <div className="space-y-2">
                    <Label htmlFor="priceMin">Preis von (CHF) *</Label>
                    <Input
                      id="priceMin"
                      type="number"
                      required
                      min="0"
                      className={touched.price_min && errors.price_min ? 'border-destructive' : ''}
                      value={formValues.price_min}
                      onChange={(e) => setFormValues(prev => ({ ...prev, price_min: e.target.value }))}
                      onBlur={() => handleBlur('price_min')}
                      placeholder="z.B. 1000"
                    />
                    {touched.price_min && errors.price_min && (
                      <p className="text-xs text-destructive">{errors.price_min}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceMax">Preis bis (CHF) *</Label>
                    <Input
                      id="priceMax"
                      type="number"
                      required
                      min="0"
                      className={touched.price_max && errors.price_max ? 'border-destructive' : ''}
                      value={formValues.price_max}
                      onChange={(e) => setFormValues(prev => ({ ...prev, price_max: e.target.value }))}
                      onBlur={() => handleBlur('price_max')}
                      placeholder="z.B. 1500"
                    />
                    {touched.price_max && errors.price_max && (
                      <p className="text-xs text-destructive">{errors.price_max}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Geschätzte Dauer (Tage)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    className={touched.estimated_duration_days && errors.estimated_duration_days ? 'border-destructive' : ''}
                    value={formValues.estimated_duration_days}
                    onChange={(e) => setFormValues(prev => ({ ...prev, estimated_duration_days: e.target.value }))}
                    onBlur={() => handleBlur('estimated_duration_days')}
                    placeholder="z.B. 5"
                  />
                  {touched.estimated_duration_days && errors.estimated_duration_days && (
                    <p className="text-xs text-destructive">{errors.estimated_duration_days}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Ihre Nachricht *</Label>
                  <Textarea
                    id="message"
                    required
                    maxLength={2000}
                    rows={6}
                    className={touched.message && errors.message ? 'border-destructive' : ''}
                    value={formValues.message}
                    onChange={(e) => setFormValues(prev => ({ ...prev, message: e.target.value }))}
                    onBlur={() => handleBlur('message')}
                    placeholder="Beschreiben Sie Ihre Erfahrung, Herangehensweise und warum Sie der richtige Handwerker für dieses Projekt sind..."
                  />
                  {touched.message && errors.message && (
                    <p className="text-xs text-destructive">{errors.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Offerte als Datei (optional)</Label>
                  <ProposalFileUpload
                    file={attachmentFile}
                    onFileSelect={setAttachmentFile}
                    uploading={uploadingAttachment}
                    disabled={submitting}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Datenschutz:</strong> Die Kontaktdaten des Kunden werden Ihnen erst nach Annahme Ihrer Offerte angezeigt.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitting || uploadingAttachment}
                >
                  {submitting || uploadingAttachment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploadingAttachment ? 'Wird hochgeladen...' : 'Wird eingereicht...'}
                    </>
                  ) : 'Offerte einreichen'}
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
