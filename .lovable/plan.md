

# Show Downloadable Attachments in Expanded Lead Row

## What's Changing

Replace the current text-only attachment indicator ("📎 2 Anhang/Anhänge") in the expanded lead row with actual clickable, downloadable media previews -- matching the pattern already used in the Eye icon detail dialog.

## Implementation

### File: `src/pages/admin/AdminLeadsManagement.tsx`

Replace lines 591-595 (the current `📎 count` indicator) with a grid of image thumbnails that link to the original file for download.

**Updated layout of the attachment section:**

```text
+--------------------------------------------------+
| Beschreibung                                      |
| [Full lead description text]                      |
|                                                   |
| Anhänge (2)                                       |
| [thumb1.jpg]  [thumb2.jpg]   <- clickable/download|
|                                                   |
| Eingereichte Offerten (3)                         |
| [Proposal cards]                                  |
+--------------------------------------------------+
```

**Details:**
- Show a "Anhänge (n)" heading when `media_urls` has items
- Render a responsive grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`) of thumbnails
- Each thumbnail is wrapped in an `<a href={url} target="_blank" rel="noopener noreferrer" download>` so clicking opens/downloads the file
- Add a small download icon overlay on each thumbnail for clarity
- Images use `object-cover`, `rounded-lg`, and a fixed height (`h-24 md:h-32`) for consistency
- For non-image URLs (e.g., PDFs), show a file icon placeholder with the filename

### Responsive Considerations
- On mobile (1 column or 2 columns): thumbnails stack cleanly
- On desktop: up to 4 thumbnails per row
- The download link works on all devices

### What stays the same
- The Eye icon detail dialog media section is unchanged
- Proposal cards remain unchanged
- No new dependencies needed

## Technical Details

Single file change in `src/pages/admin/AdminLeadsManagement.tsx`, lines 591-595. Replace the emoji indicator with a thumbnail grid using an `<a>` tag with `download` attribute. The `lead.media_urls` array contains public Supabase Storage URLs that are already directly accessible.
