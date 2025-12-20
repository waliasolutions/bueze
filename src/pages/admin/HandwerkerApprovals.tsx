import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { checkUserIsAdmin, upsertUserRole } from '@/lib/roleHelpers';
import { Loader2, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, Briefcase, FileText, User, Building2, CreditCard, Shield, Download, AlertTriangle, Search, Filter, History, Trash2, Pencil } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getCantonLabel } from '@/config/cantons';
import { calculateProfileCompleteness } from '@/lib/profileCompleteness';

interface PendingHandwerker {
  id: string;
  user_id: string | null;
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
  personal_address: string | null;
  personal_zip: string | null;
  personal_city: string | null;
  personal_canton: string | null;
  company_name: string | null;
  company_legal_form: string | null;
  uid_number: string | null;
  mwst_number: string | null;
  business_address: string | null;
  business_zip: string | null;
  business_city: string | null;
  business_canton: string | null;
  iban: string | null;
  bank_name: string | null;
  liability_insurance_provider: string | null;
  liability_insurance_policy_number: string | null;
  insurance_valid_until: string | null;
  trade_license_number: string | null;
  tax_id: string | null;
  logo_url: string | null;
  bio: string | null;
  verification_status: string;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  portfolio_urls: string[] | null;
}

interface ApprovalHistoryEntry {
  id: string;
  handwerker_profile_id: string;
  action: string;
  admin_id: string;
  admin_email: string;
  reason: string | null;
  created_at: string;
  handwerker_profiles: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
  };
}

const HandwerkerApprovals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingHandwerkers, setPendingHandwerkers] = useState<PendingHandwerker[]>([]);
  const [filteredHandwerkers, setFilteredHandwerkers] = useState<PendingHandwerker[]>([]);
  const [approving, setApproving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [completenessFilter, setCompletenessFilter] = useState<string>('all');
  const [documentsFilter, setDocumentsFilter] = useState<string>('all');
  const [selectedHandwerkers, setSelectedHandwerkers] = useState<string[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingHandwerker, setEditingHandwerker] = useState<PendingHandwerker | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PendingHandwerker>>({});

  useEffect(() => {
    if (!roleLoading) {
      if (!isAdmin) {
        toast({
          title: 'Zugriff verweigert',
          description: 'Sie haben keine Berechtigung für diese Seite.',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } else {
        fetchPendingHandwerkers();
        fetchApprovalHistory();
        setIsLoading(false);
      }
    }
  }, [roleLoading, isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, completenessFilter, documentsFilter, pendingHandwerkers]);

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
          personal_address,
          personal_zip,
          personal_city,
          personal_canton,
          company_name,
          company_legal_form,
          uid_number,
          mwst_number,
          business_address,
          business_zip,
          business_city,
          business_canton,
          iban,
          bank_name,
          liability_insurance_provider,
          liability_insurance_policy_number,
          insurance_valid_until,
          trade_license_number,
          tax_id,
          logo_url,
          bio,
          verification_status,
          hourly_rate_min,
          hourly_rate_max,
          portfolio_urls
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

  const getCompleteness = (handwerker: PendingHandwerker) => {
    return calculateProfileCompleteness({
      first_name: handwerker.first_name,
      last_name: handwerker.last_name,
      email: handwerker.email,
      phone_number: handwerker.phone_number,
      company_name: handwerker.company_name,
      bio: handwerker.bio,
      hourly_rate_min: handwerker.hourly_rate_min,
      hourly_rate_max: handwerker.hourly_rate_max,
      service_areas: handwerker.service_areas,
      portfolio_urls: handwerker.portfolio_urls,
      logo_url: handwerker.logo_url,
      uid_number: handwerker.uid_number,
      iban: handwerker.iban,
    });
  };

  const downloadDocument = async (documentUrl: string, fileName: string) => {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('handwerker-documents')
        .getPublicUrl(documentUrl);
      
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Download fehlgeschlagen',
        description: 'Dokument konnte nicht heruntergeladen werden.',
        variant: 'destructive',
      });
    }
  };

  const formatIBAN = (iban: string | null) => {
    if (!iban) return null;
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  const fetchApprovalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('handwerker_approval_history')
        .select(`
          *,
          handwerker_profiles(first_name, last_name, company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setApprovalHistory(data as ApprovalHistoryEntry[]);
      }
    } catch (error) {
      console.error('Error fetching approval history:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...pendingHandwerkers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Completeness filter
    if (completenessFilter !== 'all') {
      filtered = filtered.filter(h => {
        const completeness = getCompleteness(h);
        if (completenessFilter === 'complete') return completeness.percentage >= 80;
        if (completenessFilter === 'partial') return completeness.percentage >= 50 && completeness.percentage < 80;
        if (completenessFilter === 'incomplete') return completeness.percentage < 50;
        return true;
      });
    }

    // Documents filter
    if (documentsFilter !== 'all') {
      filtered = filtered.filter(h => {
        const hasDocuments = h.verification_documents && h.verification_documents.length > 0;
        return documentsFilter === 'with' ? hasDocuments : !hasDocuments;
      });
    }

    setFilteredHandwerkers(filtered);
  };

  const logApprovalAction = async (handwerkerId: string, action: 'approved' | 'rejected', reason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('handwerker_approval_history')
        .insert({
          handwerker_profile_id: handwerkerId,
          action,
          admin_id: user.id,
          admin_email: user.email || '',
          reason: reason || null
        });

      await fetchApprovalHistory();
    } catch (error) {
      console.error('Error logging approval action:', error);
    }
  };

  const toggleHandwerkerSelection = (id: string) => {
    setSelectedHandwerkers(prev =>
      prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
    );
  };

  const bulkApprove = async () => {
    if (selectedHandwerkers.length === 0) return;

    const completeHandwerkers = selectedHandwerkers
      .map(id => pendingHandwerkers.find(h => h.id === id))
      .filter(h => h && getCompleteness(h).isComplete);

    if (completeHandwerkers.length === 0) {
      toast({
        title: 'Keine vollständigen Profile',
        description: 'Nur vollständige Profile können freigegeben werden.',
        variant: 'destructive',
      });
      return;
    }

    setApproving('bulk');
    let successCount = 0;

    for (const handwerker of completeHandwerkers) {
      if (!handwerker) continue;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const adminId = user?.id || null;

        // Update profile status
        const { error: updateError } = await supabase
          .from('handwerker_profiles')
          .update({
            verification_status: 'approved',
            is_verified: true,
            verified_at: new Date().toISOString(),
            verified_by: adminId,
          })
          .eq('id', handwerker.id);

        if (!updateError) {
          // Only upsert handwerker role if user is not an admin (use SSOT roleHelpers)
          if (handwerker.user_id) {
            const isAdminUser = await checkUserIsAdmin(handwerker.user_id);
            
            // Only add handwerker role for non-admins
            if (!isAdminUser) {
              await upsertUserRole(handwerker.user_id, 'handwerker');
            }

            // Create subscription (if not exists)
            await supabase
              .from('handwerker_subscriptions')
              .upsert({
                user_id: handwerker.user_id,
                plan_type: 'free',
                proposals_limit: 5,
                proposals_used_this_period: 0
              }, { onConflict: 'user_id' });
          }

          // Send approval email
          await supabase.functions.invoke('send-approval-email', {
            body: { 
              userId: handwerker.user_id,
              userName: `${handwerker.first_name} ${handwerker.last_name}`,
              userEmail: handwerker.email
            }
          });

          await logApprovalAction(handwerker.id, 'approved');
          successCount++;
        }
      } catch (error) {
        console.error(`Error approving ${handwerker.id}:`, error);
      }
    }

    setApproving(null);
    setSelectedHandwerkers([]);
    await fetchPendingHandwerkers();

    toast({
      title: 'Massenfreischaltung abgeschlossen',
      description: `${successCount} von ${completeHandwerkers.length} Handwerkern wurden freigeschaltet.`,
    });
  };

  const approveHandwerker = async (handwerker: PendingHandwerker) => {
    setApproving(handwerker.id);
    try {
      // Get current user's ID for admin tracking
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id || null;

      // Update profile status to approved
      const { error: updateError } = await supabase
        .from('handwerker_profiles')
        .update({
          verification_status: 'approved',
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', handwerker.id);

      if (updateError) throw updateError;

      // Parallelize: subscription creation + conditional role assignment (non-blocking)
      if (handwerker.user_id) {
        const userId = handwerker.user_id;
        
        // Use SSOT roleHelpers for role checking and assignment
        (async () => {
          try {
            const isAdminUser = await checkUserIsAdmin(userId);
            
            // Always create subscription
            const subResult = await supabase
              .from('handwerker_subscriptions')
              .upsert({
                user_id: userId,
                plan_type: 'free',
                proposals_limit: 5,
                proposals_used_this_period: 0
              }, { onConflict: 'user_id' });
            
            if (subResult.error) console.error('Subscription error (non-critical):', subResult.error);
            
            // Only add handwerker role for non-admins
            if (!isAdminUser) {
              const roleResult = await upsertUserRole(userId, 'handwerker');
              if (!roleResult.success) console.error('Role upsert error (non-critical):', roleResult.error);
            }
          } catch (err) {
            console.error('Parallel ops error:', err);
          }
        })();
      }

      // Non-blocking: Send approval notification email (fire-and-forget)
      supabase.functions.invoke('send-approval-email', {
        body: { 
          userId: handwerker.user_id,
          userName: `${handwerker.first_name} ${handwerker.last_name}`,
          userEmail: handwerker.email
        }
      }).catch(err => console.error('Approval email error (non-critical):', err));

      // Non-blocking: Log approval action
      logApprovalAction(handwerker.id, 'approved').catch(err => 
        console.error('Log action error (non-critical):', err)
      );

      toast({
        title: 'Handwerker freigeschaltet',
        description: `${handwerker.first_name} ${handwerker.last_name} wurde erfolgreich freigeschaltet und per E-Mail informiert.`,
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

      // Non-blocking: Log rejection action and send email in parallel
      logApprovalAction(handwerker.id, 'rejected', reason || undefined)
        .catch(err => console.error('Log action error (non-critical):', err));

      // Non-blocking: Send rejection email (fire-and-forget)
      supabase.functions.invoke('send-rejection-email', {
        body: { 
          email: handwerker.email,
          firstName: handwerker.first_name,
          lastName: handwerker.last_name,
          companyName: handwerker.company_name,
          reason: reason || undefined
        }
      }).catch(err => console.error('Email sending error:', err));

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

  const deleteHandwerker = async (handwerker: PendingHandwerker) => {
    const confirmMessage = `Sind Sie sicher, dass Sie ${handwerker.first_name} ${handwerker.last_name} (${handwerker.email}) löschen möchten?\n\nDies löscht alle zugehörigen Daten vollständig. Der Benutzer kann sich danach neu registrieren.\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setApproving(handwerker.id);
    try {
      // Use the delete-user edge function for complete cleanup
      const { data: { session } } = await supabase.auth.getSession();
      
      // If handwerker has a user_id, delete via userId; otherwise delete via email (guest registration)
      const deletePayload = handwerker.user_id 
        ? { userId: handwerker.user_id }
        : { email: handwerker.email };
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: deletePayload,
      });

      if (error) throw error;

      // Show appropriate message based on deletion result
      if (data?.verified) {
        toast({
          title: 'Handwerker vollständig gelöscht',
          description: `${handwerker.first_name} ${handwerker.last_name} und alle zugehörigen Daten wurden erfolgreich gelöscht.`,
        });
      } else if (data?.warnings?.length > 0) {
        toast({
          title: 'Handwerker gelöscht (mit Warnungen)',
          description: `${handwerker.first_name} ${handwerker.last_name} wurde gelöscht. ${data.warnings.length} Warnungen - Details im Admin-Bereich.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Handwerker gelöscht',
          description: data?.message || `${handwerker.first_name} ${handwerker.last_name} wurde erfolgreich gelöscht.`,
        });
      }

      await fetchPendingHandwerkers();
    } catch (error) {
      console.error('Error deleting handwerker:', error);
      toast({
        title: 'Fehler',
        description: 'Löschen fehlgeschlagen. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setApproving(null);
    }
  };

  const openEditDialog = (handwerker: PendingHandwerker) => {
    setEditingHandwerker(handwerker);
    setEditFormData({ ...handwerker });
  };

  const saveHandwerkerEdit = async () => {
    if (!editingHandwerker) return;

    try {
      const { error } = await supabase
        .from('handwerker_profiles')
        .update(editFormData as any)
        .eq('id', editingHandwerker.id);

      if (error) throw error;

      toast({
        title: 'Profil aktualisiert',
        description: 'Die Änderungen wurden erfolgreich gespeichert.',
      });

      setEditingHandwerker(null);
      setEditFormData({});
      await fetchPendingHandwerkers();
    } catch (error) {
      console.error('Error updating handwerker:', error);
      toast({
        title: 'Fehler',
        description: 'Aktualisierung fehlgeschlagen.',
        variant: 'destructive',
      });
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-ink-900 mb-2">
                  Handwerker-Freigaben
                </h1>
                <p className="text-ink-600">
                  Überprüfen und freischalten Sie Handwerker-Profile
                </p>
              </div>
              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <History className="h-4 w-4" />
                    Verlauf
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Freigabe-Verlauf</DialogTitle>
                    <DialogDescription>
                      Chronik aller Freigaben und Ablehnungen
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {approvalHistory.map((entry) => (
                      <Card key={entry.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {entry.handwerker_profiles?.first_name} {entry.handwerker_profiles?.last_name}
                                {entry.handwerker_profiles?.company_name && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({entry.handwerker_profiles.company_name})
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {entry.action === 'approved' ? 'Freigegeben' : 'Abgelehnt'} von {entry.admin_email}
                              </p>
                              {entry.reason && (
                                <p className="text-sm text-muted-foreground mt-1">Grund: {entry.reason}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(entry.created_at).toLocaleString('de-CH')}
                              </p>
                            </div>
                            <Badge variant={entry.action === 'approved' ? 'default' : 'destructive'}>
                              {entry.action === 'approved' ? 'Freigegeben' : 'Abgelehnt'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={completenessFilter} onValueChange={setCompletenessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Vollständigkeit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="complete">Vollständig (≥80%)</SelectItem>
                  <SelectItem value="partial">Teilweise (50-79%)</SelectItem>
                  <SelectItem value="incomplete">Unvollständig (&lt;50%)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={documentsFilter} onValueChange={setDocumentsFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Dokumente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="with">Mit Dokumenten</SelectItem>
                  <SelectItem value="without">Ohne Dokumente</SelectItem>
                </SelectContent>
              </Select>
              {selectedHandwerkers.length > 0 && (
                <Button onClick={bulkApprove} disabled={approving === 'bulk'} className="gap-2">
                  {approving === 'bulk' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {selectedHandwerkers.length} freigeben
                </Button>
              )}
            </div>
          </div>

          {filteredHandwerkers.length === 0 ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {pendingHandwerkers.length === 0 
                  ? 'Keine ausstehenden Handwerker-Freigaben.'
                  : 'Keine Ergebnisse für die aktuellen Filter.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredHandwerkers.map((handwerker) => {
                const completeness = getCompleteness(handwerker);
                const isSelected = selectedHandwerkers.includes(handwerker.id);
                
                return (
                  <Card key={handwerker.id} className={isSelected ? 'border-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {completeness.isComplete && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleHandwerkerSelection(handwerker.id)}
                              className="mt-1"
                            />
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-xl">
                              {handwerker.first_name} {handwerker.last_name}
                              {handwerker.company_name && (
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                  ({handwerker.company_name})
                                </span>
                              )}
                            </CardTitle>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {handwerker.email}
                              </span>
                              {handwerker.phone_number && (
                                <span className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {handwerker.phone_number}
                                </span>
                              )}
                            </div>
                            
                            {/* Completeness Score */}
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Vollständigkeit des Profils</span>
                                <Badge variant={completeness.percentage >= 80 ? "default" : completeness.percentage >= 50 ? "secondary" : "destructive"}>
                                  {completeness.percentage}%
                                </Badge>
                              </div>
                              <Progress value={completeness.percentage} className="h-2" />
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1 ml-4">
                          <Clock className="h-3 w-3" />
                          Ausstehend
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <Accordion type="multiple" className="w-full">
                        {/* Personal Information */}
                        <AccordionItem value="personal">
                          <AccordionTrigger className="text-sm font-semibold">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Persönliche Informationen
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Name:</span>
                                  <p className="text-sm">{handwerker.first_name} {handwerker.last_name}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">E-Mail:</span>
                                  <p className="text-sm">{handwerker.email}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Telefon:</span>
                                  <p className="text-sm">{handwerker.phone_number || 'Nicht angegeben'}</p>
                                </div>
                              </div>
                              {(handwerker.personal_address || handwerker.personal_city) && (
                                <div className="pt-2 border-t">
                                  <span className="text-sm font-medium text-muted-foreground">Privatadresse:</span>
                                  <p className="text-sm">
                                    {handwerker.personal_address && <>{handwerker.personal_address}<br /></>}
                                    {handwerker.personal_zip} {handwerker.personal_city}
                                    {handwerker.personal_canton && `, ${getCantonLabel(handwerker.personal_canton)}`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Company Information */}
                        <AccordionItem value="company">
                          <AccordionTrigger className="text-sm font-semibold">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Firmeninformationen
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Firmenname:</span>
                                  <p className="text-sm">{handwerker.company_name || 'Nicht angegeben'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Rechtsform:</span>
                                  <div className="mt-1">
                                    {handwerker.company_legal_form ? (
                                      <Badge variant="secondary">{handwerker.company_legal_form}</Badge>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Nicht angegeben</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">UID-Nummer:</span>
                                  <p className="text-sm font-mono">{handwerker.uid_number || 'Nicht angegeben'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">MWST-Nummer:</span>
                                  <p className="text-sm font-mono">{handwerker.mwst_number || 'Nicht angegeben'}</p>
                                </div>
                              </div>
                              {(handwerker.business_address || handwerker.business_city) && (
                                <div className="pt-2 border-t">
                                  <span className="text-sm font-medium text-muted-foreground">Geschäftsadresse:</span>
                                  <p className="text-sm">
                                    {handwerker.business_address && <>{handwerker.business_address}<br /></>}
                                    {handwerker.business_zip} {handwerker.business_city}
                                    {handwerker.business_canton && `, ${getCantonLabel(handwerker.business_canton)}`}
                                  </p>
                                  {handwerker.personal_address === handwerker.business_address && 
                                   handwerker.personal_city === handwerker.business_city && (
                                    <Badge variant="outline" className="mt-2">Gleich wie Privatadresse</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Banking Information */}
                        <AccordionItem value="banking">
                          <AccordionTrigger className="text-sm font-semibold">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Bankinformationen
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">IBAN:</span>
                                  <p className="text-sm font-mono">{formatIBAN(handwerker.iban) || 'Nicht angegeben'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Bank:</span>
                                  <p className="text-sm">{handwerker.bank_name || 'Nicht angegeben'}</p>
                                </div>
                              </div>
                              {!handwerker.iban && (
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm">Bankinformationen fehlen</span>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Insurance & Licenses */}
                        <AccordionItem value="insurance">
                          <AccordionTrigger className="text-sm font-semibold">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Versicherungen & Lizenzen
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Haftpflichtversicherung:</span>
                                  <p className="text-sm">{handwerker.liability_insurance_provider || 'Nicht angegeben'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Policen-Nummer:</span>
                                  <p className="text-sm font-mono">{handwerker.liability_insurance_policy_number || 'Nicht angegeben'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Gültig bis:</span>
                                  <p className="text-sm">
                                    {handwerker.insurance_valid_until 
                                      ? new Date(handwerker.insurance_valid_until).toLocaleDateString('de-CH')
                                      : 'Nicht angegeben'
                                    }
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Gewerbeschein:</span>
                                  <p className="text-sm">{handwerker.trade_license_number || handwerker.business_license || 'Nicht angegeben'}</p>
                                </div>
                              </div>
                              {!handwerker.liability_insurance_provider && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm">Versicherungsinformationen fehlen</span>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* Documents & Logo */}
                        <AccordionItem value="documents">
                          <AccordionTrigger className="text-sm font-semibold">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Dokumente & Logo
                              {handwerker.verification_documents?.length > 0 && (
                                <Badge variant="secondary" className="ml-2">{handwerker.verification_documents.length}</Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              {/* Logo */}
                              {handwerker.logo_url && (
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground block mb-2">Logo:</span>
                                  <div className="border rounded-lg p-4 bg-muted/30 inline-block">
                                    <img 
                                      src={handwerker.logo_url} 
                                      alt="Firmenlogo" 
                                      className="h-16 w-auto object-contain"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {/* Verification Documents */}
                              <div>
                                <span className="text-sm font-medium text-muted-foreground block mb-2">Verifizierungsdokumente:</span>
                                {handwerker.verification_documents && handwerker.verification_documents.length > 0 ? (
                                  <div className="space-y-2">
                                    {handwerker.verification_documents.map((doc, index) => (
                                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">Dokument {index + 1}</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => downloadDocument(doc, `dokument-${index + 1}`)}
                                        >
                                          <Download className="h-4 w-4 mr-1" />
                                          Download
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm">Keine Dokumente hochgeladen</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      {/* Categories and Service Areas - Always Visible */}
                      <div className="pt-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
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
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
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
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
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
                        <Button
                          onClick={() => openEditDialog(handwerker)}
                          disabled={approving === handwerker.id}
                          variant="secondary"
                          size="icon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteHandwerker(handwerker)}
                          disabled={approving === handwerker.id}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Edit Dialog */}
      <Dialog open={!!editingHandwerker} onOpenChange={(open) => !open && setEditingHandwerker(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Handwerker-Profil bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Profileinformationen für {editingHandwerker?.first_name} {editingHandwerker?.last_name}
            </DialogDescription>
          </DialogHeader>

          {editingHandwerker && (
            <div className="space-y-6 py-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Persönliche Informationen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Vorname</Label>
                    <Input
                      id="first_name"
                      value={editFormData.first_name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nachname</Label>
                    <Input
                      id="last_name"
                      value={editFormData.last_name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Telefon</Label>
                    <Input
                      id="phone_number"
                      value={editFormData.phone_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Firmeninformationen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Firmenname</Label>
                    <Input
                      id="company_name"
                      value={editFormData.company_name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_legal_form">Rechtsform</Label>
                    <Input
                      id="company_legal_form"
                      value={editFormData.company_legal_form || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, company_legal_form: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uid_number">UID-Nummer</Label>
                    <Input
                      id="uid_number"
                      value={editFormData.uid_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, uid_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mwst_number">MWST-Nummer</Label>
                    <Input
                      id="mwst_number"
                      value={editFormData.mwst_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, mwst_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="business_address">Geschäftsadresse</Label>
                    <Input
                      id="business_address"
                      value={editFormData.business_address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, business_address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_zip">PLZ</Label>
                    <Input
                      id="business_zip"
                      value={editFormData.business_zip || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, business_zip: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_city">Ort</Label>
                    <Input
                      id="business_city"
                      value={editFormData.business_city || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, business_city: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Bankinformationen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={editFormData.iban || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, iban: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank</Label>
                    <Input
                      id="bank_name"
                      value={editFormData.bank_name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Versicherungen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="liability_insurance_provider">Haftpflichtversicherung</Label>
                    <Input
                      id="liability_insurance_provider"
                      value={editFormData.liability_insurance_provider || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, liability_insurance_provider: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liability_insurance_policy_number">Policen-Nummer</Label>
                    <Input
                      id="liability_insurance_policy_number"
                      value={editFormData.liability_insurance_policy_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, liability_insurance_policy_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_valid_until">Gültig bis</Label>
                    <Input
                      id="insurance_valid_until"
                      type="date"
                      value={editFormData.insurance_valid_until || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, insurance_valid_until: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trade_license_number">Gewerbeschein</Label>
                    <Input
                      id="trade_license_number"
                      value={editFormData.trade_license_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, trade_license_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Beschreibung</Label>
                <Textarea
                  id="bio"
                  value={editFormData.bio || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingHandwerker(null)}>
              Abbrechen
            </Button>
            <Button onClick={saveHandwerkerEdit}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HandwerkerApprovals;
