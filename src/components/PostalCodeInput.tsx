import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchByPostalCode, PostalCodeEntry } from '@/lib/swissPostalCodes';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

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
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PostalCodeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search function
  const debouncedSearch = useDebouncedCallback(async (searchValue: string) => {
    if (searchValue.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchByPostalCode(searchValue);
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch (error) {
      console.error('Error searching postal codes:', error);
      setSuggestions([]);
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  // Handle input change
  const handleChange = (newValue: string) => {
    // Only allow digits
    const cleaned = newValue.replace(/\D/g, '').slice(0, 4);
    onValueChange(cleaned);
    
    if (cleaned.length >= 2) {
      debouncedSearch(cleaned);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };

  // Handle selection
  const handleSelect = (entry: PostalCodeEntry) => {
    onValueChange(entry.postalCode);
    onAddressSelect?.({
      city: entry.name,
      canton: entry.canton,
    });
    setOpen(false);
  };

  // Auto-lookup when 4 digits are entered
  useEffect(() => {
    if (value.length === 4 && !open) {
      searchByPostalCode(value).then(results => {
        if (results.length === 1) {
          onAddressSelect?.({
            city: results[0].name,
            canton: results[0].canton,
          });
        } else if (results.length > 1) {
          setSuggestions(results);
          setOpen(true);
        }
      });
    }
  }, [value]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
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
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandList>
              {suggestions.length === 0 ? (
                <CommandEmpty>Keine PLZ gefunden</CommandEmpty>
              ) : (
                <CommandGroup>
                  {suggestions.map((entry, index) => (
                    <CommandItem
                      key={`${entry.postalCode}-${entry.name}-${index}`}
                      value={`${entry.postalCode}-${entry.name}`}
                      onSelect={() => handleSelect(entry)}
                      className="cursor-pointer"
                    >
                      <Check className={cn(
                        "mr-2 h-4 w-4",
                        value === entry.postalCode ? "opacity-100" : "opacity-0"
                      )} />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {entry.postalCode} {entry.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {entry.canton}
                          {entry.commune && ` • ${entry.commune}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
