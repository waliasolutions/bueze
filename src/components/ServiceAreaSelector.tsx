/**
 * ServiceAreaSelector - Shared component for selecting service areas
 * SSOT for both HandwerkerOnboarding and HandwerkerProfileEdit
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PostalCodeInput } from '@/components/PostalCodeInput';
import { SWISS_CANTONS } from '@/config/cantons';
import { MapPin, CheckCircle } from 'lucide-react';
import { ServiceRadius } from '@/lib/serviceAreaHelpers';

interface ServiceAreaSelectorProps {
  businessPlz: string;
  businessCity: string;
  businessCanton: string;
  serviceRadius: ServiceRadius;
  customCantons: string[];
  onBusinessPlzChange: (plz: string) => void;
  onAddressSelect: (address: { city: string; canton: string }) => void;
  onRadiusChange: (radius: ServiceRadius) => void;
  onCustomCantonsChange: (cantons: string[]) => void;
  /** Show as a card with header (default) or inline without card wrapper */
  variant?: 'card' | 'inline';
  /** Additional class for the container */
  className?: string;
}

export const ServiceAreaSelector: React.FC<ServiceAreaSelectorProps> = ({
  businessPlz,
  businessCity,
  businessCanton,
  serviceRadius,
  customCantons,
  onBusinessPlzChange,
  onAddressSelect,
  onRadiusChange,
  onCustomCantonsChange,
  variant = 'card',
  className = '',
}) => {
  const toggleCustomCanton = (canton: string) => {
    const isSelected = customCantons.includes(canton);
    const newSelection = isSelected
      ? customCantons.filter(c => c !== canton)
      : [...customCantons, canton];
    onCustomCantonsChange(newSelection);
  };

  const cantonLabel = SWISS_CANTONS.find(c => c.value === businessCanton)?.label || businessCanton;
  const hasValidLocation = businessPlz.length === 4 && businessCanton;

  const content = (
    <div className="space-y-6">
      {/* Business Location PLZ */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Ihr Standort (PLZ)</Label>
        <div className="grid grid-cols-2 gap-4">
          <PostalCodeInput
            value={businessPlz}
            onValueChange={(plz) => {
              onBusinessPlzChange(plz);
              // Reset city/canton when PLZ changes
              if (plz.length < 4) {
                onAddressSelect({ city: '', canton: '' });
              }
            }}
            onAddressSelect={(address) => {
              onAddressSelect({
                city: address.city,
                canton: address.canton,
              });
            }}
            placeholder="z.B. 8000"
          />
          {businessCity && (
            <div className="flex items-center px-3 py-2 bg-muted rounded-md">
              <span className="text-sm font-medium">{businessCity} ({businessCanton})</span>
            </div>
          )}
        </div>
      </div>

      {/* Radius Selection - only show when PLZ is valid */}
      {hasValidLocation && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Einsatzgebiet</Label>
          <RadioGroup
            value={serviceRadius}
            onValueChange={(value) => onRadiusChange(value as ServiceRadius)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="city" id="radius-city" />
              <Label htmlFor="radius-city" className="flex-1 cursor-pointer">
                <span className="font-medium">Nur meine Stadt</span>
                <span className="text-sm text-muted-foreground ml-2">({businessCity})</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="canton" id="radius-canton" />
              <Label htmlFor="radius-canton" className="flex-1 cursor-pointer">
                <span className="font-medium">Mein Kanton</span>
                <span className="text-sm text-muted-foreground ml-2">({cantonLabel})</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="nationwide" id="radius-nationwide" />
              <Label htmlFor="radius-nationwide" className="flex-1 cursor-pointer">
                <span className="font-medium">Ganze Schweiz</span>
                <span className="text-sm text-muted-foreground ml-2">(Alle Kantone)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="custom" id="radius-custom" />
              <Label htmlFor="radius-custom" className="flex-1 cursor-pointer">
                <span className="font-medium">Mehrere Kantone auswählen</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Custom Canton Selection */}
      {serviceRadius === 'custom' && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <Label className="text-sm font-medium">Kantone auswählen</Label>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {SWISS_CANTONS.map(canton => (
              <Badge
                key={canton.value}
                variant={customCantons.includes(canton.value) ? "default" : "outline"}
                className="cursor-pointer justify-center py-2 text-xs hover:scale-105 transition-transform"
                onClick={() => toggleCustomCanton(canton.value)}
              >
                {canton.value}
                {customCantons.includes(canton.value) && (
                  <CheckCircle className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
          {customCantons.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {customCantons.length} Kanton{customCantons.length > 1 ? 'e' : ''} ausgewählt
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      {hasValidLocation && (
        <Alert className="bg-primary/5 border-primary/20">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            {serviceRadius === 'city' && `Sie erhalten Aufträge aus ${businessCity}`}
            {serviceRadius === 'canton' && `Sie erhalten Aufträge aus dem Kanton ${cantonLabel}`}
            {serviceRadius === 'nationwide' && 'Sie erhalten Aufträge aus der ganzen Schweiz'}
            {serviceRadius === 'custom' && customCantons.length > 0 && `Sie erhalten Aufträge aus ${customCantons.length} Kantonen`}
            {serviceRadius === 'custom' && customCantons.length === 0 && 'Bitte wählen Sie mindestens einen Kanton'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  if (variant === 'inline') {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={`border-2 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Einsatzgebiet
        </CardTitle>
        <CardDescription>
          Wo möchten Sie Aufträge erhalten?
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};
