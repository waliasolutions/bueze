import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { lookupAllPlaces, PostalCodeEntry } from '@/lib/swissPostalCodes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface PostalCodeInputProps {
  value: string;
  onValueChange: (plz: string) => void;
  onAddressSelect?: (address: { 
    city: string; 
    canton: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PostalCodeInput: React.FC<PostalCodeInputProps> = ({
  value,
  onValueChange,
  onAddressSelect,
  placeholder = 'z.B. 8000',
  disabled = false,
  className,
}) => {
  const [places, setPlaces] = useState<PostalCodeEntry[]>([]);
  const [showSelect, setShowSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const lastLookedUp = useRef<string>('');

  // Handle input change
  const handleChange = useCallback(async (newValue: string) => {
    // Only allow digits
    const cleaned = newValue.replace(/\D/g, '').slice(0, 4);
    onValueChange(cleaned);

    // Reset selection when PLZ changes
    if (cleaned.length < 4) {
      setShowSelect(false);
      setPlaces([]);
      setSelectedCity('');
      lastLookedUp.current = '';
      return;
    }

    // Auto-lookup when 4 digits entered (only once per PLZ)
    if (cleaned.length === 4 && cleaned !== lastLookedUp.current) {
      lastLookedUp.current = cleaned;
      setIsLoading(true);
      
      try {
        const allPlaces = await lookupAllPlaces(cleaned);
        
        if (allPlaces.length === 1) {
          // Single place - auto-fill immediately
          setPlaces([]);
          setShowSelect(false);
          setSelectedCity(allPlaces[0].city);
          onAddressSelect?.({
            city: allPlaces[0].city,
            canton: allPlaces[0].canton,
            latitude: allPlaces[0].latitude,
            longitude: allPlaces[0].longitude,
          });
        } else if (allPlaces.length > 1) {
          // Multiple places - show selection dropdown
          setPlaces(allPlaces);
          setShowSelect(true);
          // Pre-fill with first option
          setSelectedCity(allPlaces[0].city);
          onAddressSelect?.({
            city: allPlaces[0].city,
            canton: allPlaces[0].canton,
            latitude: allPlaces[0].latitude,
            longitude: allPlaces[0].longitude,
          });
        } else {
          // Invalid PLZ - no matches found
          setPlaces([]);
          setShowSelect(false);
          setSelectedCity('');
        }
      } catch (error) {
        console.error('Error looking up postal code:', error);
        setPlaces([]);
        setShowSelect(false);
      } finally {
        setIsLoading(false);
      }
    }
  }, [onValueChange, onAddressSelect]);

  // Handle place selection from dropdown
  const handlePlaceSelect = useCallback((city: string) => {
    const selected = places.find(p => p.city === city);
    if (selected) {
      setSelectedCity(city);
      onAddressSelect?.({
        city: selected.city,
        canton: selected.canton,
        latitude: selected.latitude,
        longitude: selected.longitude,
      });
    }
  }, [places, onAddressSelect]);

  // Re-lookup when value changes externally (e.g., form reset or initial load)
  useEffect(() => {
    if (value && value.length === 4 && value !== lastLookedUp.current) {
      handleChange(value);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={4}
          className={className}
          type="text"
          inputMode="numeric"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      {showSelect && places.length > 1 && (
        <Select value={selectedCity} onValueChange={handlePlaceSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Ortschaft wählen..." />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {places.map((place, idx) => (
              <SelectItem key={`${place.city}-${idx}`} value={place.city}>
                {place.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
