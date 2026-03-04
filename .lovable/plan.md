

# Fix Canton Availability to Include Service Area Coverage

## Problem
Currently `availableCantons` only checks `business_canton` — the physical location. Handwerkers with nationwide (`service_areas` contains all 26 cantons) or multi-canton coverage are invisible in cantons they serve but aren't physically located in. Same issue affects the results filter: `matchesCanton` only checks `business_canton`.

## Solution

**File: `src/pages/HandwerkerVerzeichnis.tsx`**

### 1. Fix `availableCantons` memoization (line 104-106)
Extract cantons from both `business_canton` AND `service_areas` (2-letter codes):

```ts
const availableCantons = useMemo(() => {
  const cantonCodes = new Set(CANTON_CODES); // import from cantons.ts
  const result = new Set<string>();
  handwerkers.forEach(hw => {
    if (hw.business_canton) result.add(hw.business_canton);
    (hw.service_areas || []).forEach(area => {
      if (area.length === 2 && cantonCodes.has(area)) result.add(area);
    });
  });
  return result;
}, [handwerkers]);
```

### 2. Fix `matchesCanton` filter (line 82)
When filtering results by canton, also match if the handwerker's `service_areas` includes that canton:

```ts
const matchesCanton = filterCanton === 'all' 
  || hw.business_canton === filterCanton
  || (hw.service_areas || []).includes(filterCanton);
```

### 3. Import `CANTON_CODES`
Add to existing import from `@/config/cantons`.

Two small changes, same file only. This ensures nationwide and multi-canton handwerkers appear in all cantons they cover.

