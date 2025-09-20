import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Star, Clock, Languages } from "lucide-react";

interface HandwerkerProfile {
  id: string;
  user_id: string;
  categories: string[];
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  bio?: string;
  service_areas: string[];
  languages?: string[];
  is_verified: boolean;
  profiles?: {
    full_name?: string;
    phone?: string;
    city?: string;
    canton?: string;
  };
}

interface HandwerkerCardProps {
  handwerker: HandwerkerProfile;
  onContactClick: (handwerker: HandwerkerProfile) => void;
}

const categoryLabels: Record<string, string> = {
  elektriker: "Elektriker",
  sanitaer: "Sanitär",
  heizung: "Heizung",
  klimatechnik: "Klimatechnik",
  maler: "Maler",
  gipser: "Gipser",
  bodenleger: "Bodenleger",
  plattenleger: "Plattenleger",
  schreiner: "Schreiner",
  maurer: "Maurer",
  zimmermann: "Zimmermann",
  dachdecker: "Dachdecker",
  fassadenbauer: "Fassadenbauer",
  gartenbau: "Gartenbau",
  pflasterarbeiten: "Pflasterarbeiten",
  zaun_torbau: "Zaun & Torbau",
  fenster_tueren: "Fenster & Türen",
  kuechenbau: "Küchenbau",
  badumbau: "Badumbau",
  umzug: "Umzug",
  reinigung: "Reinigung",
  schlosserei: "Schlosserei",
  spengler: "Spengler"
};

const languageLabels: Record<string, string> = {
  de: "Deutsch",
  fr: "Französisch",
  it: "Italienisch",
  en: "Englisch",
  rm: "Rätoromanisch",
  ru: "Russisch"
};

export const HandwerkerCard = ({ handwerker, onContactClick }: HandwerkerCardProps) => {
  const formatHourlyRate = () => {
    if (!handwerker.hourly_rate_min && !handwerker.hourly_rate_max) {
      return "Preis auf Anfrage";
    }
    if (handwerker.hourly_rate_min === handwerker.hourly_rate_max) {
      return `CHF ${handwerker.hourly_rate_min}/h`;
    }
    return `CHF ${handwerker.hourly_rate_min || 0} - ${handwerker.hourly_rate_max || 0}/h`;
  };

  const getLocationString = () => {
    const parts = [handwerker.profiles?.city, handwerker.profiles?.canton].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 flex items-center gap-2">
              {handwerker.profiles?.full_name || "Handwerker"}
              {handwerker.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Verifiziert
                </Badge>
              )}
            </CardTitle>
            <div className="flex flex-wrap gap-1 mb-2">
              {handwerker.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {categoryLabels[category] || category}
                </Badge>
              ))}
              {handwerker.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{handwerker.categories.length - 3} weitere
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-primary">
              {formatHourlyRate()}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {handwerker.bio && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {handwerker.bio}
          </p>
        )}
        
        <div className="space-y-2 mb-4">
          {getLocationString() && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{getLocationString()}</span>
            </div>
          )}
          
          {handwerker.service_areas.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Servicegebiete: {handwerker.service_areas.slice(0, 3).join(", ")}</span>
              {handwerker.service_areas.length > 3 && (
                <span className="text-xs">+{handwerker.service_areas.length - 3} weitere</span>
              )}
            </div>
          )}
          
          {handwerker.languages && handwerker.languages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="w-4 h-4" />
              <span>
                {handwerker.languages.map(lang => languageLabels[lang] || lang).join(", ")}
              </span>
            </div>
          )}
          
          {handwerker.profiles?.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{handwerker.profiles.phone}</span>
            </div>
          )}
        </div>
        
        <Button 
          onClick={() => onContactClick(handwerker)}
          className="w-full"
          size="sm"
        >
          Kontakt aufnehmen
        </Button>
      </CardContent>
    </Card>
  );
};