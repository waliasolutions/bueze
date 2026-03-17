

# Fix: Scroll to top when category/canton is clicked in Handwerkerverzeichnis

## Problem
When clicking a category or canton on the Handwerkerverzeichnis browse layer, the view switches from the browse grid to the results list — but the scroll position stays where the user clicked (often near the bottom/footer area). This happens because it's not a route change (no `pathname` change), so the existing `ScrollToTop` component doesn't trigger.

## Solution
Add `window.scrollTo(0, 0)` in the `handleCategoryClick` and `handleCantonClick` handlers in `HandwerkerVerzeichnis.tsx`, and also in `handleBackToBrowse`. This ensures the viewport resets to the top whenever the view switches between browse and results layers.

## Changes

**File: `src/pages/HandwerkerVerzeichnis.tsx`**

- `handleCategoryClick`: add `window.scrollTo(0, 0)` 
- `handleCantonClick`: add `window.scrollTo(0, 0)`
- `handleBackToBrowse`: add `window.scrollTo(0, 0)`
- `handleSearch`: add `window.scrollTo(0, 0)`

4 one-line additions, no new files or dependencies.

