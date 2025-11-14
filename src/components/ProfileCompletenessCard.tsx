import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCompletenessCardProps {
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
    company_name: string | null;
    bio: string | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    service_areas: string[];
    portfolio_urls: string[];
    logo_url: string | null;
    uid_number: string | null;
    iban: string | null;
  };
}

interface RequirementItem {
  label: string;
  completed: boolean;
  required: boolean;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({ profile }) => {
  const requirements: RequirementItem[] = [
    {
      label: 'Vor- und Nachname',
      completed: !!(profile.first_name && profile.last_name),
      required: true
    },
    {
      label: 'E-Mail-Adresse',
      completed: !!profile.email,
      required: true
    },
    {
      label: 'Telefonnummer',
      completed: !!profile.phone_number,
      required: true
    },
    {
      label: 'Profilbeschreibung',
      completed: !!(profile.bio && profile.bio.length >= 50),
      required: true
    },
    {
      label: 'Servicegebiete',
      completed: profile.service_areas && profile.service_areas.length > 0,
      required: true
    },
    {
      label: 'Stundensätze',
      completed: !!(profile.hourly_rate_min && profile.hourly_rate_max),
      required: false
    },
    {
      label: 'Firmenname',
      completed: !!profile.company_name,
      required: false
    },
    {
      label: 'Logo',
      completed: !!profile.logo_url,
      required: false
    },
    {
      label: 'Portfolio (min. 1 Bild)',
      completed: profile.portfolio_urls && profile.portfolio_urls.length > 0,
      required: false
    },
    {
      label: 'UID-Nummer',
      completed: !!profile.uid_number,
      required: false
    },
    {
      label: 'IBAN',
      completed: !!profile.iban,
      required: false
    },
  ];

  const requiredItems = requirements.filter(r => r.required);
  const optionalItems = requirements.filter(r => !r.required);
  
  const requiredCompleted = requiredItems.filter(r => r.completed).length;
  const optionalCompleted = optionalItems.filter(r => r.completed).length;
  
  const totalCompleted = requiredCompleted + optionalCompleted;
  const totalItems = requirements.length;
  const completionPercentage = Math.round((totalCompleted / totalItems) * 100);

  const allRequiredCompleted = requiredCompleted === requiredItems.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profilvollständigkeit</CardTitle>
        <CardDescription>
          {allRequiredCompleted 
            ? 'Alle erforderlichen Felder sind ausgefüllt. Ergänzen Sie optionale Informationen für ein besseres Profil.'
            : 'Füllen Sie alle erforderlichen Felder aus, um Ihr Profil zu aktivieren.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fortschritt</span>
            <span className="font-semibold">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
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
              allRequiredCompleted ? "text-success" : "text-orange-600"
            )}>
              {requiredCompleted}/{requiredItems.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Optional:</span>
            <span className="font-semibold text-ink-700">
              {optionalCompleted}/{optionalItems.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
