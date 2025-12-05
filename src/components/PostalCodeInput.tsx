import React, { useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { searchByPostalCode } from '@/lib/swissPostalCodes';

interface PostalCodeInputProps {
  value: string;
  onValueChange: (plz: string) => void;
  onAddressSelect?: (address: { city: string; canton: string }) => void;
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
  const lastLookedUp = useRef<string>('');

  // Handle input change
  const handleChange = useCallback((newValue: string) => {
    // Only allow digits
    const cleaned = newValue.replace(/\D/g, '').slice(0, 4);
    onValueChange(cleaned);

    // Auto-lookup canton when 4 digits entered (only once per PLZ)
    if (cleaned.length === 4 && cleaned !== lastLookedUp.current) {
      lastLookedUp.current = cleaned;
      const results = searchByPostalCode(cleaned);
      if (results.length > 0) {
        onAddressSelect?.({
          city: '', // User enters manually
          canton: results[0].canton,
        });
      }
    }
  }, [onValueChange, onAddressSelect]);

  return (
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
  );
};
