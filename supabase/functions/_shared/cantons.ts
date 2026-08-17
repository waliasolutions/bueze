/**
 * SSOT (edge runtime) for canton/region codes and service-area coverage.
 * Mirrors src/config/cantons.ts + src/lib/serviceAreaHelpers.ts.
 * Deno cannot import from src/, so this file is the single shared copy for all edge functions.
 */

/** The 26 Swiss canton codes (excludes the Principality of Liechtenstein) */
export const SWISS_ONLY_CANTON_CODES = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE',
  'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH',
] as const;

/** All selectable regions: 26 Swiss cantons + Principality of Liechtenstein */
export const CANTON_CODES = [...SWISS_ONLY_CANTON_CODES, 'FL'] as const;

/** Does an areas array cover all 26 Swiss cantons (= nationwide)? */
export const isNationwideCoverage = (areas: string[]): boolean =>
  SWISS_ONLY_CANTON_CODES.every((code) => areas.includes(code));

/**
 * Does a stored service_areas array cover a given canton/region?
 * Nationwide coverage also serves the Principality of Liechtenstein.
 */
export const coversCanton = (areas: string[] | null | undefined, canton: string): boolean => {
  if (!areas || areas.length === 0) return false;
  if (areas.includes(canton)) return true;
  return canton === 'FL' && isNationwideCoverage(areas);
};
