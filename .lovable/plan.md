

# Add Google Ads gtag.js globally via GlobalScriptManager

## Approach

The project already has `GlobalScriptManager.tsx` as the SSOT for third-party script injection — used on every page via `App.tsx`. The Google Ads tag will be added there, respecting cookie consent (marketing consent, since this is an advertising tag).

## Change

**File: `src/components/GlobalScriptManager.tsx`**

Add a new block after the GTM injection that:
1. Checks marketing cookie consent (`consent.marketing === true`)
2. Injects the gtag.js loader script (`https://www.googletagmanager.com/gtag/js?id=AW-18090737196`)
3. Injects the inline gtag config script
4. Uses a `data-gtag-ads` attribute to prevent duplicate injection
5. Also handles the consent-change listener to reload if marketing consent is newly granted

The Google Ads ID (`AW-18090737196`) will be hardcoded since it's a platform-owned tag, not a per-tenant setting like the GTM container ID.

## Why marketing consent (not analytics)

Google Ads conversion tracking is advertising/marketing functionality. The cookie banner already distinguishes `analytics` and `marketing` categories. Using `marketing` is legally correct and consistent with the consent model.

## Files changed: 1 · New files: 0

