

# Simplify Handwerker Onboarding Step UI

## Problem

The HandwerkerOnboarding page has **triple-redundant** progress/step information visible simultaneously:

1. **Mobile sticky bar** (top): "Schritt X von Y" + percentage + progress bar + step labels
2. **Card header**: "Handwerkerprofil erstellen" + "Schritt X von Y" + percentage badge + progress bar
3. **Step content header**: Large icon circle + bold title + subtitle description for each step

On a 500px viewport, users see the same step info repeated 3 times, which is confusing and wastes space.

## Canton Auto-Selection for Leads

Confirmed working correctly. In `SubmitLead.tsx`, the `PostalCodeInput.onAddressSelect` callback already sets `form.setValue('canton', address.canton)` automatically when a client enters their PLZ. No changes needed here.

## Plan (1 file)

### `src/pages/HandwerkerOnboarding.tsx`

**1. Remove the redundant Card header section** (lines 1189-1204)
- Remove the `CardHeader` that shows "Handwerkerprofil erstellen", "Schritt X von Y", percentage badge, and duplicate progress bar
- The mobile sticky bar and desktop step indicators already communicate this information

**2. Simplify step content headers** (lines 571-578, 841-848, 962-971)
- Remove the large 56px icon circles at the top of each step
- Keep only a concise `h3` title (no subtitle text since the step labels already describe what each step is)

**3. Remove redundant "optional" alert in services step** (lines 851-856)
- The card descriptions already say "optional" — the alert banner repeats this

After these changes, the hierarchy becomes:
- Mobile: sticky progress bar (compact) → step content
- Desktop: step circles with labels → step content
- No more triple-layered headers

