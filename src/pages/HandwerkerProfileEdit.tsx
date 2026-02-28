import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Save, ArrowLeft, CheckCircle, Circle, Clock, User, Building2, Wallet, Shield, Eye, Edit, FileText, Briefcase, MapPin, AlertTriangle } from 'lucide-react';
import { PostalCodeInput } from '@/components/PostalCodeInput';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SWISS_CANTONS } from '@/config/cantons';
import { ProfilePreview } from '@/components/ProfilePreview';
import { ProfileCompletenessCard } from '@/components/ProfileCompletenessCard';
import { HandwerkerStatusIndicator } from '@/components/HandwerkerStatusIndicator';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { CategorySelector } from '@/components/CategorySelector';
import { ResponsiveSections, Section } from '@/components/ResponsiveSections';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ServiceAreaSelector } from '@/components/ServiceAreaSelector';
import { ServiceRadius, buildServiceAreas, parseServiceAreas } from '@/lib/serviceAreaHelpers';
import { DocumentManagementSection } from '@/components/DocumentManagementSection';

interface HandwerkerProfile {
  id: string;
  bio: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  service_areas: string[];
  portfolio_urls: string[];
  website: string | null;
  phone_number: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  personal_address: string | null;
  personal_zip: string | null;
  personal_city: string | null;
  personal_canton: string | null;
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
  trade_license_number: string | null;
  insurance_valid_until: string | null;
  logo_url: string | null;
  verification_status: string | null;
  verification_documents: string[] | null;
  categories: string[];
}

const HandwerkerProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<HandwerkerProfile | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Profile & Bio
  const [bio, setBio] = useState('');
  const [hourlyRateMin, setHourlyRateMin] = useState('');
  const [hourlyRateMax, setHourlyRateMax] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);
  const [tempPostalCode, setTempPostalCode] = useState('');
  
  // Categories
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedMajorCategories, setSelectedMajorCategories] = useState<string[]>([]);
  
  // Service Areas - Simplified with radius approach (SSOT with HandwerkerOnboarding)
  const [serviceAreaPlz, setServiceAreaPlz] = useState('');
  const [serviceAreaCity, setServiceAreaCity] = useState('');
  const [serviceAreaCanton, setServiceAreaCanton] = useState('');
  const [serviceRadius, setServiceRadius] = useState<ServiceRadius>('canton');
  const [customCantons, setCustomCantons] = useState<string[]>([]);
  
  // Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [personalAddress, setPersonalAddress] = useState('');
  const [personalZip, setPersonalZip] = useState('');
  const [personalCity, setPersonalCity] = useState('');
  const [personalCanton, setPersonalCanton] = useState('');
  
  // Company Information
  const [companyName, setCompanyName] = useState('');
  const [companyLegalForm, setCompanyLegalForm] = useState('');
  const [uidNumber, setUidNumber] = useState('');
  const [mwstNumber, setMwstNumber] = useState('');
  
  // Business Address
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessZip, setBusinessZip] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessCanton, setBusinessCanton] = useState('');
  
  // Banking
  const [iban, setIban] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Insurance & Licenses
  const [liabilityInsuranceProvider, setLiabilityInsuranceProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('');
  const [insuranceValidUntil, setInsuranceValidUntil] = useState('');
  
  // Logo
  const [logoUrl, setLogoUrl] = useState('');
  
  // Document upload dialog
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAccessAndLoadProfile();
  }, []);

  const checkAccessAndLoadProfile = async () => {
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

      // Check if user is a handwerker (pending, approved, or rejected — rejected can resubmit)
      const { data: profileData, error } = await supabase
        .from('handwerker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .in('verification_status', ['pending', 'approved', 'rejected'])
        .maybeSingle();

      if (error) throw error;

      if (!profileData) {
        toast({
          title: 'Zugriff verweigert',
          description: 'Sie müssen ein Handwerker-Konto haben, um Ihr Profil zu bearbeiten.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setProfile(profileData);
      setUserId(user.id);
      // Profile & Bio
      setBio(profileData.bio || '');
      setHourlyRateMin(profileData.hourly_rate_min?.toString() || '');
      setHourlyRateMax(profileData.hourly_rate_max?.toString() || '');
      
      // Load service areas using shared helper
      const loadedAreas = profileData.service_areas || [];
      const config = parseServiceAreas(loadedAreas);
      
      setServiceRadius(config.radius);
      setCustomCantons(config.customCantons);
      if (config.businessCanton) {
        setServiceAreaCanton(config.businessCanton);
      }
      if (config.businessPlz) {
        setServiceAreaPlz(config.businessPlz);
      }
      // Also load from business_zip if available
      if (profileData.business_zip) {
        setServiceAreaPlz(profileData.business_zip);
      }
      if (profileData.business_city) {
        setServiceAreaCity(profileData.business_city);
      }
      if (profileData.business_canton) {
        setServiceAreaCanton(profileData.business_canton);
      }
      setServiceAreas(loadedAreas.join(', '));
      
      setWebsite(profileData.website || '');
      setPortfolioUrls(profileData.portfolio_urls || []);
      
      // Personal Information
      setFirstName(profileData.first_name || '');
      setLastName(profileData.last_name || '');
      setEmail(profileData.email || '');
      setPhoneNumber(profileData.phone_number || '');
      setPersonalAddress(profileData.personal_address || '');
      setPersonalZip(profileData.personal_zip || '');
      setPersonalCity(profileData.personal_city || '');
      setPersonalCanton(profileData.personal_canton || '');
      
      // Company Information
      setCompanyName(profileData.company_name || '');
      setCompanyLegalForm(profileData.company_legal_form || '');
      setUidNumber(profileData.uid_number || '');
      setMwstNumber(profileData.mwst_number || '');
      
      // Business Address
      setBusinessAddress(profileData.business_address || '');
      setBusinessZip(profileData.business_zip || '');
      setBusinessCity(profileData.business_city || '');
      setBusinessCanton(profileData.business_canton || '');
      
      // Banking
      setIban(profileData.iban || '');
      setBankName(profileData.bank_name || '');
      
      // Insurance & Licenses
      setLiabilityInsuranceProvider(profileData.liability_insurance_provider || '');
      setPolicyNumber(profileData.liability_insurance_policy_number || '');
      setTradeLicenseNumber(profileData.trade_license_number || '');
      setInsuranceValidUntil(profileData.insurance_valid_until || '');
      
      // Logo
      setLogoUrl(profileData.logo_url || '');
      setPortfolioUrls(profileData.portfolio_urls || []);
      setVerificationDocuments(profileData.verification_documents || []);
      
      // Load categories
      setCategories(profileData.categories || []);
      
      // Determine which major categories are selected based on categories array
      const majorCats = new Set<string>();
      (profileData.categories || []).forEach((cat: string) => {
        // Check if cat is itself a major category ID
        if (majorCategories[cat]) {
          majorCats.add(cat);
        }
        // Also check if it's a subcategory of any major category
        Object.values(majorCategories).forEach((majorCat) => {
          if (majorCat.subcategories.includes(cat)) {
            majorCats.add(majorCat.id);
          }
        });
      });
      setSelectedMajorCategories(Array.from(majorCats));
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Fehler',
        description: 'Profil konnte nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !profile) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileArray = Array.from(files);
      const validFiles: File[] = [];

      // Validate all files first
      for (const file of fileArray) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Ungültiger Dateityp',
            description: `${file.name} ist keine Bilddatei.`,
            variant: 'destructive',
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Datei zu groß',
            description: `${file.name} ist größer als 5MB.`,
            variant: 'destructive',
          });
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      // Upload all files in parallel
      const uploadPromises = validFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('handwerker-portfolio')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('handwerker-portfolio')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setPortfolioUrls([...portfolioUrls, ...uploadedUrls]);
      
      toast({
        title: 'Upload erfolgreich',
        description: `${uploadedUrls.length} Bild(er) hochgeladen.`,
      });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message || 'Bilder konnten nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/handwerker-portfolio/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1].split('?')[0];
        
        const { error } = await supabase.storage
          .from('handwerker-portfolio')
          .remove([filePath]);

        if (error) throw error;
      }

      setPortfolioUrls(portfolioUrls.filter(u => u !== url));
      
      toast({
        title: 'Bild entfernt',
        description: 'Das Bild wurde aus Ihrem Portfolio entfernt.',
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: 'Fehler',
        description: 'Bild konnte nicht entfernt werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !profile) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

      // Validate all files first
      for (const file of fileArray) {
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: 'Ungültiger Dateityp',
            description: `${file.name} ist kein gültiges Dokument (PDF, JPG oder PNG).`,
            variant: 'destructive',
          });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'Datei zu groß',
            description: `${file.name} ist größer als 10MB.`,
            variant: 'destructive',
          });
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      // Upload all files in parallel
      const uploadPromises = validFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/documents/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('handwerker-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('handwerker-documents')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setVerificationDocuments([...verificationDocuments, ...uploadedUrls]);
      
      toast({
        title: 'Upload erfolgreich',
        description: `${uploadedUrls.length} Dokument(e) hochgeladen.`,
      });
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message || 'Dokumente konnten nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveDocument = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/handwerker-documents/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1].split('?')[0];
        
        const { error } = await supabase.storage
          .from('handwerker-documents')
          .remove([filePath]);

        if (error) throw error;
      }

      setVerificationDocuments(verificationDocuments.filter(u => u !== url));
      
      toast({
        title: 'Dokument entfernt',
        description: 'Das Dokument wurde entfernt.',
      });
    } catch (error: any) {
      console.error('Error removing document:', error);
      toast({
        title: 'Fehler',
        description: 'Dokument konnte nicht entfernt werden.',
        variant: 'destructive',
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Ungültiger Dateityp',
          description: 'Bitte laden Sie eine Bilddatei hoch.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Datei zu groß',
          description: 'Das Logo darf maximal 5MB groß sein.',
          variant: 'destructive',
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('handwerker-portfolio')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('handwerker-portfolio')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      
      toast({
        title: 'Logo hochgeladen',
        description: 'Ihr Firmen-Logo wurde erfolgreich hochgeladen.',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message || 'Logo konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;
    
    try {
      const urlParts = logoUrl.split('/handwerker-portfolio/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1].split('?')[0];
        
        const { error } = await supabase.storage
          .from('handwerker-portfolio')
          .remove([filePath]);

        if (error) throw error;
      }

      setLogoUrl('');
      
      toast({
        title: 'Logo entfernt',
        description: 'Ihr Firmen-Logo wurde entfernt.',
      });
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: 'Fehler',
        description: 'Logo konnte nicht entfernt werden.',
        variant: 'destructive',
      });
    }
  };

  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 4;
    
    if (bio && bio.trim().length > 50) completed++;
    if (hourlyRateMin && hourlyRateMax) completed++;
    if (serviceAreas && serviceAreas.split(',').filter(a => a.trim()).length > 0) completed++;
    if (portfolioUrls && portfolioUrls.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // Build service areas from radius configuration using shared helper
  const getComputedServiceAreas = () => {
    return buildServiceAreas(serviceRadius, {
      plz: serviceAreaPlz,
      canton: serviceAreaCanton,
      customCantons: customCantons,
    });
  };

  const handleSave = async (silent = false) => {
    if (!profile || saving) return; // Prevent concurrent saves

    // Validation
    if (hourlyRateMin && hourlyRateMax) {
      const min = parseInt(hourlyRateMin);
      const max = parseInt(hourlyRateMax);
      if (min > max) {
        toast({
          title: 'Ungültige Eingabe',
          description: 'Der minimale Stundensatz darf nicht höher als der maximale sein.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      // Build service areas using shared helper
      const allServiceAreas = getComputedServiceAreas();

      const { error } = await supabase
        .from('handwerker_profiles')
        .update({
          // Profile & Bio
          bio: bio.trim() || null,
          hourly_rate_min: hourlyRateMin ? parseInt(hourlyRateMin) : null,
          hourly_rate_max: hourlyRateMax ? parseInt(hourlyRateMax) : null,
          service_areas: allServiceAreas,
          website: website.trim() || null,
          portfolio_urls: portfolioUrls,
          
          // Personal Information
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          phone_number: phoneNumber.trim() || null,
          personal_address: personalAddress.trim() || null,
          personal_zip: personalZip.trim() || null,
          personal_city: personalCity.trim() || null,
          personal_canton: personalCanton.trim() || null,
          
          // Company Information
          company_name: companyName.trim() || null,
          company_legal_form: companyLegalForm.trim() || null,
          uid_number: uidNumber.trim() || null,
          mwst_number: mwstNumber.trim() || null,
          
          // Business Address
          business_address: businessAddress.trim() || null,
          business_zip: businessZip.trim() || null,
          business_city: businessCity.trim() || null,
          business_canton: businessCanton.trim() || null,
          
          // Banking
          iban: iban.trim() ? iban.replace(/\s/g, '') : null,
          bank_name: bankName.trim() || null,
          
          // Insurance & Licenses
          liability_insurance_provider: liabilityInsuranceProvider.trim() || null,
          liability_insurance_policy_number: policyNumber.trim() || null,
          trade_license_number: tradeLicenseNumber.trim() || null,
          insurance_valid_until: insuranceValidUntil.trim() || null,
          
          // Logo
          logo_url: logoUrl || null,
          
          // Categories
          categories: categories as any,
          
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      // If profile was rejected, resubmit for review by setting status back to pending
      if (profile.verification_status === 'rejected' && !silent) {
        const { error: resubmitError } = await supabase
          .from('handwerker_profiles')
          .update({ verification_status: 'pending' })
          .eq('id', profile.id);

        if (!resubmitError) {
          setProfile({ ...profile, verification_status: 'pending' });
          toast({
            title: 'Profil erneut eingereicht',
            description: 'Ihr Profil wurde zur erneuten Prüfung eingereicht.',
          });
        }
      }

      setLastSaved(new Date());

      if (!silent && profile.verification_status !== 'rejected') {
        toast({
          title: 'Profil gespeichert',
          description: 'Ihre Änderungen wurden erfolgreich gespeichert.',
        });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (!silent) {
        // Extract the most useful error detail from Supabase/PostgREST errors
        const errorMessage = error?.message || error?.details || error?.hint || '';
        toast({
          title: 'Fehler beim Speichern',
          description: errorMessage || 'Profil konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!profile || loading || saving) return;

    // Debounce: wait 2 seconds after last change before auto-saving
    const timeoutId = setTimeout(() => {
      handleSave(true);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [bio, hourlyRateMin, hourlyRateMax, serviceAreas, website, portfolioUrls,
      firstName, lastName, phoneNumber, personalAddress, personalZip, personalCity, personalCanton,
      companyName, companyLegalForm, uidNumber, mwstNumber,
      businessAddress, businessZip, businessCity, businessCanton,
      iban, bankName, liabilityInsuranceProvider, policyNumber, tradeLicenseNumber, insuranceValidUntil,
      logoUrl, categories, serviceAreaPlz, serviceRadius, customCantons, verificationDocuments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate('/handwerker-dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-ink-900 mb-2">
                Profil bearbeiten
              </h1>
              <p className="text-ink-600 flex items-center gap-3">
                <span>
                  {profile.first_name} {profile.last_name}
                  {profile.company_name && ` • ${profile.company_name}`}
                </span>
                <HandwerkerStatusIndicator 
                  userId={profile.id}
                  verificationStatus={profile.verification_status || 'pending'}
                  showLabel={false}
                />
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {lastSaved && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Zuletzt gespeichert: {lastSaved.toLocaleTimeString('de-CH')}</span>
                </div>
              )}
              
              <Button
                variant={isPreviewMode ? "default" : "outline"}
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="gap-2"
              >
                {isPreviewMode ? (
                  <>
                    <Edit className="h-4 w-4" />
                    Bearbeiten
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Vorschau
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Rejection banner — allow resubmission */}
          {profile.verification_status === 'rejected' && (
            <div className="mb-6 p-4 border border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-lg">
              <p className="font-medium text-red-800 dark:text-red-200">Ihr Profil wurde abgelehnt</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Bitte aktualisieren Sie Ihr Profil und laden Sie fehlende Dokumente hoch.
                Wenn Sie speichern, wird Ihr Profil automatisch zur erneuten Prüfung eingereicht.
              </p>
            </div>
          )}

          {/* Show Preview or Edit Mode */}
          {isPreviewMode ? (
            <div className="mb-6">
              <ProfilePreview profile={{
                first_name: firstName,
                last_name: lastName,
                company_name: companyName,
                bio: bio,
                hourly_rate_min: hourlyRateMin ? parseInt(hourlyRateMin) : null,
                hourly_rate_max: hourlyRateMax ? parseInt(hourlyRateMax) : null,
                service_areas: buildServiceAreas(serviceRadius, {
                  plz: serviceAreaPlz,
                  canton: serviceAreaCanton,
                  customCantons
                }),
                website: website,
                logo_url: logoUrl,
                portfolio_urls: portfolioUrls,
                phone_number: phoneNumber,
                email: email,
                business_address: businessAddress,
                business_city: businessCity,
                business_zip: businessZip,
                business_canton: businessCanton,
                categories: categories,
                company_legal_form: companyLegalForm,
                liability_insurance_provider: liabilityInsuranceProvider,
                insurance_valid_until: insuranceValidUntil,
                verification_status: profile?.verification_status || null,
              }} />
            </div>
          ) : (
            <>
              {/* Profile Completion Card */}
              <div className="mb-6">
                <ProfileCompletenessCard profile={{
                  first_name: firstName,
                  last_name: lastName,
                  email: email,
                  phone_number: phoneNumber,
                  company_name: companyName,
                  bio: bio,
                  hourly_rate_min: hourlyRateMin ? parseInt(hourlyRateMin) : null,
                  hourly_rate_max: hourlyRateMax ? parseInt(hourlyRateMax) : null,
                  service_areas: serviceAreas.split(',').map(a => a.trim()).filter(a => a),
                  portfolio_urls: portfolioUrls,
                  logo_url: logoUrl,
                  uid_number: uidNumber,
                  iban: iban,
                }} />
              </div>

          <ResponsiveSections 
            sections={[
              {
                id: 'profile',
                label: 'Profil & Bio',
                icon: User,
                content: (
                  <div className="space-y-6">
                    {/* Bio Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Über mich</CardTitle>
                        <CardDescription>
                          Beschreiben Sie Ihre Erfahrung und Expertise
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Biografie</Label>
                          <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Erzählen Sie potentiellen Kunden über Ihre Erfahrung, Spezialisierungen und was Sie auszeichnet..."
                            rows={6}
                            maxLength={1000}
                          />
                          <p className="text-sm text-muted-foreground">
                            {bio.length} / 1000 Zeichen
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rates Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Stundensätze</CardTitle>
                        <CardDescription>
                          Geben Sie Ihre Preisspanne an (in CHF pro Stunde)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hourly_rate_min">Minimaler Stundensatz (CHF)</Label>
                            <Input
                              id="hourly_rate_min"
                              type="number"
                              min="0"
                              step="5"
                              value={hourlyRateMin}
                              onChange={(e) => setHourlyRateMin(e.target.value)}
                              placeholder="z.B. 50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hourly_rate_max">Maximaler Stundensatz (CHF)</Label>
                            <Input
                              id="hourly_rate_max"
                              type="number"
                              min="0"
                              step="5"
                              value={hourlyRateMax}
                              onChange={(e) => setHourlyRateMax(e.target.value)}
                              placeholder="z.B. 120"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Service Areas Section - Using shared component (SSOT with HandwerkerOnboarding) */}
                    <ServiceAreaSelector
                      businessPlz={serviceAreaPlz}
                      businessCity={serviceAreaCity}
                      businessCanton={serviceAreaCanton}
                      serviceRadius={serviceRadius}
                      customCantons={customCantons}
                      onBusinessPlzChange={(plz) => {
                        setServiceAreaPlz(plz);
                        if (plz.length < 4) {
                          setServiceAreaCity('');
                          setServiceAreaCanton('');
                        }
                      }}
                      onAddressSelect={(address) => {
                        setServiceAreaCity(address.city);
                        setServiceAreaCanton(address.canton);
                      }}
                      onRadiusChange={setServiceRadius}
                      onCustomCantonsChange={setCustomCantons}
                    />

                    {/* Website Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Website</CardTitle>
                        <CardDescription>
                          Link zu Ihrer persönlichen oder Firmen-Website
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website URL</Label>
                          <Input
                            id="website"
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://www.ihre-website.ch"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              },
              {
                id: 'categories',
                label: 'Fachgebiete',
                icon: Briefcase,
                content: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-brand-500 flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle>Fachgebiete & Kategorien</CardTitle>
                            <CardDescription>
                              Wählen Sie Ihre Spezialisierungen für gezieltere Aufträge
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <CategorySelector
                          mode="multi"
                          selected={[...selectedMajorCategories, ...categories]}
                          onSelect={(selected) => {
                            const selectedArray = selected as string[];
                            // Separate major categories and subcategories
                            const majors = selectedArray.filter(id => majorCategories[id]);
                            const subcats = selectedArray.filter(id => !majorCategories[id]);
                            setSelectedMajorCategories(majors);
                            setCategories(subcats);
                          }}
                          showSubcategories={true}
                        />

                        {/* Selected Categories Summary */}
                        {categories.length > 0 && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-blue-900">
                                    {categories.length} Fachgebiet{categories.length !== 1 ? 'e' : ''} gewählt
                                  </p>
                                  <p className="text-sm text-blue-700 mt-1">
                                    Ihre Auswahl hilft uns, passende Aufträge für Sie zu finden
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              },
              {
                id: 'company',
                label: 'Firma & Kontakt',
                icon: Building2,
                content: (
                  <div className="space-y-6">
                    {/* Company Information */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <CardTitle>Firmeninformationen</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Firmenname</Label>
                          <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Muster Handwerk GmbH"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="companyLegalForm">Rechtsform</Label>
                          <Select value={companyLegalForm} onValueChange={setCompanyLegalForm}>
                            <SelectTrigger>
                              <SelectValue placeholder="Rechtsform wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="einzelfirma">Einzelfirma</SelectItem>
                              <SelectItem value="gmbh">GmbH</SelectItem>
                              <SelectItem value="ag">AG</SelectItem>
                              <SelectItem value="kollektivgesellschaft">Kollektivgesellschaft</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="uidNumber">UID-Nummer</Label>
                            <Input
                              id="uidNumber"
                              value={uidNumber}
                              onChange={(e) => setUidNumber(e.target.value)}
                              placeholder="CHE-123.456.789"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mwstNumber">MWST-Nummer</Label>
                            <Input
                              id="mwstNumber"
                              value={mwstNumber}
                              onChange={(e) => setMwstNumber(e.target.value)}
                              placeholder="CHE-123.456.789 MWST"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          <CardTitle>Persönliche Informationen</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Vorname</Label>
                            <Input
                              id="firstName"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Max"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Nachname</Label>
                            <Input
                              id="lastName"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Muster"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">E-Mail-Adresse</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            E-Mail kann nicht geändert werden. Kontaktieren Sie den Support bei Bedarf.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Telefonnummer</Label>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+41 79 123 45 67"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="personalAddress">Adresse</Label>
                          <Input
                            id="personalAddress"
                            value={personalAddress}
                            onChange={(e) => setPersonalAddress(e.target.value)}
                            placeholder="Musterstrasse 123"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="personalZip">PLZ</Label>
                            <PostalCodeInput
                              value={personalZip}
                              onValueChange={setPersonalZip}
                              onAddressSelect={(address) => {
                                setPersonalCity(address.city);
                                setPersonalCanton(address.canton);
                              }}
                              placeholder="8000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="personalCity">Ort</Label>
                            <Input
                              id="personalCity"
                              value={personalCity}
                              onChange={(e) => setPersonalCity(e.target.value)}
                              placeholder="Zürich"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="personalCanton">Kanton</Label>
                          <Select value={personalCanton} onValueChange={setPersonalCanton}>
                            <SelectTrigger>
                              <SelectValue placeholder="Kanton wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              {SWISS_CANTONS.map((canton) => (
                                <SelectItem key={canton.value} value={canton.value}>
                                  {canton.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Business Address */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Geschäftsadresse</CardTitle>
                        <CardDescription>
                          Falls abweichend von der persönlichen Adresse
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessAddress">Geschäftsadresse</Label>
                          <Input
                            id="businessAddress"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            placeholder="Gewerbestrasse 456"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="businessZip">PLZ</Label>
                            <PostalCodeInput
                              value={businessZip}
                              onValueChange={setBusinessZip}
                              onAddressSelect={(address) => {
                                setBusinessCity(address.city);
                                setBusinessCanton(address.canton);
                              }}
                              placeholder="8000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessCity">Ort</Label>
                            <Input
                              id="businessCity"
                              value={businessCity}
                              onChange={(e) => setBusinessCity(e.target.value)}
                              placeholder="Zürich"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="businessCanton">Kanton</Label>
                          <Select value={businessCanton} onValueChange={setBusinessCanton}>
                            <SelectTrigger>
                              <SelectValue placeholder="Kanton wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              {SWISS_CANTONS.map((canton) => (
                                <SelectItem key={canton.value} value={canton.value}>
                                  {canton.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              },
              {
                id: 'banking',
                label: 'Banking & Versicherung',
                icon: Wallet,
                content: (
                  <div className="space-y-6">
                    {/* Banking Information */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-primary" />
                          <CardTitle>Bankinformationen</CardTitle>
                        </div>
                        <CardDescription>
                          Für die Auszahlung von Einnahmen
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="iban">IBAN</Label>
                          <Input
                            id="iban"
                            value={iban}
                            onChange={(e) => setIban(e.target.value.toUpperCase())}
                            placeholder="CH76 0000 0000 0000 0000 0"
                            className="font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bankname</Label>
                          <Input
                            id="bankName"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="UBS Switzerland AG"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Insurance & Licenses */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <CardTitle>Versicherung & Lizenzen</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="insuranceProvider">Versicherungsanbieter</Label>
                          <Input
                            id="insuranceProvider"
                            value={liabilityInsuranceProvider}
                            onChange={(e) => setLiabilityInsuranceProvider(e.target.value)}
                            placeholder="Zurich Versicherung"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="policyNumber">Policennummer</Label>
                          <Input
                            id="policyNumber"
                            value={policyNumber}
                            onChange={(e) => setPolicyNumber(e.target.value)}
                            placeholder="POL-123456789"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="insuranceValidUntil">Gültig bis</Label>
                          <Input
                            id="insuranceValidUntil"
                            type="date"
                            value={insuranceValidUntil}
                            onChange={(e) => setInsuranceValidUntil(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tradeLicenseNumber">Gewerbelizenz-Nummer</Label>
                          <Input
                            id="tradeLicenseNumber"
                            value={tradeLicenseNumber}
                            onChange={(e) => setTradeLicenseNumber(e.target.value)}
                            placeholder="LIC-123456"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              },
              {
                id: 'documents',
                label: 'Dokumente & Bilder',
                icon: FileText,
                content: (
                  <div className="space-y-6">
                    {/* Logo Upload */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Firmen-Logo</CardTitle>
                        <CardDescription>
                          Laden Sie Ihr Firmenlogo hoch (max. 5MB)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {logoUrl ? (
                            <div className="relative w-48 h-48 border-2 rounded-lg overflow-hidden">
                              <img 
                                src={logoUrl} 
                                alt="Firmen-Logo" 
                                className="w-full h-full object-contain bg-white"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={handleRemoveLogo}
                                disabled={uploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="text-sm text-muted-foreground mb-4">
                                Kein Logo hochgeladen
                              </p>
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('logoInput')?.click()}
                                disabled={uploading}
                              >
                                {uploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Lädt hoch...
                                  </>
                                ) : (
                                  'Logo hochladen'
                                )}
                              </Button>
                              <input
                                id="logoInput"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Document Expiry Management System */}
                    {profile && userId && (
                      <DocumentManagementSection 
                        profileId={profile.id} 
                        userId={userId} 
                      />
                    )}

                    {/* Portfolio Images */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Portfolio-Bilder</CardTitle>
                        <CardDescription>
                          Zeigen Sie Ihre besten Arbeiten (max. 5MB pro Bild)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="portfolio_upload" className="cursor-pointer">
                              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-brand-600 transition-colors">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mb-1">
                                  Klicken Sie hier, um Bilder hochzuladen
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG, WEBP bis zu 5MB
                                </p>
                              </div>
                            </Label>
                            <Input
                              id="portfolio_upload"
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                              disabled={uploading}
                              className="hidden"
                            />
                          </div>

                          {uploading && (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-brand-600 mr-2" />
                              <span className="text-sm text-muted-foreground">
                                Bilder werden hochgeladen...
                              </span>
                            </div>
                          )}

                          {portfolioUrls.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {portfolioUrls.map((url, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={url}
                                    alt={`Portfolio ${idx + 1}`}
                                    className="w-full h-48 object-cover rounded-lg"
                                  />
                                  <button
                                    onClick={() => handleRemoveImage(url)}
                                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              }
            ]}
            defaultSection="profile"
            className="space-y-6"
          />
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/handwerker-dashboard')}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button onClick={() => handleSave(false)} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Speichert...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Änderungen speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HandwerkerProfileEdit;
