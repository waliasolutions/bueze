

# Changes Overview

Four changes across two files.

## 1. HandwerkerVerzeichnis card cleanup (`src/pages/HandwerkerVerzeichnis.tsx`)

- **Remove bio/description block** (lines 429-433): Delete the `hw.bio` paragraph entirely.
- **Always show full company name** (line 392-393): Remove `truncate` class from `h3` so company names always display in full.
- **Remove Shield icon** (lines 403-405): Delete the verified shield icon since all listed profiles are already filtered to `is_verified = true`. Also remove `Shield` from the lucide import.

## 2. Navigation: "Für Handwerker" dropdown with "Preise" (`src/components/Header.tsx`)

Currently "Für Handwerker" and "Preise" are separate top-level nav items. Changes:

- **Merge into dropdown**: Remove "Preise" as a standalone nav item. Turn "Für Handwerker" into a dropdown menu containing:
  - "Übersicht" → `/handwerker`
  - "Preise" → `/pricing`
- **Visual encirclement**: Add a border/ring style to the "Für Handwerker" trigger button (e.g. `border border-brand-600 rounded-full px-3 py-1`) to visually distinguish it.
- **Desktop**: Use existing `DropdownMenu` component (already imported).
- **Mobile**: Render both sub-links indented under "Für Handwerker" heading in the slide-out menu.
- **SSOT**: Define the dropdown items as a structure in `navItems` (e.g. `children` array) so both desktop and mobile menus render from the same data.

### navItems structure change
```ts
const navItems = [
  { label: 'So funktioniert es', href: '/#how-it-works' },
  { label: 'Kategorien', href: '/kategorien' },
  { label: 'Handwerker finden', href: '/handwerker-verzeichnis' },
  { label: 'Für Handwerker', href: '/handwerker', highlight: true, children: [
    { label: 'Übersicht', href: '/handwerker' },
    { label: 'Preise', href: '/pricing' },
  ]},
];
```

Both desktop and mobile rendering loops will check for `children` to render a dropdown or nested list respectively.

