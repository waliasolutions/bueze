import { getCantonFromPostalCode, CANTON_NAMES } from '@/lib/cantonPostalCodes';

export interface PostalCodeEntry {
  postalCode: string;
  name: string;
  canton: string;
  district?: string;
  commune?: string;
}

/**
 * Search localities by postal code using local canton data
 * @param postalCode - Swiss postal code (PLZ)
 * @returns Array of matching localities
 */
export const searchByPostalCode = (postalCode: string): PostalCodeEntry[] => {
  if (!postalCode || postalCode.length < 4) {
    return [];
  }

  const canton = getCantonFromPostalCode(postalCode);
  if (!canton) {
    return [];
  }

  return [{
    postalCode,
    name: '', // City name to be entered manually by user
    canton,
  }];
};

/**
 * Search localities by city name - not supported with local data
 * @param cityName - City name to search
 * @returns Empty array (city search not available)
 */
export const searchByCityName = (cityName: string): PostalCodeEntry[] => {
  // City search not supported with local data
  return [];
};

/**
 * Lookup postal code and return first match
 */
export const lookupPostalCode = (postalCode: string): PostalCodeEntry | null => {
  const results = searchByPostalCode(postalCode);
  return results.length > 0 ? results[0] : null;
};

/**
 * Validate if PLZ-Canton combination exists
 */
export const validateAddress = (
  postalCode: string,
  city: string,
  canton: string
): boolean => {
  const result = lookupPostalCode(postalCode);
  return result !== null && result.canton === canton;
};

/**
 * Get canton name from canton code
 */
export const getCantonName = (cantonCode: string): string => {
  return CANTON_NAMES[cantonCode] || cantonCode;
};
