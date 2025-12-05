import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Globe, Coins, Star, Phone, Mail, Shield, Wrench, Building2, CheckCircle } from 'lucide-react';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { majorCategories } from '@/config/majorCategories';
import { formatCantonDisplay } from '@/lib/cantonPostalCodes';
import { HandwerkerRating } from './HandwerkerRating';

interface ProfilePreviewProps {
  profile: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    bio: string | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    service_areas: string[];
    website: string | null;
    logo_url: string | null;
    portfolio_urls: string[];
    phone_number: string | null;
    email: string | null;
    business_address: string | null;
    business_city: string | null;
    business_zip: string | null;
    business_canton: string | null;
    categories: string[];
    company_legal_form: string | null;
    liability_insurance_provider: string | null;
    insurance_valid_until: string | null;
    verification_status: string | null;
    user_id?: string | null;
  };
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({ profile }) => {
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);
  const [selectedPortfolioImage, setSelectedPortfolioImage] = useState<string | null>(null);
  
  const displayName = profile.company_name || 
    (profile.first_name && profile.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : 'Ihr Name');

  const hasRates = profile.hourly_rate_min || profile.hourly_rate_max;
  const rateDisplay = hasRates 
    ? `CHF ${profile.hourly_rate_min || 0} - ${profile.hourly_rate_max || 0}/Std.`
    : 'Keine Preisangabe';

  return (
    <div className="space-y-6">
      {/* Preview Notice */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
        <p className="text-sm text-brand-700">
          <strong>Vorschau:</strong> So sehen Kunden Ihr Profil, wenn sie Ihre Offerte erhalten.
        </p>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-brand-50 to-brand-100 border-b">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div 
              className="h-20 w-20 rounded-lg bg-surface border-2 border-brand-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-brand-400 transition-colors group"
              onClick={() => profile.logo_url && setIsLogoDialogOpen(true)}
              title="Logo vergrössern"
            >
              {profile.logo_url ? (
                <img 
                  src={profile.logo_url} 
                  alt={displayName}
                  className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform"
                />
              ) : (
                <Star className="h-10 w-10 text-brand-400" />
              )}
            </div>

            {/* Header Info */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl mb-2">{displayName}</CardTitle>
              <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                {profile.service_areas && profile.service_areas.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.service_areas.join(', ')}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:text-brand-600"
                    >
                      Website besuchen
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Rate Badge and Rating */}
          <div className="flex flex-wrap items-center gap-4">
            {hasRates && (
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-brand-500" />
                <Badge variant="secondary" className="text-base px-4 py-1">
                  {rateDisplay}
                </Badge>
              </div>
            )}
            {profile.user_id && (
              <HandwerkerRating handwerkerId={profile.user_id} compact />
            )}
          </div>

          {/* Contact Information */}
          {(profile.phone_number || profile.email || profile.business_address) && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">
                Kontaktinformationen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {profile.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${profile.phone_number}`} className="text-brand-500 hover:underline">
                      {profile.phone_number}
                    </a>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${profile.email}`} className="text-brand-500 hover:underline">
                      {profile.email}
                    </a>
                  </div>
                )}
                {(profile.business_address || profile.business_city) && (
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {profile.business_address && `${profile.business_address}, `}
                      {profile.business_zip} {profile.business_city}
                      {profile.business_canton && `, ${profile.business_canton}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Services Offered - Organized by Major Categories */}
          {profile.categories && profile.categories.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-brand-500" />
                Angebotene Dienstleistungen
              </h3>
              <div className="space-y-4">
                {(() => {
                  // Group categories by their major category
                  const groupedCategories: Record<string, string[]> = {};
                  
                  profile.categories.forEach(categoryKey => {
                    const categoryInfo = subcategoryLabels[categoryKey];
                    if (categoryInfo && categoryInfo.majorCategoryId) {
                      if (!groupedCategories[categoryInfo.majorCategoryId]) {
                        groupedCategories[categoryInfo.majorCategoryId] = [];
                      }
                      groupedCategories[categoryInfo.majorCategoryId].push(categoryKey);
                    }
                  });

                  return Object.entries(groupedCategories).map(([majorCatId, subcats]) => {
                    const majorCat = majorCategories[majorCatId];
                    if (!majorCat) return null;

                    const MajorIcon = majorCat.icon;

                    return (
                      <div key={majorCatId} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MajorIcon className="h-4 w-4" />
                          <span>{majorCat.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pl-6">
                          {subcats.map((subcat, idx) => {
                            const subcatInfo = subcategoryLabels[subcat];
                            return (
                              <Badge key={idx} variant="secondary" className="text-sm px-3 py-1.5">
                                {subcatInfo?.label || subcat}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Bio */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-2">Über uns</h3>
            {profile.bio ? (
              <p className="text-ink-700 leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-muted-foreground italic">
                Noch keine Beschreibung hinzugefügt.
              </p>
            )}
          </div>

          {/* Portfolio */}
          {profile.portfolio_urls && profile.portfolio_urls.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Portfolio</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profile.portfolio_urls.map((url, index) => (
                  <div 
                    key={index}
                    className="aspect-video rounded-lg overflow-hidden bg-gray-100 border cursor-pointer hover:border-brand-400 hover:shadow-lg transition-all group"
                    onClick={() => setSelectedPortfolioImage(url)}
                    title="Bild vergrössern"
                  >
                    <img 
                      src={url} 
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Areas */}
          {profile.service_areas && profile.service_areas.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Servicegebiete</h3>
              <div className="flex flex-wrap gap-2">
                {profile.service_areas.map((area, index) => {
                  const isCanton = area.length === 2 && area === area.toUpperCase();
                  const displayText = isCanton ? formatCantonDisplay(area) : area;
                  
                  return (
                    <Badge key={index} variant={isCanton ? "default" : "outline"}>
                      {displayText}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Professional Details */}
          {(profile.company_legal_form || profile.liability_insurance_provider || profile.verification_status === 'approved') && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Professionelle Details</h3>
              <div className="space-y-2 text-sm">
                {profile.company_legal_form && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Rechtsform:</span>
                    <span className="font-medium">{profile.company_legal_form}</span>
                  </div>
                )}
                {profile.liability_insurance_provider && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <Badge variant="outline" className="border-green-600 text-green-700">
                      Haftpflichtversichert
                      {profile.insurance_valid_until && 
                        ` bis ${new Date(profile.insurance_valid_until).toLocaleDateString('de-CH')}`
                      }
                    </Badge>
                  </div>
                )}
                {profile.verification_status === 'approved' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <Badge variant="outline" className="border-blue-600 text-blue-700">
                      Geprüftes Profil
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo Popup Dialog */}
      <Dialog open={isLogoDialogOpen} onOpenChange={setIsLogoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{displayName}</DialogTitle>
            <DialogDescription>
              Firmenlogo
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/30 rounded-lg p-8 min-h-[400px]">
            {profile.logo_url && (
              <img 
                src={profile.logo_url} 
                alt={displayName}
                className="max-h-[500px] max-w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Portfolio Image Popup Dialog */}
      <Dialog open={!!selectedPortfolioImage} onOpenChange={(open) => !open && setSelectedPortfolioImage(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Portfolio Bild</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
            {selectedPortfolioImage && (
              <img 
                src={selectedPortfolioImage} 
                alt="Portfolio"
                className="max-h-[700px] max-w-full object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
