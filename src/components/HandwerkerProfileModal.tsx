import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/ui/star-rating';
import { VerifiedSwissBadge } from '@/components/VerifiedSwissBadge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Globe, Clock, Building2, Briefcase } from 'lucide-react';
import { categoryLabels } from '@/config/categoryLabels';
import { SWISS_CANTONS, getCantonLabel } from '@/config/cantons';

interface HandwerkerProfile {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  company_legal_form: string | null;
  bio: string | null;
  logo_url: string | null;
  website: string | null;
  categories: string[];
  service_areas: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  response_time_hours: number | null;
  is_verified: boolean | null;
  verification_status: string | null;
  languages: string[] | null;
  portfolio_urls: string[] | null;
  business_city: string | null;
  business_canton: string | null;
  business_zip: string | null;
}

interface RatingStats {
  average_rating: number | null;
  review_count: number | null;
}

interface HandwerkerProfileModalProps {
  handwerkerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HandwerkerProfileModal({ handwerkerId, open, onOpenChange }: HandwerkerProfileModalProps) {
  const [profile, setProfile] = useState<HandwerkerProfile | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && handwerkerId) {
      fetchProfile();
    }
  }, [open, handwerkerId]);

  const fetchProfile = async () => {
    if (!handwerkerId) return;
    
    setLoading(true);
    try {
      const [profileRes, ratingsRes] = await Promise.all([
        supabase
          .from('handwerker_profiles_public')
          .select('*')
          .eq('user_id', handwerkerId)
          .single(),
        supabase
          .from('handwerker_rating_stats')
          .select('*')
          .eq('user_id', handwerkerId)
          .single()
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as HandwerkerProfile);
      }
      if (ratingsRes.data) {
        setRatingStats(ratingsRes.data);
      }
    } catch (error) {
      console.error('Error fetching handwerker profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (profile?.company_name) return profile.company_name;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Handwerker';
  };

  const getLocation = () => {
    const parts = [];
    if (profile?.business_zip) parts.push(profile.business_zip);
    if (profile?.business_city) parts.push(profile.business_city);
    if (profile?.business_canton) {
      parts.push(`(${profile.business_canton})`);
    }
    return parts.join(' ');
  };

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  const formatServiceAreas = () => {
    if (!profile?.service_areas || profile.service_areas.length === 0) return null;
    return profile.service_areas.map(area => {
      if (area.length === 2) {
        return getCantonLabel(area);
      }
      return area;
    }).join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-4 p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : profile ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={getDisplayName()}
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <DialogTitle className="text-xl flex items-center gap-2">
                    {getDisplayName()}
                    <VerifiedSwissBadge 
                      isVerified={profile.is_verified || false} 
                      showLabel={false}
                    />
                  </DialogTitle>
                  
                  {profile.company_legal_form && (
                    <p className="text-sm text-muted-foreground">{profile.company_legal_form}</p>
                  )}
                  
                  {getLocation() && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {getLocation()}
                    </p>
                  )}

                  {ratingStats && ratingStats.review_count && ratingStats.review_count > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating rating={ratingStats.average_rating || 0} size="sm" />
                      <span className="text-sm text-muted-foreground">
                        ({ratingStats.review_count} Bewertungen)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h4 className="font-medium mb-2">Über uns</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {/* Categories */}
              {profile.categories && profile.categories.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Dienstleistungen
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {getCategoryLabel(cat)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Areas */}
              {formatServiceAreas() && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Servicegebiet
                  </h4>
                  <p className="text-sm text-muted-foreground">{formatServiceAreas()}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {(profile.hourly_rate_min || profile.hourly_rate_max) && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Stundensatz</p>
                    <p className="font-medium">
                      CHF {profile.hourly_rate_min || '–'} - {profile.hourly_rate_max || '–'}
                    </p>
                  </div>
                )}
                
                {profile.response_time_hours && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Antwortzeit
                    </p>
                    <p className="font-medium">
                      {profile.response_time_hours < 24 
                        ? `${profile.response_time_hours}h`
                        : `${Math.round(profile.response_time_hours / 24)} Tage`}
                    </p>
                  </div>
                )}

                {profile.languages && profile.languages.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Sprachen</p>
                    <p className="font-medium">
                      {profile.languages.map(l => l === 'de' ? 'Deutsch' : l === 'fr' ? 'Französisch' : l === 'it' ? 'Italienisch' : l === 'en' ? 'Englisch' : l).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Portfolio */}
              {profile.portfolio_urls && profile.portfolio_urls.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Portfolio</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {profile.portfolio_urls.slice(0, 6).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Portfolio ${index + 1}`}
                        className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Website */}
              {profile.website && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(profile.website!, '_blank')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Website besuchen
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Profil nicht gefunden
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
