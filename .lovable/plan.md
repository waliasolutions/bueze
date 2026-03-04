

# Handwerkerverzeichnis: Filter by Business Address Only

## Problem
The canton filter and available cantons logic currently includes `service_areas` alongside `business_canton`. This means a handwerker in Zürich serving all of Switzerland appears in every canton — misleading for a directory that should show where businesses are physically located.

## Changes

**File:** `src/pages/HandwerkerVerzeichnis.tsx`

### 1. Remove `service_areas` from canton filter (line 92)
Change from:
```
hw.business_canton === filterCanton || (hw.service_areas || []).includes(filterCanton)
```
To:
```
hw.business_canton === filterCanton
```

### 2. Remove `service_areas` from available cantons computation (lines 114-124)
Only collect `business_canton` values — remove the `service_areas` loop entirely.

### 3. Remove `service_areas` from the data fetch and interface
Remove `service_areas` from the `select()` call (line 75) and the `PublicHandwerker` interface (line 49) since it's no longer used on this page.

| Area | Change |
|------|--------|
| Interface | Remove `service_areas` field |
| Data fetch | Remove `service_areas` from select |
| Filter logic | Match only on `business_canton` |
| Available cantons | Derive only from `business_canton` |

Three lines of logic removed, zero new code. SSOT: business address is the single source for directory location.

