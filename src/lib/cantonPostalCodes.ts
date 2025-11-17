// Map Swiss cantons to their postal code ranges
export const CANTON_POSTAL_RANGES: Record<string, string[]> = {
  'ZH': ['8000-8999'],
  'BE': ['3000-3999'],
  'LU': ['6000-6459'],
  'UR': ['6460-6491'],
  'SZ': ['6410-6448', '8840-8849'],
  'OW': ['6060-6078'],
  'NW': ['6370-6390'],
  'GL': ['8750-8879'],
  'ZG': ['6300-6340'],
  'FR': ['1630-1798'],
  'SO': ['4500-4719'],
  'BS': ['4000-4059'],
  'BL': ['4100-4497'],
  'SH': ['8200-8262'],
  'AR': ['9000-9043', '9100-9125'],
  'AI': ['9050-9058'],
  'SG': ['9000-9499'],
  'GR': ['7000-7494'],
  'AG': ['5000-5467', '8905-8946'],
  'TG': ['8500-8598'],
  'TI': ['6500-6999'],
  'VD': ['1000-1299', '1400-1489'],
  'VS': ['1890-1991', '3900-3999'],
  'NE': ['2000-2149'],
  'GE': ['1200-1299'],
  'JU': ['2350-2900'],
};

// Canton full names for display
export const CANTON_NAMES: Record<string, string> = {
  'ZH': 'Zürich',
  'BE': 'Bern',
  'LU': 'Luzern',
  'UR': 'Uri',
  'SZ': 'Schwyz',
  'OW': 'Obwalden',
  'NW': 'Nidwalden',
  'GL': 'Glarus',
  'ZG': 'Zug',
  'FR': 'Freiburg',
  'SO': 'Solothurn',
  'BS': 'Basel-Stadt',
  'BL': 'Basel-Landschaft',
  'SH': 'Schaffhausen',
  'AR': 'Appenzell Ausserrhoden',
  'AI': 'Appenzell Innerrhoden',
  'SG': 'St. Gallen',
  'GR': 'Graubünden',
  'AG': 'Aargau',
  'TG': 'Thurgau',
  'TI': 'Tessin',
  'VD': 'Waadt',
  'VS': 'Wallis',
  'NE': 'Neuenburg',
  'GE': 'Genf',
  'JU': 'Jura',
};

/**
 * Get postal code ranges for a canton
 */
export const cantonToPostalCodes = (canton: string): string[] => {
  return CANTON_POSTAL_RANGES[canton] || [];
};

/**
 * Calculate approximate number of postal codes covered by selected cantons
 */
export const calculatePostalCodeCount = (cantons: string[]): number => {
  let total = 0;
  
  cantons.forEach(canton => {
    const ranges = CANTON_POSTAL_RANGES[canton] || [];
    ranges.forEach(range => {
      const [start, end] = range.split('-').map(Number);
      total += (end - start + 1);
    });
  });
  
  return total;
};

/**
 * Check if a postal code belongs to a specific canton
 */
export const isPostalCodeInCanton = (postalCode: string, canton: string): boolean => {
  const ranges = CANTON_POSTAL_RANGES[canton] || [];
  const code = parseInt(postalCode);
  
  return ranges.some(range => {
    const [start, end] = range.split('-').map(Number);
    return code >= start && code <= end;
  });
};

/**
 * Get canton abbreviation from postal code
 */
export const getCantonFromPostalCode = (postalCode: string): string | null => {
  const code = parseInt(postalCode);
  
  for (const [canton, ranges] of Object.entries(CANTON_POSTAL_RANGES)) {
    if (ranges.some(range => {
      const [start, end] = range.split('-').map(Number);
      return code >= start && code <= end;
    })) {
      return canton;
    }
  }
  
  return null;
};

/**
 * Format canton display with ranges
 */
export const formatCantonDisplay = (canton: string): string => {
  const ranges = CANTON_POSTAL_RANGES[canton] || [];
  const name = CANTON_NAMES[canton] || canton;
  
  if (ranges.length === 0) return name;
  if (ranges.length === 1) return `${name} (${ranges[0]})`;
  
  return `${name} (${ranges.join(', ')})`;
};
