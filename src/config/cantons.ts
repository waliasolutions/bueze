/**
 * Complete list of all 26 Swiss cantons
 * Single Source of Truth for canton data across the application
 */
export const SWISS_CANTONS = [
  { value: 'AG', label: 'Aargau' },
  { value: 'AI', label: 'Appenzell Innerrhoden' },
  { value: 'AR', label: 'Appenzell Ausserrhoden' },
  { value: 'BE', label: 'Bern' },
  { value: 'BL', label: 'Basel-Landschaft' },
  { value: 'BS', label: 'Basel-Stadt' },
  { value: 'FR', label: 'Freiburg' },
  { value: 'GE', label: 'Genf' },
  { value: 'GL', label: 'Glarus' },
  { value: 'GR', label: 'Graubünden' },
  { value: 'JU', label: 'Jura' },
  { value: 'LU', label: 'Luzern' },
  { value: 'NE', label: 'Neuenburg' },
  { value: 'NW', label: 'Nidwalden' },
  { value: 'OW', label: 'Obwalden' },
  { value: 'SG', label: 'St. Gallen' },
  { value: 'SH', label: 'Schaffhausen' },
  { value: 'SO', label: 'Solothurn' },
  { value: 'SZ', label: 'Schwyz' },
  { value: 'TG', label: 'Thurgau' },
  { value: 'TI', label: 'Tessin' },
  { value: 'UR', label: 'Uri' },
  { value: 'VD', label: 'Waadt' },
  { value: 'VS', label: 'Wallis' },
  { value: 'ZG', label: 'Zug' },
  { value: 'ZH', label: 'Zürich' },
] as const;

export type CantonCode = typeof SWISS_CANTONS[number]['value'];

export const CANTON_CODES = SWISS_CANTONS.map(c => c.value);

export const getCantonLabel = (code: string): string => {
  return SWISS_CANTONS.find(c => c.value === code)?.label || code;
};

export const getCantonByCode = (code: string) => {
  return SWISS_CANTONS.find(c => c.value === code);
};
