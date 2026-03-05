

# Plan: Shared Display Formatters — Phone, URL, Address (Revised)

## Problem

Phone numbers, URLs, and addresses are rendered raw from the DB with no formatting. URL protocol handling is duplicated 3 different ways. Address assembly is inconsistent across 4+ components.

---

## New file: `src/lib/displayFormatters.ts`

Four pure functions:

### `formatPhoneDisplay(phone: string): string`
- Strip non-digit chars (except leading `+`)
- Only normalize if **eindeutig Swiss**: starts with `+41`, `0041`, or `07x` (single leading zero followed by digit 1-9)
- Swiss → format as `+41 XX XXX XX XX`
- Non-Swiss (`+49`, `+43`, `+33`, etc.) → return trimmed original, no transformation
- Empty/null-safe

### `formatPhoneHref(phone: string): string`
- Same Swiss detection logic
- Swiss → `tel:+41XXXXXXXXX`
- Non-Swiss → `tel:` + digits only

### `formatWebsiteUrl(url: string): string`
- If empty → `''`
- If already has `http://` or `https://` → return as-is
- Otherwise → prepend `https://`
- Single implementation replacing 3 variants

### `formatAddress(parts: { street?, zip?, city?, canton? }): string`
- Format: `Strasse, PLZ Ort (Kanton)`
- Canton shown as abbreviation in parentheses (consistent with Swiss convention)
- Gracefully handles missing parts

---

## Files to update

| File | What changes |
|------|-------------|
| `src/lib/displayFormatters.ts` | **New** — 4 functions |
| `src/components/ReceivedProposals.tsx` (lines 536-590) | `formatPhoneDisplay` for display, `formatPhoneHref` for tel:, `formatWebsiteUrl` for href, `formatAddress` for address block |
| `src/components/HandwerkerProfileModal.tsx` (lines 99-106, 275-284) | Replace `getLocation()` with `formatAddress`, replace website onClick with `formatWebsiteUrl` |
| `src/components/ProfilePreview.tsx` (lines 134-157) | `formatPhoneDisplay`+`formatPhoneHref` for phone, `formatWebsiteUrl` for website (currently missing protocol — bug), `formatAddress` for address |
| `src/pages/admin/HandwerkerManagement.tsx` (line 767-769, 791-794) | `formatPhoneDisplay`+`formatPhoneHref` for phone, `formatAddress` for city+canton |
| `src/pages/HandwerkerVerzeichnis.tsx` (line 437-440) | `formatPhoneDisplay`+`formatPhoneHref` for phone |
| `src/pages/ProposalsManagement.tsx` (lines 434-479) | `formatPhoneDisplay`, `formatPhoneHref`, `formatWebsiteUrl` |
| `src/pages/HandwerkerDashboard.tsx` (line 1514-1515) | `formatPhoneDisplay`+`formatPhoneHref` for client phone |
| `src/pages/LeadDetails.tsx` (line 457-458) | `formatPhoneDisplay`+`formatPhoneHref` |
| `src/pages/admin/ClientManagement.tsx` (line 452-454) | `formatPhoneDisplay`+`formatPhoneHref` |
| `src/components/Footer.tsx` (line 60) | Already strips spaces for tel: — can use `formatPhoneHref` for consistency |

---

## Phone detection logic (defensive, per feedback)

```typescript
function isSwissNumber(digits: string): boolean {
  // +41... or 0041...
  if (digits.startsWith('41') && digits.length >= 11) return true;
  // 07x... (local mobile format)
  if (/^0[1-9]\d{8}$/.test(digits)) return true;
  return false;
}
```

Numbers starting with `0049`, `0033`, `0043` will NOT be caught as Swiss — their leading `00` gets stripped to `49`, `33`, `43` which don't match `41` or `0[1-9]`.

---

## Summary

| # | Action | Effort |
|---|--------|--------|
| 1 | Create `displayFormatters.ts` | 5 min |
| 2 | Update 10 components/pages | 15 min |

Zero new dependencies. All inline formatting replaced with SSOT calls.

