/**
 * Budget presets (SSOT) — shared between SubmitLead and EditLead.
 * Leads store budget_min/budget_max as integers; the UI only offers these ranges
 * so customers can't enter meaningless spans like 10'000 – 1'000'000.
 */
export interface BudgetPreset {
  value: string;
  label: string;
  min: number | null;
  max: number | null;
}

export const budgetPresets: BudgetPreset[] = [
  { value: 'unknown', label: 'Noch unklar', min: null, max: null },
  { value: 'small', label: 'Unter 1\'000 CHF', min: 0, max: 1000 },
  { value: 'medium', label: '1\'000 - 5\'000 CHF', min: 1000, max: 5000 },
  { value: 'large', label: '5\'000 - 20\'000 CHF', min: 5000, max: 20000 },
  { value: 'xlarge', label: 'Über 20\'000 CHF', min: 20000, max: 100000 },
];

/**
 * Maps a stored budget_min/budget_max pair back to a preset value.
 * Exact matches map directly; legacy free-form ranges (e.g. 10'000 – 1'000'000)
 * map to the preset containing budget_min, so saving normalizes them.
 */
export const findPresetForRange = (
  min: number | null | undefined,
  max: number | null | undefined,
): string => {
  const exact = budgetPresets.find(p => p.min === (min ?? null) && p.max === (max ?? null));
  if (exact) return exact.value;

  const anchor = min ?? max;
  if (anchor == null) return 'unknown';

  const containing = budgetPresets.find(p => p.min !== null && p.max !== null && anchor >= p.min && anchor < p.max);
  if (containing) return containing.value;
  return anchor >= 20000 ? 'xlarge' : 'unknown';
};
