import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { SWISS_CANTONS } from "@/config/cantons";
import { validateUID, validateMWST, validateIBAN, formatIBAN, formatUID } from "@/lib/swissValidation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building2, Wallet, Shield, Briefcase } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const HandwerkerOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Company Information
    companyName: "",
    companyLegalForm: "einzelfirma",
    uidNumber: "",
    mwstNumber: "",
    
    // Business Address
    businessAddress: "",
    businessZip: "",
    businessCity: "",
    businessCanton: "",
    sameAsPersonal: false,
    
    // Banking
    iban: "",
    bankName: "",
    
    // Insurance & Licenses
    liabilityInsuranceProvider: "",
    policyNumber: "",
    tradeLicenseNumber: "",
    insuranceValidUntil: "",
    
    // Service Details (from existing handwerker_profiles)
    categories: [] as string[],
    serviceAreas: [] as string[],
    hourlyRateMin: "",
    hourlyRateMax: "",
    bio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Company Information validation
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
      // Business Address validation
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
      
      // Banking validation
      if (!formData.iban) {
        newErrors.iban = "IBAN ist erforderlich";
      } else if (!validateIBAN(formData.iban)) {
        newErrors.iban = "Ungültige IBAN. Format: CH## #### #### #### #### #";
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = "Bankname ist erforderlich";
      }
    } else if (step === 3) {
      // Insurance validation
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
      if (!user) throw new Error("Not authenticated");

      // Get user's personal address from profile if using same address
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

      // Insert or update handwerker_profile
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
          is_verified: false, // Will be verified by admin
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
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, uidNumber: value });
                }}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, iban: value });
                  }}
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

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Handwerkerprofil vervollständigen</CardTitle>
            <CardDescription>
              Schritt {currentStep} von {totalSteps}
            </CardDescription>
            <Progress value={progress} className="mt-2" />
          </CardHeader>

          <CardContent>
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
              >
                Zurück
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={isLoading}>
                  Weiter
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Wird gespeichert..." : "Profil einreichen"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HandwerkerOnboarding;
