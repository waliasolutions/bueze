import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, Briefcase, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PendingHandwerker {
  id: string;
  user_id: string | null; // Nullable for guest registrations
  is_verified: boolean;
  categories: string[];
  service_areas: string[];
  business_license: string | null;
  verification_documents: string[] | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  company_name: string | null;
  business_city: string | null;
  business_canton: string | null;
  verification_status: string;
}

const HandwerkerApprovals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingHandwerkers, setPendingHandwerkers] = useState<PendingHandwerker[]>([]);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Nicht angemeldet',
          description: 'Bitte melden Sie sich an.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'super_admin')) {
        toast({
          title: 'Zugriff verweigert',
          description: 'Sie haben keine Berechtigung für diese Seite.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await fetchPendingHandwerkers();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingHandwerkers = async () => {
    try {
      const { data, error } = await supabase
        .from('handwerker_profiles')
        .select(`
          id,
          user_id,
          is_verified,
          categories,
          service_areas,
          business_license,
          verification_documents,
          created_at,
          first_name,
          last_name,
          email,
          phone_number,
          company_name,
          business_city,
          business_canton,
          verification_status
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingHandwerkers((data || []) as PendingHandwerker[]);
    } catch (error) {
      console.error('Error fetching pending handwerkers:', error);
      toast({
        title: 'Fehler',
        description: 'Konnte Handwerker-Liste nicht laden.',
        variant: 'destructive',
      });
    }
  };

  const approveHandwerker = async (handwerker: PendingHandwerker) => {
    setApproving(handwerker.id);
    try {
      // Get current user's email for admin tracking
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email || 'info@walia-solutions.ch';

      // Call edge function to create account and send credentials
      const { data, error } = await supabase.functions.invoke('create-handwerker-account', {
        body: { 
          profileId: handwerker.id,
          adminEmail: adminEmail,
        }
      });

      if (error) throw error;

      toast({
        title: 'Handwerker freigeschaltet',
        description: `${handwerker.first_name} ${handwerker.last_name} wurde erfolgreich freigeschaltet und erhält seine Zugangsdaten per E-Mail.`,
        duration: 6000,
      });

      await fetchPendingHandwerkers();
    } catch (error) {
      console.error('Error approving handwerker:', error);
      toast({
        title: 'Fehler',
        description: 'Freischaltung fehlgeschlagen. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setApproving(null);
    }
  };

  const rejectHandwerker = async (handwerker: PendingHandwerker) => {
    const reason = prompt('Grund für Ablehnung (optional):');
    
    setApproving(handwerker.id);
    try {
      // Update verification status to rejected
      const { error: updateError } = await supabase
        .from('handwerker_profiles')
        .update({ verification_status: 'rejected' })
        .eq('id', handwerker.id);

      if (updateError) throw updateError;

      // Send rejection email
      const { error: emailError } = await supabase.functions.invoke('send-rejection-email', {
        body: { 
          email: handwerker.email,
          firstName: handwerker.first_name,
          lastName: handwerker.last_name,
          companyName: handwerker.company_name,
          reason: reason || undefined
        }
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        // Don't throw - still mark as rejected even if email fails
      }

      toast({
        title: 'Handwerker abgelehnt',
        description: `${handwerker.first_name} ${handwerker.last_name} wurde abgelehnt und per E-Mail informiert.`,
      });

      await fetchPendingHandwerkers();
    } catch (error) {
      console.error('Error rejecting handwerker:', error);
      toast({
        title: 'Fehler',
        description: 'Ablehnung fehlgeschlagen.',
        variant: 'destructive',
      });
    } finally {
      setApproving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink-900 mb-2">
              Handwerker-Freigaben
            </h1>
            <p className="text-ink-600">
              Überprüfen und freischalten Sie Handwerker-Profile
            </p>
          </div>

          {pendingHandwerkers.length === 0 ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Keine ausstehenden Handwerker-Freigaben.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingHandwerkers.map((handwerker) => (
                <Card key={handwerker.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          {handwerker.first_name} {handwerker.last_name}
                          {handwerker.company_name && (
                            <span className="text-sm font-normal text-ink-600 ml-2">
                              ({handwerker.company_name})
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {handwerker.email}
                          </div>
                          {handwerker.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {handwerker.phone_number}
                            </div>
                          )}
                          {(handwerker.business_city || handwerker.business_canton) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {[handwerker.business_city, handwerker.business_canton]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ausstehend
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-ink-900 mb-2 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Kategorien
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {handwerker.categories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-ink-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Einsatzgebiete
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {handwerker.service_areas.map((area) => (
                          <Badge key={area} variant="outline">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {handwerker.business_license && (
                      <div>
                        <h4 className="text-sm font-semibold text-ink-900 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Gewerbeschein
                        </h4>
                        <p className="text-sm text-ink-600">{handwerker.business_license}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => approveHandwerker(handwerker)}
                        disabled={approving === handwerker.id}
                        className="flex-1"
                      >
                        {approving === handwerker.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Freischalten
                      </Button>
                      <Button
                        onClick={() => rejectHandwerker(handwerker)}
                        disabled={approving === handwerker.id}
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Ablehnen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HandwerkerApprovals;
