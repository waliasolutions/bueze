import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useProposalFormValidation } from "@/hooks/useProposalFormValidation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Search, MapPin, Clock, Send, Eye, EyeOff, FileText, User, Building2, Mail, Phone, AlertCircle, CheckCircle, XCircle, Loader2, Users, Star, Briefcase, Paperclip, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProposalLimitBadge } from "@/components/ProposalLimitBadge";
import { ProposalStatusBadge } from "@/components/ProposalStatusBadge";
import { HandwerkerStatusIndicator } from "@/components/HandwerkerStatusIndicator";
import { HandwerkerReviewResponse } from "@/components/HandwerkerReviewResponse";
import { ProposalFileUpload } from "@/components/ProposalFileUpload";
import { uploadProposalAttachment } from "@/lib/fileUpload";
import { majorCategories } from "@/config/majorCategories";
import { getCategoryLabel } from "@/config/categoryLabels";
import { getCantonLabel } from "@/config/cantons";
import { getUrgencyLabel, getUrgencyColor } from "@/config/urgencyLevels";
import { EmptyState, InlineEmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/page-skeleton";
import type { LeadListItem, ProposalWithClientInfo, HandwerkerProfileBasic } from "@/types/entities";

const HandwerkerDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [handwerkerProfile, setHandwerkerProfile] = useState<HandwerkerProfileBasic | null>(null);

  // Browse Leads Tab
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadListItem | null>(null);

  // Proposals Tab
  const [proposals, setProposals] = useState<ProposalWithClientInfo[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  // Reviews Tab
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState("leads");
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile Tab
  const [profileEditing, setProfileEditing] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: "",
    hourly_rate_min: "",
    hourly_rate_max: "",
    phone_number: "",
    logo_url: ""
  });

  // Proposal Form
  const [proposalForm, setProposalForm] = useState({
    price_min: "",
    price_max: "",
    message: "",
    estimated_duration_days: ""
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  
  // Form validation hook
  const { errors, touched, handleBlur, validateAll, resetValidation } = useProposalFormValidation(proposalForm);
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      if (isMounted) {
        await checkAuth();
      }
    };
    
    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Realtime subscription for new leads
  useEffect(() => {
    if (!handwerkerProfile?.verification_status || handwerkerProfile.verification_status !== 'approved') {
      return;
    }

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const newLead = payload.new as LeadListItem;
          if (newLead.status === 'active') {
            // Check if lead matches handwerker's categories and service areas
            const categories = handwerkerProfile.categories || [];
            const serviceAreas = handwerkerProfile.service_areas || [];
            
            const cantons = serviceAreas.filter(area => area.length === 2);
            const postalCodes = serviceAreas.filter(area => area.length >= 4);
            
            const categoryMatches = categories.length === 0 || categories.includes(newLead.category);
            const serviceAreaMatches = serviceAreas.length === 0 || 
              cantons.includes(newLead.canton) || postalCodes.includes(newLead.zip);
            
            if (categoryMatches && serviceAreaMatches) {
              setLeads(prev => [newLead, ...prev]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handwerkerProfile?.verification_status, handwerkerProfile?.categories, handwerkerProfile?.service_areas]);
  const checkAuth = async () => {
    try {
      setLoading(true); // Ensure loading state is set
      
      const {
        data: {
          user: currentUser
        }
      } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth?role=handwerker');
        return;
      }
      setUser(currentUser);

      // Fetch handwerker profile
      const {
        data: profile,
        error
      } = await supabase.from('handwerker_profiles').select('*').eq('user_id', currentUser.id).maybeSingle();
      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Fehler',
          description: 'Profil konnte nicht geladen werden.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      if (!profile) {
        // No profile exists - redirect to onboarding
        navigate('/handwerker-onboarding');
        return;
      }
      setHandwerkerProfile(profile);

      // Set profile data for editing
      setProfileData({
        bio: profile.bio || '',
        phone_number: profile.phone_number || '',
        hourly_rate_min: profile.hourly_rate_min?.toString() || '',
        hourly_rate_max: profile.hourly_rate_max?.toString() || '',
        logo_url: profile.logo_url || ''
      });

      // Only fetch leads if verified
      if (profile.verification_status === 'approved') {
        await Promise.all([
          fetchLeads(profile.categories, profile.service_areas), 
          fetchProposals(currentUser.id),
          fetchReviews(currentUser.id)
        ]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    }
  };
  // Removed duplicate fetchHandwerkerProfile - use checkAuth instead
  const fetchLeads = async (categories: string[], serviceAreas: string[]) => {
    setLeadsLoading(true);
    try {
      // Fetch ALL active leads - let RLS handle visibility
      const {
        data,
        error
      } = await supabase.from('leads').select('*').eq('status', 'active').order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Combined filter: BOTH category AND service area must match
      let filteredLeads = data || [];
      
      // Extract cantons (2 chars) and postal codes (4+ chars) once
      const cantons = serviceAreas.filter(area => area.length === 2);
      const postalCodes = serviceAreas.filter(area => area.length >= 4);
      
      // Apply combined filter with explicit AND logic
      filteredLeads = filteredLeads.filter(lead => {
        // CONDITION 1: Category Match (required if handwerker has categories)
        let categoryMatches = false;
        
        if (categories.length === 0) {
          // No category filter - show all categories
          categoryMatches = true;
        } else {
          // Check if handwerker's categories include the lead's category directly
          if (categories.includes(lead.category)) {
            categoryMatches = true;
          } else {
            // Check if lead's category is a major category and handwerker has a subcategory from it
            const leadMajorCat = Object.values(majorCategories).find(mc => mc.id === lead.category);
            if (leadMajorCat) {
              categoryMatches = categories.some(hwCat => leadMajorCat.subcategories.includes(hwCat));
            }
            
            // Check if handwerker's category is a major category and lead has a subcategory from it
            if (!categoryMatches) {
              const handwerkerMajorCats = categories
                .map(cat => Object.values(majorCategories).find(mc => mc.id === cat))
                .filter(Boolean);
              categoryMatches = handwerkerMajorCats.some(mc => mc?.subcategories.includes(lead.category));
            }
          }
        }
        
        // CONDITION 2: Service Area Match (required if handwerker has service areas)
        let serviceAreaMatches = false;
        
        if (serviceAreas.length === 0) {
          // No service area filter - show all areas
          serviceAreaMatches = true;
        } else {
          // Match if lead's canton is in handwerker's cantons
          // OR if lead's zip is in handwerker's postal codes
          serviceAreaMatches = cantons.includes(lead.canton) || postalCodes.includes(lead.zip);
        }
        
        // BOTH conditions must be true
        const shouldShow = categoryMatches && serviceAreaMatches;
        
        // Debug logging for sanitaer leads
        if (import.meta.env.DEV && (lead.category === 'sanitaer' || lead.category?.includes('sanitaer'))) {
          console.log('🔍 Sanitär Lead Filter:', {
            leadId: lead.id,
            leadCategory: lead.category,
            leadZip: lead.zip,
            leadCanton: lead.canton,
            handwerkerCategories: categories,
            handwerkerServiceAreas: serviceAreas,
            categoryMatches,
            serviceAreaMatches,
            shouldShow
          });
        }
        
        return shouldShow;
      });
      
      setLeads(filteredLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  };
  const fetchProposals = async (userId: string) => {
    setProposalsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_proposals')
        .select(`
          *,
          leads (title, city, canton, owner_id)
        `)
        .eq('handwerker_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      // Batch fetch client contacts for accepted proposals (fix N+1 query)
      const acceptedProposals = (data || []).filter(p => p.status === 'accepted' && p.leads?.owner_id);
      const ownerIds = [...new Set(acceptedProposals.map(p => p.leads.owner_id))];
      
      let ownerProfilesMap = new Map();
      if (ownerIds.length > 0) {
        const { data: ownerProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', ownerIds);
        
        ownerProfilesMap = new Map(ownerProfiles?.map(p => [p.id, p]) || []);
      }
      
      // Map contacts to proposals
      const proposalsWithContacts = (data || []).map(proposal => {
        if (proposal.status === 'accepted' && proposal.leads?.owner_id) {
          return {
            ...proposal,
            client_contact: ownerProfilesMap.get(proposal.leads.owner_id) || null
          };
        }
        return proposal;
      });
      
      setProposals(proposalsWithContacts);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setProposalsLoading(false);
    }
  };

  const fetchReviews = async (userId: string) => {
    setReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          leads (title),
          profiles:reviewer_id (first_name, full_name)
        `)
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewUpdated = () => {
    if (user?.id) {
      fetchReviews(user.id);
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedLead || !user?.id) return;

    // Use validation hook
    if (!validateAll()) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte korrigieren Sie die markierten Felder.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingProposal(true);
    try {
      // Check quota first
      const {
        data: canSubmit,
        error: checkError
      } = await supabase.rpc('can_submit_proposal', {
        handwerker_user_id: user.id
      });
      if (checkError) throw checkError;
      if (!canSubmit) {
        toast({
          title: 'Kontingent erschöpft',
          description: 'Sie haben Ihr monatliches Offerten-Limit erreicht. Bitte upgraden Sie Ihr Abo.',
          variant: 'destructive'
        });
        setSubmittingProposal(false);
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
          setSubmittingProposal(false);
          return;
        }
        attachmentUrl = uploadResult.url;
        setUploadingAttachment(false);
      }

      // Proceed with proposal insertion
      const {
        error
      } = await supabase.from('lead_proposals').insert({
        lead_id: selectedLead.id,
        handwerker_id: user.id,
        price_min: parseInt(proposalForm.price_min),
        price_max: parseInt(proposalForm.price_max),
        message: proposalForm.message,
        estimated_duration_days: proposalForm.estimated_duration_days ? parseInt(proposalForm.estimated_duration_days) : null,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        status: 'pending'
      });
      if (error) throw error;
      toast({
        title: "Angebot gesendet",
        description: "Ihr Angebot wurde erfolgreich übermittelt."
      });

      // Reset form and close dialog
      setProposalForm({
        price_min: "",
        price_max: "",
        message: "",
        estimated_duration_days: ""
      });
      setAttachmentFile(null);
      resetValidation();
      setSelectedLead(null);

      // Refresh proposals
      await fetchProposals(user.id);
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      toast({
        title: "Fehler",
        description: error.message || "Angebot konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setSubmittingProposal(false);
    }
  };
  const handleUpdateProfile = async () => {
    if (!handwerkerProfile?.id) return;
    setProfileEditing(true);
    try {
      const {
        error
      } = await supabase.from('handwerker_profiles').update({
        bio: profileData.bio,
        hourly_rate_min: profileData.hourly_rate_min ? parseInt(profileData.hourly_rate_min) : null,
        hourly_rate_max: profileData.hourly_rate_max ? parseInt(profileData.hourly_rate_max) : null,
        phone_number: profileData.phone_number,
        logo_url: profileData.logo_url,
        updated_at: new Date().toISOString()
      }).eq('id', handwerkerProfile.id);
      if (error) throw error;
      toast({
        title: "Profil aktualisiert",
        description: "Ihre Änderungen wurden gespeichert."
      });

      // Refresh profile via checkAuth
      await checkAuth();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    } finally {
      setProfileEditing(false);
    }
  };
  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    try {
      // Validate file size (max 5MB for logos)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Datei zu groß",
          description: "Das Logo darf maximal 5MB groß sein.",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte laden Sie eine Bilddatei hoch (JPG, PNG, SVG, WebP).",
          variant: "destructive"
        });
        return;
      }
      setLogoUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logos/${user.id}/logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (profileData.logo_url) {
        const oldPath = profileData.logo_url.split('/handwerker-documents/')[1];
        if (oldPath) {
          await supabase.storage.from('handwerker-documents').remove([oldPath]);
        }
      }

      // Upload new logo
      const {
        error: uploadError
      } = await supabase.storage.from('handwerker-documents').upload(fileName, file);
      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data
      } = supabase.storage.from('handwerker-documents').getPublicUrl(fileName);
      if (data?.publicUrl) {
        setProfileData(prev => ({
          ...prev,
          logo_url: data.publicUrl
        }));
        toast({
          title: "Logo hochgeladen",
          description: "Speichern Sie Ihr Profil, um die Änderungen zu übernehmen."
        });
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Logo konnte nicht hochgeladen werden.",
        variant: "destructive"
      });
    } finally {
      setLogoUploading(false);
    }
  };
  const getUrgencyBadge = (urgency: string) => {
    const label = getUrgencyLabel(urgency);
    const colorClasses = getUrgencyColor(urgency);
    return <Badge className={colorClasses}>{label}</Badge>;
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>;
  }
  if (!handwerkerProfile) {
    return <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-24">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Kein Handwerkerprofil gefunden.
              </p>
              <Button onClick={() => navigate('/handwerker-onboarding')}>
                Profil erstellen
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>;
  }

  // Check verification status - show pending state
  if (handwerkerProfile.verification_status !== 'approved') {
    return <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <Alert className="max-w-2xl mx-auto mb-6 border-brand-200 bg-brand-50">
            <Clock className="h-5 w-5 text-brand-600" />
            <AlertTitle className="text-brand-900">Profil in Prüfung</AlertTitle>
            <AlertDescription className="text-brand-700">
              Ihr Profil wird derzeit geprüft. Sie können bereits Ihr Profil vervollständigen, aber Aufträge durchsuchen ist erst nach Freigabe möglich.
            </AlertDescription>
          </Alert>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Willkommen bei Büeze.ch!
              </CardTitle>
              <CardDescription>
                Vervollständigen Sie Ihr Profil während der Prüfung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Ihr Handwerker-Konto wurde erstellt! Während wir Ihr Profil prüfen, können Sie bereits:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Ihr Profil vervollständigen (Bio, Preise, Servicegebiete)</li>
                  <li>Portfolio-Bilder hochladen</li>
                  <li>Ihre Kontakt- und Bankdaten aktualisieren</li>
                </ul>
                <p className="text-muted-foreground font-medium">
                  Nach der Freigabe durch unser Team können Sie dann Aufträge durchsuchen und Offerten abgeben.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => navigate('/handwerker-profile/edit')} className="flex-1">
                  <User className="h-4 w-4 mr-2" />
                  Profil vervollständigen
                </Button>
                <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                  Zur Startseite
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>;
  }
  const filteredLeads = leads.filter(lead => lead.title.toLowerCase().includes(searchTerm.toLowerCase()) || lead.description.toLowerCase().includes(searchTerm.toLowerCase()) || lead.city.toLowerCase().includes(searchTerm.toLowerCase()));
  return <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                {isAdmin && (
                  <Badge variant="outline" className="mb-2 bg-green-50 text-green-700 border-green-200">
                    <Briefcase className="h-3 w-3 mr-1" />
                    Handwerker-Ansicht
                  </Badge>
                )}
                <h1 className="text-3xl font-bold text-foreground">
                  Willkommen, {handwerkerProfile.first_name || 'Handwerker'}!
                </h1>
                {user && <div className="flex items-center gap-3 mt-2">
                    <HandwerkerStatusIndicator userId={user.id} verificationStatus={handwerkerProfile.verification_status} />
                  </div>}
              </div>
              <div className="flex gap-3 items-center">
                <Button onClick={() => navigate('/conversations')} variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Nachrichten
                </Button>
                {user && <ProposalLimitBadge userId={user.id} />}
              </div>
            </div>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Leads, Angebote und Profil
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="leads">
                <Search className="h-4 w-4 mr-2" />
                Aufträge
              </TabsTrigger>
              <TabsTrigger value="proposals">
                <FileText className="h-4 w-4 mr-2" />
                Angebote ({proposals.length})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-2" />
                Bewertungen ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profil
              </TabsTrigger>
            </TabsList>

            {/* Browse Leads Tab */}
            <TabsContent value="leads" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Verfügbare Aufträge</CardTitle>
                  <CardDescription>
                    Durchsuchen Sie Aufträge, die zu Ihnen passen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Aufträge durchsuchen..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                  </div>

                  {leadsLoading ? <div className="space-y-4">
                      {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
                    </div> : filteredLeads.length === 0 ? <InlineEmptyState
                      title="Keine passenden Aufträge"
                      description="Erweitern Sie Ihre Kategorien oder Einsatzgebiete im Profil, um mehr Aufträge zu sehen."
                      action={{
                        label: "Profil bearbeiten",
                        onClick: () => navigate('/handwerker-profile-edit')
                      }}
                    /> : <div className="space-y-4">
                      {filteredLeads.map(lead => <Card key={lead.id} className="hover:border-brand-600 transition-colors">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{lead.title}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {lead.city}, {getCantonLabel(lead.canton)} ({lead.zip})
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                {getUrgencyBadge(lead.urgency)}
                                <Badge variant="outline">{getCategoryLabel(lead.category)}</Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {lead.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                {lead.budget_min && lead.budget_max && (
                                  <span>{lead.budget_min} - {lead.budget_max} CHF</span>
                                )}
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <FileText className="h-4 w-4" />
                                  <span>{lead.proposals_count} Angebote</span>
                                </div>
                              </div>
                              <Dialog open={selectedLead?.id === lead.id} onOpenChange={open => !open && setSelectedLead(null)}>
                                <DialogTrigger asChild>
                                  <Button onClick={() => setSelectedLead(lead)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Angebot senden
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Angebot für: {lead.title}</DialogTitle>
                                    <DialogDescription>
                                      Erstellen Sie Ihr Angebot für diesen Auftrag
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="price_min">Preis von (CHF) *</Label>
                                        <Input 
                                          id="price_min" 
                                          type="number" 
                                          min="0" 
                                          placeholder="z.B. 5000" 
                                          className={touched.price_min && errors.price_min ? 'border-destructive' : ''}
                                          value={proposalForm.price_min} 
                                          onChange={e => setProposalForm({
                                            ...proposalForm,
                                            price_min: e.target.value
                                          })}
                                          onBlur={() => handleBlur('price_min')}
                                        />
                                        {touched.price_min && errors.price_min && (
                                          <p className="text-xs text-destructive">{errors.price_min}</p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="price_max">Preis bis (CHF) *</Label>
                                        <Input 
                                          id="price_max" 
                                          type="number" 
                                          min="0" 
                                          placeholder="z.B. 7000" 
                                          className={touched.price_max && errors.price_max ? 'border-destructive' : ''}
                                          value={proposalForm.price_max} 
                                          onChange={e => setProposalForm({
                                            ...proposalForm,
                                            price_max: e.target.value
                                          })}
                                          onBlur={() => handleBlur('price_max')}
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
                                        placeholder="z.B. 5" 
                                        className={touched.estimated_duration_days && errors.estimated_duration_days ? 'border-destructive' : ''}
                                        value={proposalForm.estimated_duration_days} 
                                        onChange={e => setProposalForm({
                                          ...proposalForm,
                                          estimated_duration_days: e.target.value
                                        })}
                                        onBlur={() => handleBlur('estimated_duration_days')}
                                      />
                                      {touched.estimated_duration_days && errors.estimated_duration_days && (
                                        <p className="text-xs text-destructive">{errors.estimated_duration_days}</p>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="message">Ihre Nachricht * (min. 50 Zeichen)</Label>
                                      <Textarea 
                                        id="message" 
                                        placeholder="Beschreiben Sie, wie Sie den Auftrag ausführen würden..." 
                                        rows={6} 
                                        maxLength={2000} 
                                        className={touched.message && errors.message ? 'border-destructive' : ''}
                                        value={proposalForm.message} 
                                        onChange={e => setProposalForm({
                                          ...proposalForm,
                                          message: e.target.value
                                        })}
                                        onBlur={() => handleBlur('message')}
                                      />
                                      <p className={`text-xs ${proposalForm.message.length < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        {proposalForm.message.length}/50 Zeichen (min. 50)
                                      </p>
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
                                        disabled={submittingProposal}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => {
                                        setSelectedLead(null);
                                        setAttachmentFile(null);
                                        resetValidation();
                                      }}>
                                        Abbrechen
                                      </Button>
                                      <Button onClick={handleSubmitProposal} disabled={submittingProposal || uploadingAttachment}>
                                        {submittingProposal || uploadingAttachment ? <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {uploadingAttachment ? 'Wird hochgeladen...' : 'Wird gesendet...'}
                                          </> : <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Angebot senden
                                          </>}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Proposals Tab */}
            <TabsContent value="proposals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Meine Angebote</CardTitle>
                  <CardDescription>
                    Übersicht über alle Ihre eingereichten Angebote
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proposalsLoading ? <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                    </div> : proposals.length === 0 ? <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Sie haben noch keine Angebote eingereicht. Durchsuchen Sie verfügbare Aufträge, um Angebote zu senden.
                      </AlertDescription>
                    </Alert> : <div className="space-y-4">
                      {proposals.map(proposal => <Card key={proposal.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  {proposal.leads.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {proposal.leads.city}, {getCantonLabel(proposal.leads.canton)}
                                  </span>
                                </div>
                              </div>
                              <ProposalStatusBadge status={proposal.status} />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium">{proposal.price_min} - {proposal.price_max} CHF</span>
                                {proposal.estimated_duration_days && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{proposal.estimated_duration_days} Tage</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {proposal.message}
                              </p>
                              
                              {/* Attachments */}
                              {proposal.attachments && proposal.attachments.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <span>Anhang:</span>
                                  {proposal.attachments.map((url, idx) => {
                                    const fileName = url.split('/').pop() || `Dokument ${idx + 1}`;
                                    const displayName = fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName;
                                    return (
                                      <a 
                                        key={idx}
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline"
                                      >
                                        <Download className="h-3 w-3" />
                                        {displayName}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* View tracking + submission date */}
                              <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
                                <span>
                                  Gesendet: {new Date(proposal.submitted_at).toLocaleDateString('de-CH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                                {proposal.client_viewed_at ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <Eye className="h-3 w-3" />
                                    Gesehen am {new Date(proposal.client_viewed_at).toLocaleDateString('de-CH')}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Noch nicht angesehen
                                  </span>
                                )}
                              </div>
                              
                              {/* Show client contact details for accepted proposals */}
                              {proposal.status === 'accepted' && proposal.client_contact && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Kontaktdaten des Kunden
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-green-700" />
                                      <span className="text-green-900">{proposal.client_contact.full_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-green-700" />
                                      <a href={`mailto:${proposal.client_contact.email}`} className="text-green-900 hover:underline">
                                        {proposal.client_contact.email}
                                      </a>
                                    </div>
                                    {proposal.client_contact.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-green-700" />
                                        <a href={`tel:${proposal.client_contact.phone}`} className="text-green-900 hover:underline">
                                          {proposal.client_contact.phone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                </div>
              ) : (
                <HandwerkerReviewResponse 
                  reviews={reviews} 
                  onReviewUpdated={handleReviewUpdated} 
                />
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profil bearbeiten</CardTitle>
                      <CardDescription>
                        Aktualisieren Sie Ihre Profilinformationen
                      </CardDescription>
                    </div>
                    <Button onClick={() => navigate('/handwerker-profile/edit')} variant="default">
                      Erweiterte Profileinstellungen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-900">
                      💡 <strong>Tipp:</strong> Bearbeiten Sie Ihre Bio, Stundensätze, Servicegebiete und Portfolio-Bilder in den erweiterten Profileinstellungen.
                    </AlertDescription>
                  </Alert>

                  {/* Logo Upload Section */}
                  <div className="space-y-3">
                    <Label htmlFor="logo-upload">Firmenlogo</Label>
                    <div className="flex items-center gap-4">
                      {profileData.logo_url && <div className="h-24 w-24 rounded-lg border-2 bg-background flex items-center justify-center overflow-hidden">
                          <img src={profileData.logo_url} alt="Firmenlogo" className="h-full w-full object-contain" />
                        </div>}
                      <div className="flex-1">
                        <Input id="logo-upload" type="file" accept=".jpg,.jpeg,.png,.svg,.webp" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()} disabled={logoUploading}>
                          {logoUploading ? <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Wird hochgeladen...
                            </> : <>
                              {profileData.logo_url ? 'Logo ändern' : 'Logo hochladen'}
                            </>}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          JPG, PNG, SVG oder WebP (max. 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info - Read Only */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vorname</Label>
                      <Input value={handwerkerProfile.first_name || ""} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Nachname</Label>
                      <Input value={handwerkerProfile.last_name || ""} disabled />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <Input value={handwerkerProfile.email || ""} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>Firma</Label>
                    <Input value={handwerkerProfile.company_name || ""} disabled />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Grundlegende Informationen können nicht hier geändert werden. 
                      Kontaktieren Sie uns bei Änderungswünschen.
                    </AlertDescription>
                  </Alert>

                  {/* Editable Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Telefonnummer</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input id="phone_number" type="tel" placeholder="+41 79 123 45 67" value={profileData.phone_number} onChange={e => setProfileData({
                      ...profileData,
                      phone_number: e.target.value
                    })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Über mich / Firma</Label>
                    <Textarea id="bio" placeholder="Beschreiben Sie Ihre Erfahrung und Spezialisierung..." rows={6} value={profileData.bio} onChange={e => setProfileData({
                    ...profileData,
                    bio: e.target.value
                  })} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate_min">Stundensatz von (CHF)</Label>
                      <Input id="hourly_rate_min" type="number" placeholder="z.B. 80" value={profileData.hourly_rate_min} onChange={e => setProfileData({
                      ...profileData,
                      hourly_rate_min: e.target.value
                    })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate_max">Stundensatz bis (CHF)</Label>
                      <Input id="hourly_rate_max" type="number" placeholder="z.B. 120" value={profileData.hourly_rate_max} onChange={e => setProfileData({
                      ...profileData,
                      hourly_rate_max: e.target.value
                    })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Kategorien</Label>
                    <div className="flex flex-wrap gap-2">
                      {handwerkerProfile.categories.map(cat => (
                        <Badge key={cat} variant="secondary">{getCategoryLabel(cat)}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Einsatzgebiete</Label>
                    <div className="flex flex-wrap gap-2">
                      {handwerkerProfile.service_areas.map(area => (
                        <Badge key={area} variant="outline">
                          {area.length === 2 ? getCantonLabel(area) : area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleUpdateProfile} disabled={profileEditing}>
                      {profileEditing ? <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Wird gespeichert...
                        </> : "Profil aktualisieren"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>;
};
export default HandwerkerDashboard;