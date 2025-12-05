import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { searchByPostalCode, PostalCodeEntry } from '@/lib/swissPostalCodes';

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
  // Handle input change
  const handleChange = (newValue: string) => {
    // Only allow digits
    const cleaned = newValue.replace(/\D/g, '').slice(0, 4);
    onValueChange(cleaned);
  };

  // Auto-lookup when 4 digits are entered
  useEffect(() => {
    if (value.length === 4) {
      const results = searchByPostalCode(value);
      if (results.length > 0) {
        onAddressSelect?.({
          city: results[0].name, // Will be empty - user enters manually
          canton: results[0].canton,
        });
      }
    }
  }, [value, onAddressSelect]);

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
