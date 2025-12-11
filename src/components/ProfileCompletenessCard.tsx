import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateProfileCompleteness, ProfileCompletenessInput } from '@/lib/profileCompleteness';

interface ProfileCompletenessCardProps {
  profile: ProfileCompletenessInput & {
    service_areas: string[];
    portfolio_urls: string[];
  };
}

interface RequirementItem {
  label: string;
  completed: boolean;
  required: boolean;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({ profile }) => {
  const result = calculateProfileCompleteness(profile);

  // Build display requirements from the shared logic
  const requirements: RequirementItem[] = [
    { label: 'Vor- und Nachname', completed: !!(profile.first_name && profile.last_name), required: true },
    { label: 'E-Mail-Adresse', completed: !!profile.email, required: true },
    { label: 'Telefonnummer', completed: !!profile.phone_number, required: true },
    { label: 'Profilbeschreibung', completed: !!(profile.bio && profile.bio.length >= 50), required: true },
    { label: 'Servicegebiete', completed: (profile.service_areas?.length ?? 0) > 0, required: true },
    { label: 'Stundensätze', completed: !!(profile.hourly_rate_min && profile.hourly_rate_max), required: false },
    { label: 'Firmenname', completed: !!profile.company_name, required: false },
    { label: 'Logo', completed: !!profile.logo_url, required: false },
    { label: 'Portfolio (min. 1 Bild)', completed: (profile.portfolio_urls?.length ?? 0) > 0, required: false },
    { label: 'UID-Nummer', completed: !!profile.uid_number, required: false },
    { label: 'IBAN', completed: !!profile.iban, required: false },
  ];

  const requiredItems = requirements.filter(r => r.required);
  const optionalItems = requirements.filter(r => !r.required);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profilvollständigkeit</CardTitle>
        <CardDescription>
          {result.isComplete 
            ? 'Alle erforderlichen Felder sind ausgefüllt. Ergänzen Sie optionale Informationen für ein besseres Profil.'
            : 'Füllen Sie alle erforderlichen Felder aus, um Ihr Profil zu aktivieren.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt</span>
            <span className="font-semibold">{result.percentage}%</span>
          </div>
          <Progress value={result.percentage} className="h-2" />
        </div>

        {/* Required Items */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-ink-700">Erforderlich</h4>
          <div className="space-y-2">
            {requiredItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={cn(
                  "text-sm",
                  item.completed ? "text-ink-700" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Items */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-ink-700">Optional</h4>
          <div className="space-y-2">
            {optionalItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={cn(
                  "text-sm",
                  item.completed ? "text-ink-700" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Erforderlich:</span>
            <span className={cn(
              "font-semibold",
              result.isComplete ? "text-success" : "text-orange-600"
            )}>
              {result.requiredComplete}/{result.requiredTotal}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Optional:</span>
            <span className="font-semibold text-ink-700">
              {result.optionalComplete}/{result.optionalTotal}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
