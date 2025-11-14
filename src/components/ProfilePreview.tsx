import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Euro, Star } from 'lucide-react';

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
  };
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({ profile }) => {
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
            <div className="h-20 w-20 rounded-lg bg-surface border-2 border-brand-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.logo_url ? (
                <img 
                  src={profile.logo_url} 
                  alt={displayName}
                  className="h-full w-full object-cover"
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
          {/* Rate Badge */}
          {hasRates && (
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-brand-500" />
              <Badge variant="secondary" className="text-base px-4 py-1">
                {rateDisplay}
              </Badge>
            </div>
          )}

          {/* Bio */}
          <div>
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
            <div>
              <h3 className="font-semibold text-lg mb-3">Portfolio</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profile.portfolio_urls.map((url, index) => (
                  <div 
                    key={index}
                    className="aspect-video rounded-lg overflow-hidden bg-gray-100 border"
                  >
                    <img 
                      src={url} 
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Areas */}
          {profile.service_areas && profile.service_areas.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Servicegebiete</h3>
              <div className="flex flex-wrap gap-2">
                {profile.service_areas.map((area, index) => (
                  <Badge key={index} variant="outline">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
