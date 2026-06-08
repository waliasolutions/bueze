
# Batch 1 — Mobile Overflow Audit: Index Route

Scope is strictly the public homepage (`/`) shell and its sections. No visual changes, no design tokens touched. Every fix targets a root cause (box model, flex/grid constraints, viewport math); no blanket `overflow-x-hidden` on parents.

## 1. Install the dev-only overflow detector (SSOT)

New file:

- `src/hooks/useOverflowDetector.ts` — exactly the hook from my previous message. Guarded by `import.meta.env.DEV` so Vite tree-shakes it from production bundles. Uses `requestAnimationFrame` + `MutationObserver` + `resize` listener. Outlines offenders in magenta and logs them grouped in the console with pixel overflow amounts.

Mount once at the app root:

- `src/App.tsx` — add `useOverflowDetector();` call inside the top-level component body. No JSX change, no provider wrapping.

This stays inert in production (no listeners attached, no DOM scans).

## 2. Audit targets for this batch

Read-only inspection, then minimal surgical edits, on:

```text
src/pages/Index.tsx
src/components/Header.tsx
src/components/Hero.tsx
src/components/HowItWorks.tsx
src/components/FAQ.tsx
src/components/Footer.tsx
src/components/MobileStickyFooter.tsx
src/index.css            (read-only verification; no token edits)
tailwind.config.ts       (read-only verification)
```

## 3. What I will look for (root-cause checklist)

For each file in scope I will grep + visually verify each of these and only patch confirmed offenders:

1. `w-screen` / `min-w-screen` / `100vw` usage → replace with `w-full` unless the element is a true viewport-pinned overlay anchored to `left-0 right-0`.
2. Decorative `absolute` / `fixed` elements (blurs, gradients, blobs) lacking a `relative overflow-hidden` bounding ancestor scoped to that decoration only (never the page shell).
3. Flex/grid children carrying long strings (emails, URLs, German compound words) without `min-w-0` on the flex child and `break-words` / `truncate` on the text node.
4. Hardcoded pixel widths (`w-[Npx]`, `min-w-[Npx]`) that exceed 320px on mobile-rendered elements → swap to `w-full max-w-[Npx]`.
5. Negative margins (`-mx-*`, `-ml-*`, `-mr-*`) not balanced by a padded parent — common in `Header` containers and section wrappers.
6. Grid templates with fixed `minmax(Npx, ...)` larger than 320px on mobile.
7. `MobileStickyFooter` fixed positioning: confirm `left-0 right-0` (not `w-screen`) and that inner padding respects `env(safe-area-inset-*)` without pushing children past viewport.
8. Header nav: confirm logo + nav row uses `min-w-0` on the shrinking child and `truncate` on brand text if applicable.
9. Long German strings in Hero headline and FAQ questions: ensure word-break behavior does not require horizontal scroll at 320px.

## 4. Fix policy

- Smallest possible diff per offender.
- Prefer Tailwind utilities already in the project; no new tokens, no new variants.
- `overflow-x-hidden` only allowed on the specific decorative container that owns the bleeding element (e.g., the Hero section's own `relative` wrapper), never on `html`, `body`, `#root`, `main`, or layout shells. Each such use will carry an inline comment justifying why the box model cannot be fixed.
- No changes to spacing scale, font sizes, colors, or breakpoints.

## 5. Verification

After edits I will:

1. Open the preview at 320, 360, 375, 390, 412, 430, 768, 820, 1024, 1280, 1440 (portrait) and 667×375, 844×390 (landscape) using `browser--view_preview`.
2. Confirm `document.documentElement.scrollWidth === document.documentElement.clientWidth` via console.
3. Confirm the overflow detector logs zero offenders on the Index route at every breakpoint above.
4. Visually diff against the current design at 375px and 1280px to confirm zero visual regression.

## 6. Out of scope for this batch

- All authenticated routes, admin shell, lead/proposal flows, onboarding, auth pages, legal pages, category landing pages. Those will be addressed in subsequent batches in this order: Dashboard → BrowseLeads/OpportunityView → SubmitLead → Admin shell → Auth/Onboarding → Legal/Category landings.

## Deliverable for this batch

- 1 new file: `src/hooks/useOverflowDetector.ts`
- 1 edit: `src/App.tsx` (single hook call)
- 0–N surgical edits across the seven Index-route component files, listed explicitly in the implementation summary with before/after Tailwind class diffs.
