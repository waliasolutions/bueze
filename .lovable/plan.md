

# Fix: Onboarding Recovery Dialog — Data-Only Restore, No Step Tracking

## Problem

The recovery dialog shows wrong progress because:
1. `currentStep` is saved but meaningless across sessions (auth state changes the step count from 3→2)
2. Progress bar hardcodes `/3` even for authenticated users (2-step flow)
3. Restoring `currentStep` lands users on wrong content when auth state differs from save time

## Fix

### 1. Auto-save: stop saving `currentStep` (lines 243-247)

Remove `currentStep` from `dataToSave`. Only save `formData` and `selectedMajorCategories`. Also remove `currentStep` from the `useEffect` dependency array (line 258).

### 2. Recovery load: ignore `currentStep` (lines 263-301)

- Update the type parameter of `loadVersionedData` to remove `currentStep`
- Remove the `savedProgress` calculation (line 277)
- Simplify `setRecoveryData` — only store `lastSaveTime` (remove `progress`, `currentStep`, `totalSteps`)

**Backward compatibility**: Existing saved data may include `currentStep`. Since we destructure only `formData` and `selectedMajorCategories` from the loaded data, the extra `currentStep` key is simply ignored. Bump `STORAGE_VERSIONS.HANDWERKER_ONBOARDING_DRAFT` from `2` to `3` in `localStorageVersioning.ts` and add a migration that strips `currentStep` from old data, keeping it clean.

### 3. Recovery dialog UI (lines 1400-1413)

Remove:
- Progress bar (`<Progress>`)
- Step counter ("Schritt X von Y")
- `progress`, `currentStep`, `totalSteps` from `recoveryData` state type

Keep:
- "Zuletzt bearbeitet" timestamp (works correctly)
- Fortsetzen / Neu beginnen buttons

### 4. Restore handler: data only (lines 1473-1491)

Remove `setCurrentStep(parsed.currentStep || 1)` — let the component use its natural first step based on current auth state. Only restore `formData` and `selectedMajorCategories`.

### 5. `recoveryData` state shape simplification

Change from `{ progress, lastSaveTime, currentStep, totalSteps }` to just `{ lastSaveTime: string }`. Remove the `Progress` import if no longer used elsewhere in the file.

### 6. Version bump in `localStorageVersioning.ts`

```
HANDWERKER_ONBOARDING_DRAFT: 3
```

Migration `3`: receives old data, returns `{ formData, selectedMajorCategories }` (drops `currentStep`).

## Files Changed

1. **`src/pages/HandwerkerOnboarding.tsx`** — remove step tracking from save/load/restore/dialog
2. **`src/lib/localStorageVersioning.ts`** — bump version to 3

