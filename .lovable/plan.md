

# Show Full Lead Content on Arrow Expand

## What's Changing

Currently, when clicking the expand arrow on a lead row in Admin "Aufträge", the expanded section only shows "Eingereichte Offerten" (submitted proposals). The lead's actual description/message is not visible unless clicking the Eye icon for details.

After this change, the expanded section will show the **full lead description** first, followed by the proposals section below it.

## Implementation

### File: `src/pages/admin/AdminLeadsManagement.tsx`

Update the `CollapsibleContent` section (lines 583-646) to add the lead description above the proposals:

**Add before "Eingereichte Offerten":**
- A "Beschreibung" (Description) section showing `lead.description` in full, with no line-clamp
- If the lead has `media_urls`, show a count/links indicator
- On mobile: stack vertically with proper spacing
- On desktop: full-width text block

**Layout of expanded section after fix:**

```text
+--------------------------------------------------+
| Beschreibung                                      |
| [Full lead description text, no truncation]       |
|                                                   |
| Eingereichte Offerten (3)                         |
| [Proposal cards as they are today]                |
+--------------------------------------------------+
```

### Responsive Considerations
- The description block uses `whitespace-pre-wrap` and `break-words` so long text wraps properly on all screen sizes
- The existing proposal grid (`grid-cols-1 md:grid-cols-4`) already handles mobile layout
- No changes needed to the table's `min-w-[1000px]` -- the expanded row already spans `colSpan={11}` and flows naturally

### What stays the same
- The Eye icon detail dialog remains unchanged
- Proposal cards layout is unchanged
- Filter/search functionality is unchanged
- All action buttons remain the same

## Technical Details

Single file change in `src/pages/admin/AdminLeadsManagement.tsx`, lines 586-587. Insert a description block between the opening `div.p-4` and the "Eingereichte Offerten" heading. The `lead.description` field is already available in the data (fetched in `fetchLeads` via `select("*")`).
