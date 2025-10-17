import { captureException } from '@/lib/errorTracking';

export interface PostalCodeEntry {
  postalCode: string;
  name: string; // City name
  canton: string;
  district?: string;
  commune?: string;
}

export interface OpenPLZLocality {
  key: string;
  name: string;
  postalCode: string;
  commune: {
    key: string;
    name: string;
    district: {
      key: string;
      name: string;
      canton: {
        key: string;
        name: string;
      };
    };
  };
}

const OPENPLZ_API_BASE = 'https://openplzapi.org';

/**
 * Search localities by postal code using OpenPLZ API
 * @param postalCode - Swiss postal code (PLZ)
 * @returns Array of matching localities
 */
export const searchByPostalCode = async (
  postalCode: string
): Promise<PostalCodeEntry[]> => {
  try {
    const response = await fetch(
      `${OPENPLZ_API_BASE}/ch/Localities?postalCode=${postalCode}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenPLZ API error: ${response.status}`);
    }

    const data: OpenPLZLocality[] = await response.json();

    return data.map(locality => ({
      postalCode: locality.postalCode,
      name: locality.name,
      canton: locality.commune.district.canton.key,
      district: locality.commune.district.name,
      commune: locality.commune.name,
    }));
  } catch (error) {
    captureException(error as Error, { context: 'searchByPostalCode' });
    return [];
  }
};

/**
 * Search localities by city name using OpenPLZ API
 * @param cityName - City name to search
 * @returns Array of matching localities
 */
export const searchByCityName = async (
  cityName: string
): Promise<PostalCodeEntry[]> => {
  try {
    const response = await fetch(
      `${OPENPLZ_API_BASE}/ch/Localities?name=${encodeURIComponent(cityName)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenPLZ API error: ${response.status}`);
    }

    const data: OpenPLZLocality[] = await response.json();

    return data.map(locality => ({
      postalCode: locality.postalCode,
      name: locality.name,
      canton: locality.commune.district.canton.key,
      district: locality.commune.district.name,
      commune: locality.commune.name,
    }));
  } catch (error) {
    captureException(error as Error, { context: 'searchByCityName' });
    return [];
  }
};

/**
 * Lookup postal code and return first match
 */
export const lookupPostalCode = async (
  postalCode: string
): Promise<PostalCodeEntry | null> => {
  const results = await searchByPostalCode(postalCode);
  return results.length > 0 ? results[0] : null;
};

/**
 * Validate if PLZ-City-Canton combination exists
 */
export const validateAddress = async (
  postalCode: string,
  city: string,
  canton: string
): Promise<boolean> => {
  const results = await searchByPostalCode(postalCode);
  
  return results.some(
    result =>
      result.name.toLowerCase() === city.toLowerCase() &&
      result.canton === canton
  );
};
