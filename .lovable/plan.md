

# Fix: Hero Loading Flash

## Problem

The Hero shows skeleton placeholders while `usePageContent('homepage_hero')` loads. If the query is slow, fails, or the row doesn't exist, users see a flash of grey skeleton blocks before defaults appear. This is unnecessary because `heroDefaults` already provides complete, identical fallback content — there's no reason to show a loading state.

## Root Cause

`Index.tsx` passes `loading={heroLoading}` to `Hero`, which triggers skeleton rendering on every page load. Since defaults are always available and match the CMS content, the skeleton adds latency to the perceived load time with zero benefit.

## Fix

**`src/pages/Index.tsx`**: Remove `heroLoading` — stop passing `loading` prop to `Hero`.

**`src/components/Hero.tsx`**: Remove the `loading` prop, the skeleton branches, and the `loading ? '...' : ctaText` ternary. Always render content immediately using the existing `content?.fields?.X ?? heroDefaults.X` pattern (already in place, lines 33-37). This means:
- First render: defaults show instantly (no flash)
- CMS content arrives: React re-renders with CMS values (seamless swap, usually identical)

Remove the `loading` field from the `HeroProps` interface. Remove all three skeleton blocks (headlines skeleton lines 48-52, CTA "..." on line 79, trust signals skeleton lines 122-126).

## Files Changed

1. **`src/components/Hero.tsx`** — remove `loading` prop and all skeleton/loading branches
2. **`src/pages/Index.tsx`** — remove `heroLoading` variable and `loading` prop from `<Hero>`

