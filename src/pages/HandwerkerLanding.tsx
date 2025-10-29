import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Target, Coins, LayoutDashboard, ShieldCheck, UserPlus, ClipboardCheck, Briefcase, ArrowRight, Building2, Wallet, Shield, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SWISS_CANTONS } from '@/config/cantons';
import { validateUID, validateMWST, validateIBAN, formatIBAN, formatUID } from '@/lib/swissValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

const HandwerkerLanding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    companyLegalForm: "einzelfirma",
    uidNumber: "",
    mwstNumber: "",
    businessAddress: "",
    businessZip: "",
    businessCity: "",
    businessCanton: "",
    sameAsPersonal: false,
    iban: "",
    bankName: "",
    liabilityInsuranceProvider: "",
    policyNumber: "",
    tradeLicenseNumber: "",
    insuranceValidUntil: "",
    categories: [] as string[],
    serviceAreas: [] as string[],
    hourlyRateMin: "",
    hourlyRateMax: "",
    bio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Firmenname ist erforderlich";
      }
      if (!formData.uidNumber) {
        newErrors.uidNumber = "UID-Nummer ist erforderlich";
      } else if (!validateUID(formData.uidNumber)) {
        newErrors.uidNumber = "Ungültiges Format. Beispiel: CHE-123.456.789";
      }
      if (formData.mwstNumber && !validateMWST(formData.mwstNumber)) {
        newErrors.mwstNumber = "Ungültiges Format. Beispiel: CHE-123.456.789 MWST";
      }
    } else if (step === 2) {
      if (!formData.sameAsPersonal) {
        if (!formData.businessAddress.trim()) {
          newErrors.businessAddress = "Geschäftsadresse ist erforderlich";
        }
        if (!formData.businessZip) {
          newErrors.businessZip = "PLZ ist erforderlich";
        }
        if (!formData.businessCity.trim()) {
          newErrors.businessCity = "Ort ist erforderlich";
        }
        if (!formData.businessCanton) {
          newErrors.businessCanton = "Kanton ist erforderlich";
        }
      }
      
      if (!formData.iban) {
        newErrors.iban = "IBAN ist erforderlich";
      } else if (!validateIBAN(formData.iban)) {
        newErrors.iban = "Ungültige IBAN. Format: CH## #### #### #### #### #";
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = "Bankname ist erforderlich";
      }
    } else if (step === 3) {
      if (!formData.liabilityInsuranceProvider.trim()) {
        newErrors.liabilityInsuranceProvider = "Versicherungsanbieter ist erforderlich";
      }
      if (!formData.insuranceValidUntil) {
        newErrors.insuranceValidUntil = "Gültigkeitsdatum ist erforderlich";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Nicht angemeldet",
          description: "Bitte melden Sie sich zuerst an.",
          variant: "destructive",
        });
        navigate('/auth?role=handwerker');
        return;
      }

      const userRole = user.user_metadata?.role;
      if (userRole !== 'handwerker') {
        toast({
          title: "Zugriff verweigert",
          description: "Diese Seite ist nur für Handwerker verfügbar.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      let businessAddress = formData.businessAddress;
      let businessZip = formData.businessZip;
      let businessCity = formData.businessCity;
      let businessCanton = formData.businessCanton;

      if (formData.sameAsPersonal) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("address, zip, city, canton")
          .eq("id", user.id)
          .single();

        if (profile) {
          businessAddress = profile.address || "";
          businessZip = profile.zip || "";
          businessCity = profile.city || "";
          businessCanton = profile.canton || "";
        }
      }

      const { error } = await supabase
        .from("handwerker_profiles")
        .upsert([{
          user_id: user.id,
          company_name: formData.companyName || null,
          company_legal_form: formData.companyLegalForm || null,
          uid_number: formData.uidNumber || null,
          mwst_number: formData.mwstNumber || null,
          business_address: businessAddress || null,
          business_zip: businessZip || null,
          business_city: businessCity || null,
          business_canton: businessCanton || null,
          iban: formData.iban.replace(/\s/g, "") || null,
          bank_name: formData.bankName || null,
          liability_insurance_provider: formData.liabilityInsuranceProvider,
          liability_insurance_policy_number: formData.policyNumber || null,
          trade_license_number: formData.tradeLicenseNumber || null,
          insurance_valid_until: formData.insuranceValidUntil,
          bio: formData.bio || null,
          categories: formData.categories as any[],
          service_areas: formData.serviceAreas.length > 0 ? formData.serviceAreas : [],
          hourly_rate_min: formData.hourlyRateMin ? parseInt(formData.hourlyRateMin) : null,
          hourly_rate_max: formData.hourlyRateMax ? parseInt(formData.hourlyRateMax) : null,
          is_verified: false,
        }]);

      if (error) throw error;

      toast({
        title: "Profil eingereicht",
        description: "Ihr Handwerkerprofil wird innerhalb von 1-2 Werktagen überprüft.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Firmeninformationen</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLegalForm">Rechtsform *</Label>
              <Select
                value={formData.companyLegalForm}
                onValueChange={(value) => setFormData({ ...formData, companyLegalForm: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="einzelfirma">Einzelfirma</SelectItem>
                  <SelectItem value="gmbh">GmbH</SelectItem>
                  <SelectItem value="ag">AG</SelectItem>
                  <SelectItem value="kollektivgesellschaft">Kollektivgesellschaft</SelectItem>
                  <SelectItem value="other">Andere</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="z.B. Max Muster Bau GmbH"
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uidNumber">UID-Nummer *</Label>
              <Input
                id="uidNumber"
                value={formData.uidNumber}
                onChange={(e) => setFormData({ ...formData, uidNumber: e.target.value })}
                onBlur={(e) => {
                  const formatted = formatUID(e.target.value);
                  setFormData({ ...formData, uidNumber: formatted });
                }}
                placeholder="CHE-123.456.789"
              />
              {errors.uidNumber && (
                <p className="text-sm text-destructive">{errors.uidNumber}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Unternehmens-Identifikationsnummer vom BFS
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mwstNumber">MWST-Nummer (optional)</Label>
              <Input
                id="mwstNumber"
                value={formData.mwstNumber}
                onChange={(e) => setFormData({ ...formData, mwstNumber: e.target.value })}
                placeholder="CHE-123.456.789 MWST"
              />
              {errors.mwstNumber && (
                <p className="text-sm text-destructive">{errors.mwstNumber}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Erforderlich bei Jahresumsatz über CHF 100'000
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Geschäftsadresse & Banking</h3>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="sameAsPersonal"
                checked={formData.sameAsPersonal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sameAsPersonal: checked as boolean })
                }
              />
              <Label htmlFor="sameAsPersonal" className="cursor-pointer">
                Gleich wie persönliche Adresse
              </Label>
            </div>

            {!formData.sameAsPersonal && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Geschäftsadresse *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="Strasse & Hausnummer"
                  />
                  {errors.businessAddress && (
                    <p className="text-sm text-destructive">{errors.businessAddress}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessZip">PLZ *</Label>
                    <Input
                      id="businessZip"
                      value={formData.businessZip}
                      onChange={(e) => setFormData({ ...formData, businessZip: e.target.value })}
                      placeholder="8000"
                      maxLength={4}
                    />
                    {errors.businessZip && (
                      <p className="text-sm text-destructive">{errors.businessZip}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessCity">Ort *</Label>
                    <Input
                      id="businessCity"
                      value={formData.businessCity}
                      onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                      placeholder="Zürich"
                    />
                    {errors.businessCity && (
                      <p className="text-sm text-destructive">{errors.businessCity}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCanton">Kanton *</Label>
                  <Select
                    value={formData.businessCanton}
                    onValueChange={(value) => setFormData({ ...formData, businessCanton: value })}
                  >
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
                  {errors.businessCanton && (
                    <p className="text-sm text-destructive">{errors.businessCanton}</p>
                  )}
                </div>
              </>
            )}

            <div className="border-t pt-4 mt-6">
              <h4 className="font-semibold mb-4">Bankinformationen</h4>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN *</Label>
                <Input
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  onBlur={(e) => {
                    const formatted = formatIBAN(e.target.value);
                    setFormData({ ...formData, iban: formatted });
                  }}
                  placeholder="CH76 0000 0000 0000 0000 0"
                />
                {errors.iban && <p className="text-sm text-destructive">{errors.iban}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bankname *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="z.B. UBS, Credit Suisse, PostFinance"
                />
                {errors.bankName && (
                  <p className="text-sm text-destructive">{errors.bankName}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Versicherung & Lizenzen</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="liabilityInsuranceProvider">Haftpflichtversicherung *</Label>
              <Input
                id="liabilityInsuranceProvider"
                value={formData.liabilityInsuranceProvider}
                onChange={(e) =>
                  setFormData({ ...formData, liabilityInsuranceProvider: e.target.value })
                }
                placeholder="z.B. Zürich Versicherung, AXA, Mobiliar"
              />
              {errors.liabilityInsuranceProvider && (
                <p className="text-sm text-destructive">{errors.liabilityInsuranceProvider}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policennummer (optional)</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                placeholder="123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceValidUntil">Gültig bis *</Label>
              <Input
                id="insuranceValidUntil"
                type="date"
                value={formData.insuranceValidUntil}
                onChange={(e) => setFormData({ ...formData, insuranceValidUntil: e.target.value })}
              />
              {errors.insuranceValidUntil && (
                <p className="text-sm text-destructive">{errors.insuranceValidUntil}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeLicenseNumber">Gewerbebewilligung (optional)</Label>
              <Input
                id="tradeLicenseNumber"
                value={formData.tradeLicenseNumber}
                onChange={(e) => setFormData({ ...formData, tradeLicenseNumber: e.target.value })}
                placeholder="Falls erforderlich"
              />
              <p className="text-sm text-muted-foreground">
                Abhängig von Branche und Kanton
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ihre Versicherungsunterlagen werden während des Verifizierungsprozesses überprüft.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Dienstleistungen (optional)</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Diese Informationen können Sie später in Ihrem Profil vervollständigen.
            </p>

            <div className="space-y-2">
              <Label htmlFor="bio">Kurze Beschreibung</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Beschreiben Sie Ihre Dienstleistungen und Erfahrung..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRateMin">Stundensatz von (CHF)</Label>
                <Input
                  id="hourlyRateMin"
                  type="number"
                  value={formData.hourlyRateMin}
                  onChange={(e) => setFormData({ ...formData, hourlyRateMin: e.target.value })}
                  placeholder="80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRateMax">Stundensatz bis (CHF)</Label>
                <Input
                  id="hourlyRateMax"
                  type="number"
                  value={formData.hourlyRateMax}
                  onChange={(e) => setFormData({ ...formData, hourlyRateMax: e.target.value })}
                  placeholder="120"
                />
              </div>
            </div>

            <Alert className="bg-warning/10 border-warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Manuelle Überprüfung erforderlich</strong>
                <p className="mt-1 text-sm">
                  Ihr Profil wird innerhalb von 1-2 Werktagen überprüft. Dies schützt Kundendaten
                  und stellt die Qualität der Plattform sicher.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const benefits = [
    {
      icon: Target,
      title: 'Gezielt neue Kunden finden',
      description: 'Erhalten Sie Zugang zu Aufträgen, die genau zu Ihren Dienstleistungen passen. Kunden suchen aktiv nach Ihrem Fachwissen.'
    },
    {
      icon: Coins,
      title: 'Transparente Kosten',
      description: 'Durchsuchen Sie unbegrenzt Anfragen mit einem Abo und kaufen Sie nur die Leads, die Sie wirklich interessieren. CHF 25 pro Lead – transparent und fair.'
    },
    {
      icon: LayoutDashboard,
      title: 'Alles im Überblick',
      description: 'Verwalten Sie Ihre Anfragen bequem in Ihrem Dashboard. Antworten Sie direkt auf Kundenanfragen und behalten Sie den Überblick.'
    },
    {
      icon: ShieldCheck,
      title: 'Seriöse Anfragen',
      description: 'Alle Anfragen werden von uns geprüft, bevor sie online gehen. So sparen Sie Zeit und können sich auf echte Projekte konzentrieren.'
    }
  ];

  const steps = [
    {
      icon: UserPlus,
      title: 'Registrieren',
      description: 'Erstellen Sie kostenlos Ihr Handwerker-Profil und wählen Sie Ihre Fachgebiete.'
    },
    {
      icon: ClipboardCheck,
      title: 'Profil-Freigabe',
      description: 'Nach kurzer Prüfung schalten wir Ihr Profil frei – Ihre Daten sind bei uns sicher.'
    },
    {
      icon: Briefcase,
      title: 'Aufträge erhalten',
      description: 'Durchsuchen Sie passende Aufträge und kontaktieren Sie interessierte Kunden direkt.'
    }
  ];

  const faqItems = [
    {
      question: 'Wie werde ich als Handwerker verifiziert?',
      answer: 'Nach Ihrer Registrierung prüfen wir Ihre Angaben manuell, um sicherzustellen, dass nur vertrauenswürdige und qualifizierte Fachbetriebe Zugang zu den Kundenanfragen erhalten. Diese Überprüfung dient dem Schutz unserer Auftraggeber und stärkt die Qualität auf der Plattform. In der Regel dauert sie 1–2 Werktage. Nach der Freischaltung erhalten Sie eine Bestätigungs-E-Mail und können direkt loslegen.'
    },
    {
      question: 'Wie funktioniert die Preisgestaltung für Handwerker?',
      answer: 'Die Registrierung ist komplett kostenlos. Im kostenlosen Plan können Sie monatlich 2 Anfragen anschauen – Sie sehen dabei Ort, PLZ, Kategorie und Budget, jedoch keine Kontaktdaten. Mit einem Abo (ab CHF 80/Monat) erhalten Sie unbegrenzten Zugriff auf alle Anfragen und können alle verfügbaren Projekte durchsuchen. Um die vollständigen Kontaktdaten eines Auftraggebers zu erhalten, kaufen Sie den Lead für CHF 25. So zahlen Sie nur für die Anfragen, die Sie wirklich interessieren.'
    },
    {
      question: 'Welche Informationen sehen Auftraggeber von mir?',
      answer: 'Ihr Profil wird erst nach der Überprüfung für passende Anfragen freigeschaltet. Ihre Kontaktdaten bleiben geschützt, bis Sie selbst den Kontakt zu einem Auftraggeber aufnehmen. So behalten Sie jederzeit die Kontrolle über Ihre Sichtbarkeit und Anfragen.'
    },
    {
      question: 'Kann ich mein Profil später anpassen?',
      answer: 'Ja. In Ihrem Dashboard können Sie Ihre Angaben jederzeit aktualisieren – etwa Fachbereiche, Einsatzgebiete oder Stundensätze. So bleibt Ihr Profil immer auf dem neuesten Stand.'
    },
    {
      question: 'Muss ich auf jede Anfrage reagieren?',
      answer: 'Nein. Sie entscheiden selbst, welche Projekte für Sie interessant sind – es gibt keine Verpflichtung, auf jede Anfrage zu antworten. Beachten Sie jedoch: Wenn Sie nicht zeitnah reagieren, kann Ihre Anfrage je nach Dringlichkeit des Auftrags innerhalb weniger Stunden oder Tage an weitere Anbieter weitergeleitet werden. Im Dashboard sehen Sie auch die Dringlichkeit der einzelnen Aufträge, damit Sie selbst einschätzen können, welche Projekte Sie bevorzugt bearbeiten möchten. So behalten Sie volle Flexibilität, ohne Chancen zu verpassen.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-pastel-blue-50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-900 mb-6">
              Mehr Aufträge für Ihr Handwerksunternehmen
            </h1>
            <p className="text-xl md:text-2xl text-ink-700 mb-8">
              Erreichen Sie neue Kunden in Ihrer Region – einfach, transparent und fair.
            </p>
            <div className="py-10 flex justify-center mb-12">
              <Button
                onClick={scrollToForm}
                size="lg"
                className="relative h-16 px-12 text-xl rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold 
                  shadow-lg hover:shadow-xl 
                  transition-all duration-300 
                  hover:scale-105 active:scale-95
                  group"
              >
                <span className="relative z-10">Jetzt kostenlos registrieren</span>
                <ArrowRight className="relative z-10 ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-ink-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <span>Über 100 aktive Aufträge pro Monat</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-brand-600" />
                <span>Schnelle Vermittlung</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-brand-600" />
                <span>Keine versteckten Kosten</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              Warum Büeze.ch?
            </h2>
            <p className="text-xl text-ink-700">
              Ihre Vorteile als Handwerker auf unserer Plattform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-2 hover:border-brand-600 transition-colors">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-brand-600/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-brand-600" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-pastel-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              So funktioniert's
            </h2>
            <p className="text-xl text-ink-700">
              In 3 einfachen Schritten zu neuen Aufträgen
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="relative mb-6">
                      <div className="h-20 w-20 rounded-full bg-brand-600 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-ink-900 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-ink-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-ink-700">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      {showForm && (
        <section ref={formRef} className="py-24 bg-gradient-to-br from-brand-50 via-pastel-blue-50 to-brand-100 relative">
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-600 mb-6">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
                Jetzt registrieren
              </h2>
              <p className="text-lg text-ink-700 max-w-2xl mx-auto">
                Füllen Sie das Formular aus, um Zugang zu qualifizierten Kundenanfragen zu erhalten
              </p>
            </div>

            {/* Form Card */}
            <div className="max-w-3xl mx-auto">
              <Card className="border-2 border-brand-200 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-brand-50 to-pastel-blue-50 border-b-2 border-brand-200">
                  <CardTitle className="text-2xl">Als Handwerker registrieren</CardTitle>
                  <CardDescription className="text-base">
                    Schritt {currentStep} von {totalSteps}
                  </CardDescription>
                  <Progress value={progress} className="mt-4 h-3" />
                </CardHeader>

                <CardContent className="pt-8 pb-8">
                  {renderStepContent()}

                  <div className="flex justify-between mt-8 pt-6 border-t-2 border-brand-200">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleBack}
                      disabled={currentStep === 1 || isLoading}
                      className="min-w-[120px]"
                    >
                      Zurück
                    </Button>

                    {currentStep < totalSteps ? (
                      <Button size="lg" onClick={handleNext} disabled={isLoading} className="min-w-[120px]">
                        Weiter
                      </Button>
                    ) : (
                      <Button size="lg" onClick={handleSubmit} disabled={isLoading} className="min-w-[160px]">
                        {isLoading ? "Wird gespeichert..." : "Profil einreichen"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              Häufig gestellte Fragen
            </h2>
            <p className="text-xl text-ink-700">
              Alles, was Sie wissen müssen
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-lg shadow-sm border border-border px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-ink-900 hover:text-brand-600 py-5">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-ink-700 leading-relaxed pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HandwerkerLanding;
