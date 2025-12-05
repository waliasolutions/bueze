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
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Search, MapPin, Euro, Clock, Send, Eye, FileText, User, Building2, Mail, Phone, AlertCircle, CheckCircle, XCircle, Loader2, Users, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProposalLimitBadge } from "@/components/ProposalLimitBadge";
import { HandwerkerStatusIndicator } from "@/components/HandwerkerStatusIndicator";
import { HandwerkerReviewResponse } from "@/components/HandwerkerReviewResponse";
import { majorCategories } from "@/config/majorCategories";
import { EmptyState, InlineEmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/page-skeleton";
interface Lead {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  urgency: string;
  city: string;
  canton: string;
  zip: string;
  created_at: string;
  proposals_count: number;
}
interface Proposal {
  id: string;
  lead_id: string;
  price_min: number;
  price_max: number;
  message: string;
  estimated_duration_days: number | null;
  status: string;
  submitted_at: string;
  leads: {
    title: string;
    city: string;
    canton: string;
    owner_id?: string;
  };
  client_contact?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}
interface HandwerkerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  company_name: string | null;
  bio: string | null;
  categories: string[];
  service_areas: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  verification_status: string;
}
const HandwerkerDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [handwerkerProfile, setHandwerkerProfile] = useState<HandwerkerProfile | null>(null);

  // Browse Leads Tab
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Proposals Tab
  const [proposals, setProposals] = useState<Proposal[]>([]);
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
  const fetchHandwerkerProfile = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('handwerker_profiles').select('*').eq('user_id', userId).single();
      if (error) throw error;
      setHandwerkerProfile(data);
      setProfileData({
        bio: data.bio || "",
        hourly_rate_min: data.hourly_rate_min?.toString() || "",
        hourly_rate_max: data.hourly_rate_max?.toString() || "",
        phone_number: data.phone_number || "",
        logo_url: data.logo_url || ""
      });

      // Only fetch leads, proposals and reviews if approved
      if (data.verification_status === 'approved') {
        await Promise.all([
          fetchLeads(data.categories, data.service_areas), 
          fetchProposals(userId),
          fetchReviews(userId)
        ]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
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
      const {
        data,
        error
      } = await supabase.from('lead_proposals').select(`
          *,
          leads (
            title,
            city,
            canton,
            owner_id
          )
        `).eq('handwerker_id', userId).order('submitted_at', {
        ascending: false
      });
      if (error) throw error;
      
      // For accepted proposals, fetch client contact details
      const proposalsWithContacts = await Promise.all((data || []).map(async (proposal) => {
        if (proposal.status === 'accepted' && proposal.leads?.owner_id) {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', proposal.leads.owner_id)
            .single();
          
          return {
            ...proposal,
            client_contact: ownerProfile
          };
        }
        return proposal;
      }));
      
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

    // Validate form
    if (!proposalForm.price_min || !proposalForm.price_max || !proposalForm.message) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
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

      // Refresh profile
      await fetchHandwerkerProfile(user.id);
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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Angenommen</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Abgelehnt</Badge>;
      case 'withdrawn':
        return <Badge variant="outline">Zurückgezogen</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge variant="destructive">Dringend</Badge>;
      case 'soon':
        return <Badge variant="default" className="bg-orange-600">Bald</Badge>;
      case 'planning':
        return <Badge variant="secondary">In Planung</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
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
                                    {lead.city}, {lead.canton} ({lead.zip})
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                {getUrgencyBadge(lead.urgency)}
                                <Badge variant="outline">{lead.category}</Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {lead.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                {lead.budget_min && lead.budget_max && <div className="flex items-center gap-1">
                                    <Euro className="h-4 w-4 text-muted-foreground" />
                                    <span>{lead.budget_min} - {lead.budget_max} CHF</span>
                                  </div>}
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
                                        <Input id="price_min" type="number" placeholder="z.B. 5000" value={proposalForm.price_min} onChange={e => setProposalForm({
                                    ...proposalForm,
                                    price_min: e.target.value
                                  })} />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="price_max">Preis bis (CHF) *</Label>
                                        <Input id="price_max" type="number" placeholder="z.B. 7000" value={proposalForm.price_max} onChange={e => setProposalForm({
                                    ...proposalForm,
                                    price_max: e.target.value
                                  })} />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="duration">Geschätzte Dauer (Tage)</Label>
                                      <Input id="duration" type="number" placeholder="z.B. 5" value={proposalForm.estimated_duration_days} onChange={e => setProposalForm({
                                  ...proposalForm,
                                  estimated_duration_days: e.target.value
                                })} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="message">Ihre Nachricht *</Label>
                                      <Textarea id="message" placeholder="Beschreiben Sie, wie Sie den Auftrag ausführen würden..." rows={6} value={proposalForm.message} onChange={e => setProposalForm({
                                  ...proposalForm,
                                  message: e.target.value
                                })} />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => setSelectedLead(null)}>
                                        Abbrechen
                                      </Button>
                                      <Button onClick={handleSubmitProposal} disabled={submittingProposal}>
                                        {submittingProposal ? <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Wird gesendet...
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
                                    {proposal.leads.city}, {proposal.leads.canton}
                                  </span>
                                </div>
                              </div>
                              {getStatusBadge(proposal.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Euro className="h-4 w-4 text-muted-foreground" />
                                  <span>{proposal.price_min} - {proposal.price_max} CHF</span>
                                </div>
                                {proposal.estimated_duration_days && <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{proposal.estimated_duration_days} Tage</span>
                                  </div>}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {proposal.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Gesendet: {new Date(proposal.submitted_at).toLocaleDateString('de-CH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                              </p>
                              
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
                      {handwerkerProfile.categories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Einsatzgebiete</Label>
                    <div className="flex flex-wrap gap-2">
                      {handwerkerProfile.service_areas.map(area => <Badge key={area} variant="outline">{area}</Badge>)}
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