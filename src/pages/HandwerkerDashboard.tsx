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
import { Search, MapPin, Clock, Send, Eye, EyeOff, FileText, User, Building2, Mail, Phone, AlertCircle, CheckCircle, XCircle, Loader2, Users, Star, Briefcase, Paperclip, Download, Pencil, X, Filter, Globe, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { withdrawProposal } from "@/lib/proposalQueries";
import { ProposalLimitBadge } from "@/components/ProposalLimitBadge";
import { ProposalStatusBadge } from "@/components/ProposalStatusBadge";
import { HandwerkerStatusIndicator } from "@/components/HandwerkerStatusIndicator";
import { HandwerkerReviewResponse } from "@/components/HandwerkerReviewResponse";
import { ProposalFileUpload } from "@/components/ProposalFileUpload";
import { uploadProposalAttachment } from "@/lib/fileUpload";
import { majorCategories } from "@/config/majorCategories";
import { getCategoryLabel } from "@/config/categoryLabels";
import { getCantonLabel, SWISS_CANTONS } from "@/config/cantons";
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
  const [allLeads, setAllLeads] = useState<LeadListItem[]>([]); // All available leads for stats
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadListItem | null>(null);
  
  // Enhanced filtering
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [selectedCanton, setSelectedCanton] = useState<string>('all');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<string>('all');

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
  
  // Edit/Withdraw Proposal State
  const [editingProposal, setEditingProposal] = useState<ProposalWithClientInfo | null>(null);
  const [editForm, setEditForm] = useState({
    price_min: "",
    price_max: "",
    message: "",
    estimated_duration_days: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Form validation hook
  const { errors, touched, handleBlur, validateAll, resetValidation } = useProposalFormValidation(proposalForm);
  
  // Calculate pending proposals count
  const pendingProposalsCount = proposals.filter(p => p.status === 'pending').length;
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
          fetchLeads(currentUser.id, profile.categories, profile.service_areas), 
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
  // Helper function to check if lead matches handwerker's categories
  const checkCategoryMatch = (lead: LeadListItem, categories: string[]) => {
    if (categories.length === 0) return true;
    if (categories.includes(lead.category)) return true;
    
    // Check if lead's category is a major category and handwerker has a subcategory from it
    const leadMajorCat = Object.values(majorCategories).find(mc => mc.id === lead.category);
    if (leadMajorCat && categories.some(hwCat => leadMajorCat.subcategories.includes(hwCat))) {
      return true;
    }
    
    // Check if handwerker's category is a major category and lead has a subcategory from it
    const handwerkerMajorCats = categories
      .map(cat => Object.values(majorCategories).find(mc => mc.id === cat))
      .filter(Boolean);
    return handwerkerMajorCats.some(mc => mc?.subcategories.includes(lead.category));
  };

  // Helper function to check if lead matches handwerker's service areas
  const checkServiceAreaMatch = (lead: LeadListItem, serviceAreas: string[]) => {
    if (serviceAreas.length === 0) return true;
    const cantons = serviceAreas.filter(area => area.length === 2);
    const postalCodes = serviceAreas.filter(area => area.length >= 4);
    return cantons.includes(lead.canton) || postalCodes.includes(lead.zip);
  };

  // Removed duplicate fetchHandwerkerProfile - use checkAuth instead
  const fetchLeads = async (
    userId: string, 
    categories: string[], 
    serviceAreas: string[],
    browseAllCategories: boolean = false,
    browseAllRegions: boolean = false
  ) => {
    setLeadsLoading(true);
    try {
      // Fetch active leads and existing proposals in parallel
      const [leadsResult, proposalsResult] = await Promise.all([
        supabase.from('leads').select('*').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('lead_proposals').select('lead_id').eq('handwerker_id', userId)
      ]);

      if (leadsResult.error) throw leadsResult.error;
      
      // Create set of lead IDs where handwerker already has proposals
      const proposedLeadIds = new Set(proposalsResult.data?.map(p => p.lead_id) || []);

      // Filter out already-proposed leads
      const availableLeads = (leadsResult.data || []).filter(lead => !proposedLeadIds.has(lead.id));
      
      // Store all available leads for stats
      setAllLeads(availableLeads);
      
      // Apply filters based on browse settings
      const filteredLeads = availableLeads.filter(lead => {
        const categoryMatches = browseAllCategories || checkCategoryMatch(lead, categories);
        const serviceAreaMatches = browseAllRegions || checkServiceAreaMatch(lead, serviceAreas);
        return categoryMatches && serviceAreaMatches;
      });
      
      setLeads(filteredLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  };
  
  // Re-fetch leads when filter settings change
  useEffect(() => {
    if (user?.id && handwerkerProfile?.verification_status === 'approved') {
      fetchLeads(
        user.id, 
        handwerkerProfile.categories || [], 
        handwerkerProfile.service_areas || [],
        showAllCategories,
        showAllRegions
      );
    }
  }, [showAllCategories, showAllRegions]);
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
      // Defense-in-depth: Check for existing proposal before inserting
      const { data: existingProposal } = await supabase
        .from('lead_proposals')
        .select('id')
        .eq('lead_id', selectedLead.id)
        .eq('handwerker_id', user.id)
        .maybeSingle();

      if (existingProposal) {
        toast({
          title: "Bereits gesendet",
          description: "Sie haben bereits ein Angebot für diesen Auftrag gesendet.",
          variant: "destructive"
        });
        setSelectedLead(null);
        // Refresh leads to remove this one from list
        await fetchLeads(user.id, handwerkerProfile?.categories || [], handwerkerProfile?.service_areas || []);
        setSubmittingProposal(false);
        return;
      }

      // Check quota
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

      // Refresh both proposals and leads lists
      await Promise.all([
        fetchProposals(user.id),
        fetchLeads(user.id, handwerkerProfile?.categories || [], handwerkerProfile?.service_areas || [])
      ]);
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

  // Handle withdraw proposal
  const handleWithdrawProposal = async (proposalId: string) => {
    try {
      await withdrawProposal(proposalId);
      toast({
        title: "Angebot zurückgezogen",
        description: "Ihr Angebot wurde erfolgreich zurückgezogen."
      });
      // Refresh proposals and leads (lead becomes available again)
      await Promise.all([
        fetchProposals(user!.id),
        fetchLeads(user!.id, handwerkerProfile?.categories || [], handwerkerProfile?.service_areas || [])
      ]);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Angebot konnte nicht zurückgezogen werden.",
        variant: "destructive"
      });
    }
  };

  // Handle edit proposal
  const handleOpenEditDialog = (proposal: ProposalWithClientInfo) => {
    setEditForm({
      price_min: proposal.price_min.toString(),
      price_max: proposal.price_max.toString(),
      message: proposal.message,
      estimated_duration_days: proposal.estimated_duration_days?.toString() || ""
    });
    setEditingProposal(proposal);
  };

  const handleSaveEditProposal = async () => {
    if (!editingProposal) return;
    
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('lead_proposals')
        .update({
          price_min: parseInt(editForm.price_min),
          price_max: parseInt(editForm.price_max),
          message: editForm.message,
          estimated_duration_days: editForm.estimated_duration_days ? parseInt(editForm.estimated_duration_days) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProposal.id);
      
      if (error) throw error;
      
      toast({
        title: "Angebot aktualisiert",
        description: "Ihre Änderungen wurden gespeichert."
      });
      await fetchProposals(user!.id);
      setEditingProposal(null);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Änderungen konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setSavingEdit(false);
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
  // Calculate stats for the filter banner
  const matchedLeadsCount = allLeads.filter(lead => 
    checkCategoryMatch(lead, handwerkerProfile?.categories || []) && 
    checkServiceAreaMatch(lead, handwerkerProfile?.service_areas || [])
  ).length;
  const additionalLeadsCount = allLeads.length - matchedLeadsCount;
  const isFiltersActive = showAllCategories || showAllRegions || selectedCanton !== 'all';
  
  // Check if a lead is outside the handwerker's profile settings
  const isLeadOutsideProfile = (lead: LeadListItem) => {
    const categoryMatches = checkCategoryMatch(lead, handwerkerProfile?.categories || []);
    const serviceAreaMatches = checkServiceAreaMatch(lead, handwerkerProfile?.service_areas || []);
    return !categoryMatches || !serviceAreaMatches;
  };
  
  const resetFilters = () => {
    setShowAllCategories(false);
    setShowAllRegions(false);
    setSelectedCanton('all');
  };
  
  // Apply canton filter and search term
  const filteredLeads = leads.filter(lead => {
    // Canton filter (when browsing all regions and specific canton selected)
    if (showAllRegions && selectedCanton !== 'all' && lead.canton !== selectedCanton) {
      return false;
    }
    // Search term filter
    return lead.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           lead.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
           lead.city.toLowerCase().includes(searchTerm.toLowerCase());
  });
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
              <TabsTrigger value="proposals" className="relative">
                <FileText className="h-4 w-4 mr-2" />
                Angebote
                {pendingProposalsCount > 0 && (
                  <Badge className="ml-2 bg-orange-500 hover:bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5">
                    {pendingProposalsCount}
                  </Badge>
                )}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Verfügbare Aufträge</CardTitle>
                      <CardDescription>
                        {isFiltersActive 
                          ? "Alle verfügbaren Aufträge in der Schweiz" 
                          : "Aufträge passend zu Ihrem Profil"}
                      </CardDescription>
                    </div>
                    {/* Stats Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {matchedLeadsCount} passend
                      </Badge>
                      {additionalLeadsCount > 0 && !isFiltersActive && (
                        <button 
                          onClick={() => { setShowAllCategories(true); setShowAllRegions(true); }}
                          className="text-sm text-brand-600 hover:underline"
                        >
                          +{additionalLeadsCount} weitere
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Enhanced Filter Bar */}
                  <div className="flex flex-wrap gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                    {/* Category Filter */}
                    <Select 
                      value={showAllCategories ? 'all' : 'my'} 
                      onValueChange={(val) => setShowAllCategories(val === 'all')}
                    >
                      <SelectTrigger className="w-[180px] bg-background">
                        <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="my">Meine Kategorien</SelectItem>
                        <SelectItem value="all">Alle Kategorien</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Region Filter */}
                    <Select 
                      value={showAllRegions ? 'all' : 'my'} 
                      onValueChange={(val) => {
                        setShowAllRegions(val === 'all');
                        if (val !== 'all') setSelectedCanton('all');
                      }}
                    >
                      <SelectTrigger className="w-[180px] bg-background">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="my">Meine Gebiete</SelectItem>
                        <SelectItem value="all">Ganze Schweiz</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Specific Canton Filter - only when browsing all regions */}
                    {showAllRegions && (
                      <Select 
                        value={selectedCanton} 
                        onValueChange={setSelectedCanton}
                      >
                        <SelectTrigger className="w-[160px] bg-background">
                          <SelectValue placeholder="Alle Kantone" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="all">Alle Kantone</SelectItem>
                          {SWISS_CANTONS.map(canton => (
                            <SelectItem key={canton.value} value={canton.value}>
                              {canton.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Suchen..." 
                        className="pl-9 bg-background" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                      />
                    </div>

                    {/* Reset Button */}
                    {isFiltersActive && (
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Zurücksetzen
                      </Button>
                    )}
                  </div>

                  {/* Active Filters Info */}
                  {isFiltersActive && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground bg-brand-50 dark:bg-brand-950/30 p-2 px-3 rounded-md">
                      <Globe className="h-4 w-4 text-brand-600" />
                      <span>
                        Sie sehen {
                          selectedCanton !== 'all' 
                            ? `Aufträge in ${getCantonLabel(selectedCanton)}`
                            : showAllCategories && showAllRegions 
                              ? "alle Aufträge" 
                              : showAllCategories 
                                ? "alle Kategorien" 
                                : "die ganze Schweiz"
                        }.
                        {(showAllCategories || showAllRegions) && " Aufträge ausserhalb Ihres Profils sind markiert."}
                      </span>
                    </div>
                  )}

                  {leadsLoading ? <div className="space-y-4">
                      {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
                    </div> : filteredLeads.length === 0 ? <InlineEmptyState
                      title={isFiltersActive ? "Keine Aufträge gefunden" : "Keine passenden Aufträge in Ihrem Gebiet"}
                      description={isFiltersActive 
                        ? "Es gibt derzeit keine aktiven Aufträge." 
                        : `Es gibt ${additionalLeadsCount} Aufträge in anderen Kategorien oder Regionen.`}
                      action={!isFiltersActive && additionalLeadsCount > 0 ? {
                        label: "Alle Aufträge anzeigen",
                        onClick: () => { setShowAllCategories(true); setShowAllRegions(true); }
                      } : undefined}
                    /> : <div className="space-y-4">
                      {filteredLeads.map(lead => {
                        const outsideProfile = isFiltersActive && isLeadOutsideProfile(lead);
                        return (
                          <Card 
                            key={lead.id} 
                            className={`hover:border-brand-600 transition-colors relative ${
                              outsideProfile ? 'border-dashed border-muted-foreground/40 bg-muted/20' : ''
                            }`}
                          >
                            {outsideProfile && (
                              <Badge 
                                variant="outline" 
                                className="absolute top-3 right-3 text-xs bg-background text-muted-foreground"
                              >
                                <Globe className="h-3 w-3 mr-1" />
                                Ausserhalb Ihres Profils
                              </Badge>
                            )}
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
                              <div className={`flex flex-col gap-2 items-end ${outsideProfile ? 'mt-6' : ''}`}>
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
                        </Card>
                        );
                      })}
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Proposals Tab */}
            <TabsContent value="proposals" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Meine Angebote</CardTitle>
                      <CardDescription>
                        Übersicht über alle Ihre eingereichten Angebote
                      </CardDescription>
                    </div>
                    {/* Proposal Stats */}
                    {proposals.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {proposals.filter(p => p.status === 'pending').length} ausstehend
                        </Badge>
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {proposals.filter(p => p.status === 'accepted').length} angenommen
                        </Badge>
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          {proposals.filter(p => p.status === 'rejected').length} abgelehnt
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status Filter */}
                  {proposals.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      <Select value={proposalStatusFilter} onValueChange={setProposalStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Alle Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Angebote</SelectItem>
                          <SelectItem value="pending">Ausstehend</SelectItem>
                          <SelectItem value="accepted">Angenommen</SelectItem>
                          <SelectItem value="rejected">Abgelehnt</SelectItem>
                          <SelectItem value="withdrawn">Zurückgezogen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {proposalsLoading ? <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                    </div> : proposals.length === 0 ? <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Sie haben noch keine Angebote eingereicht. Durchsuchen Sie verfügbare Aufträge, um Angebote zu senden.
                      </AlertDescription>
                    </Alert> : (() => {
                      const filteredProposals = proposalStatusFilter === 'all' 
                        ? proposals 
                        : proposals.filter(p => p.status === proposalStatusFilter);
                      
                      // Sort: accepted first, then pending, then rejected/withdrawn
                      const sortedProposals = [...filteredProposals].sort((a, b) => {
                        const order = { accepted: 0, pending: 1, rejected: 2, withdrawn: 3 };
                        return (order[a.status as keyof typeof order] || 4) - (order[b.status as keyof typeof order] || 4);
                      });
                      
                      if (sortedProposals.length === 0) {
                        return (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Keine Angebote mit diesem Status gefunden.
                            </AlertDescription>
                          </Alert>
                        );
                      }
                      
                      return <div className="space-y-4">
                      {sortedProposals.map(proposal => <Card key={proposal.id} className={
                        proposal.status === 'accepted' ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' :
                        proposal.status === 'rejected' ? 'border-muted bg-muted/30' :
                        ''
                      }>
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
                              
                              {/* Action buttons for pending proposals */}
                              {proposal.status === 'pending' && (
                                <div className="flex gap-2 pt-3 border-t">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenEditDialog(proposal)}
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Bearbeiten
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                        <X className="h-4 w-4 mr-1" />
                                        Zurückziehen
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Angebot zurückziehen?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Möchten Sie dieses Angebot wirklich zurückziehen? 
                                          Der Auftrag wird wieder in Ihrer Auftragsliste erscheinen.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleWithdrawProposal(proposal.id)}>
                                          Ja, zurückziehen
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                              
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
                    </div>;
                    })()}
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
      
      {/* Edit Proposal Dialog */}
      <Dialog open={!!editingProposal} onOpenChange={(open) => !open && setEditingProposal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Angebot bearbeiten</DialogTitle>
            <DialogDescription>
              {editingProposal?.leads.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price-min">Preis min. (CHF)</Label>
                <Input
                  id="edit-price-min"
                  type="number"
                  value={editForm.price_min}
                  onChange={(e) => setEditForm({ ...editForm, price_min: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price-max">Preis max. (CHF)</Label>
                <Input
                  id="edit-price-max"
                  type="number"
                  value={editForm.price_max}
                  onChange={(e) => setEditForm({ ...editForm, price_max: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Geschätzte Dauer (Tage, optional)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={editForm.estimated_duration_days}
                onChange={(e) => setEditForm({ ...editForm, estimated_duration_days: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-message">Nachricht</Label>
              <Textarea
                id="edit-message"
                value={editForm.message}
                onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                rows={4}
              />
              <p className={`text-xs ${editForm.message.length < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {editForm.message.length}/50 Zeichen (min. 50)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProposal(null)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSaveEditProposal} 
              disabled={savingEdit || editForm.message.length < 50 || !editForm.price_min || !editForm.price_max}
            >
              {savingEdit ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Änderungen speichern"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default HandwerkerDashboard;