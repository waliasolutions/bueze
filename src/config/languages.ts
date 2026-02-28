/**
 * SSOT for supported languages across the platform
 */

export interface Language {
  value: string;
  label: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Französisch' },
  { value: 'it', label: 'Italienisch' },
  { value: 'en', label: 'Englisch' },
];

/**
 * Get display label for a language code
 */
export function getLanguageLabel(code: string): string {
  return SUPPORTED_LANGUAGES.find(l => l.value === code)?.label || code;
}
