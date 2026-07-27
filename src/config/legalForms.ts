/**
 * Swiss legal forms — Single Source of Truth for the `company_legal_form` field.
 * Used by registration, the handwerker profile editor and the admin editors.
 */

export const LEGAL_FORM_OPTIONS = [
  { value: 'einzelfirma', label: 'Einzelfirma' },
  { value: 'gmbh', label: 'GmbH' },
  { value: 'ag', label: 'AG' },
  { value: 'kollektivgesellschaft', label: 'Kollektivgesellschaft' },
  { value: 'kommanditgesellschaft', label: 'Kommanditgesellschaft' },
  { value: 'genossenschaft', label: 'Genossenschaft' },
  { value: 'verein', label: 'Verein' },
  { value: 'stiftung', label: 'Stiftung' },
] as const;

export type LegalFormValue = (typeof LEGAL_FORM_OPTIONS)[number]['value'];

export const getLegalFormLabel = (value: string | null | undefined): string =>
  LEGAL_FORM_OPTIONS.find((option) => option.value === value)?.label ?? value ?? '';

/**
 * Zefix reports legal forms as free text (German/French/Italian). Matching is
 * ordered: the compound forms must win over the plain ones they contain
 * (e.g. "Kommanditaktiengesellschaft" is not an "Aktiengesellschaft").
 */
const ZEFIX_LEGAL_FORM_PATTERNS: ReadonlyArray<readonly [RegExp, LegalFormValue]> = [
  [/einzel|individuelle|individuale/i, 'einzelfirma'],
  [/kollektiv|nom collectif|in nome collettivo/i, 'kollektivgesellschaft'],
  [/kommandit|en commandite|in accomandita/i, 'kommanditgesellschaft'],
  [/beschr(ä|ae)nkter haftung|responsabilit(é|e) limit(é|e)e|\bs(à|a)rl\b|\bsagl\b|\bgmbh\b/i, 'gmbh'],
  [/aktiengesellschaft|soci(é|e)t(é|e) anonyme|societ(à|a) anonima|\bag\b|\bsa\b/i, 'ag'],
  [/genossenschaft|coop(é|e)rative|cooperativa/i, 'genossenschaft'],
  [/verein|association|associazione/i, 'verein'],
  [/stiftung|fondation|fondazione/i, 'stiftung'],
];

/**
 * Derive our legal form value from the Zefix legal form name, falling back to
 * the suffix of the company name ("Muster GmbH"). Null when nothing matches.
 */
export function legalFormFromZefix(
  legalFormName: string | null | undefined,
  companyName?: string | null,
): LegalFormValue | null {
  for (const source of [legalFormName, companyName]) {
    if (!source) continue;
    const match = ZEFIX_LEGAL_FORM_PATTERNS.find(([pattern]) => pattern.test(source));
    if (match) return match[1];
  }
  return null;
}
