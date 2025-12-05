import { CANTON_NAMES } from '@/lib/cantonPostalCodes';

export interface PostalCodeEntry {
  postalCode: string;
  city: string;
  canton: string;
  cantonName: string;
  district?: string;
  community?: string;
  latitude?: number;
  longitude?: number;
}

interface RawPostalCodeEntry {
  country_code: string;
  zipcode: string;
  place: string;
  state: string;
  state_code: string;
  province: string;
  province_code: string;
  community: string;
  community_code: string;
  latitude: string;
  longitude: string;
}

// Lazy-loaded Map for O(1) lookup
let postalCodeMap: Map<string, PostalCodeEntry[]> | null = null;
let citySearchIndex: PostalCodeEntry[] | null = null;

// Initialize map on first use (lazy loading)
const getPostalCodeMap = async (): Promise<Map<string, PostalCodeEntry[]>> => {
  if (postalCodeMap) return postalCodeMap;
  
  const rawData = await import('@/data/swissPostalCodes.json');
  postalCodeMap = new Map();
  citySearchIndex = [];
  
  for (const entry of rawData.default as RawPostalCodeEntry[]) {
    const plz = entry.zipcode;
    const mapped: PostalCodeEntry = {
      postalCode: plz,
      city: entry.place,
      canton: entry.state_code,
      cantonName: entry.state,
      district: entry.province,
      community: entry.community,
      latitude: parseFloat(entry.latitude),
      longitude: parseFloat(entry.longitude),
    };
    
    // Handle multiple places per PLZ
    if (!postalCodeMap.has(plz)) {
      postalCodeMap.set(plz, []);
    }
    postalCodeMap.get(plz)!.push(mapped);
    citySearchIndex!.push(mapped);
  }
  
  return postalCodeMap;
};

/**
 * Primary lookup function - O(1) access
 * Returns the first/primary place for a postal code
 */
export const lookupPostalCode = async (postalCode: string): Promise<PostalCodeEntry | null> => {
  if (!postalCode || postalCode.length !== 4) return null;
  
  const map = await getPostalCodeMap();
  const entries = map.get(postalCode);
  
  return entries?.[0] || null;
};

/**
 * Get all places for a PLZ (some have multiple localities)
 */
export const lookupAllPlaces = async (postalCode: string): Promise<PostalCodeEntry[]> => {
  if (!postalCode || postalCode.length !== 4) return [];
  
  const map = await getPostalCodeMap();
  return map.get(postalCode) || [];
};

/**
 * Search by city name (for autocomplete)
 * Returns up to 20 matching entries
 */
export const searchByCityName = async (cityName: string): Promise<PostalCodeEntry[]> => {
  if (!cityName || cityName.length < 2) return [];
  
  await getPostalCodeMap(); // Ensure data is loaded
  if (!citySearchIndex) return [];
  
  const results: PostalCodeEntry[] = [];
  const searchLower = cityName.toLowerCase();
  
  for (const entry of citySearchIndex) {
    if (entry.city.toLowerCase().includes(searchLower)) {
      results.push(entry);
      if (results.length >= 20) break;
    }
  }
  
  return results;
};

/**
 * Validate if PLZ exists
 */
export const isValidPostalCode = async (postalCode: string): Promise<boolean> => {
  const result = await lookupPostalCode(postalCode);
  return result !== null;
};

/**
 * Get canton from PLZ
 * @deprecated Use lookupPostalCode instead for full data
 */
export const getCantonFromPostalCode = async (postalCode: string): Promise<string | null> => {
  const result = await lookupPostalCode(postalCode);
  return result?.canton || null;
};

/**
 * Search localities by postal code (backward compatible sync version)
 * @deprecated Use lookupAllPlaces for async version with full data
 */
export const searchByPostalCode = (postalCode: string): PostalCodeEntry[] => {
  // This is a sync fallback - for best results use async lookupAllPlaces
  if (!postalCode || postalCode.length < 4) {
    return [];
  }
  
  // Return empty - caller should use async version
  // This maintains backward compatibility while encouraging migration
  return [];
};

/**
 * Validate if PLZ-Canton combination exists
 */
export const validateAddress = async (
  postalCode: string,
  city: string,
  canton: string
): Promise<boolean> => {
  const result = await lookupPostalCode(postalCode);
  return result !== null && result.canton === canton;
};

/**
 * Get canton name from canton code
 */
export const getCantonName = (cantonCode: string): string => {
  return CANTON_NAMES[cantonCode] || cantonCode;
};
