

# Complete Homepage CMS -- Make All Homepage Sections Editable

## Overview

Transform the homepage from a mostly-hardcoded page to a fully CMS-driven page where admins can edit every visible content section without touching code.

## Current State

| Section | Editable via CMS? | Source |
|---------|-------------------|--------|
| Hero (title, subtitle, CTA, trust signals) | Partially (missing subIntro, badge, trustSignals in editor) | `page_content.homepage_hero` + `contentDefaults.ts` fallback |
| HowItWorks (3 steps) | No | Hardcoded in `HowItWorks.tsx` |
| FAQ (all Q&A) | No | Hardcoded in `FAQ.tsx` |
| Footer (contact info, links) | No | Hardcoded in `Footer.tsx` |

## What Changes

### Phase 1: Database -- New page_content rows for missing sections

Insert 3 new `page_content` rows to store the currently hardcoded content:

1. **`homepage_how_it_works`** (content_type: `homepage`)
   - `fields`: `{ title, subtitle, steps: [{ title, description, highlight? }] }`

2. **`homepage_faq`** (content_type: `homepage`)
   - `fields`: `{ title, subtitle, categories: [{ category, questions: [{ q, a }] }] }`

3. **`homepage_footer`** (content_type: `homepage`)
   - `fields`: `{ companyDescription, email, phone, address, socialLinks: { facebook, instagram }, quickLinks: [{ label, href }] }`

Seed them with the exact content currently hardcoded so nothing changes visually.

### Phase 2: ContentEditor -- Expand homepage editing capabilities

**File: `src/pages/admin/ContentEditor.tsx`**

Current homepage editor only has: title, titleHighlight, subtitle, ctaText.

Add missing fields for `homepage_hero`:
- `subIntro` (Textarea)
- `badge` (Input)
- `trustSignals` -- array editor: list of inputs with add/remove buttons

Add new content type sections:
- **`homepage_how_it_works`**: Title, Subtitle, and a repeatable "Steps" editor (each step has title + description + optional highlight). Add/remove/reorder steps.
- **`homepage_faq`**: Title, Subtitle, and a repeatable "Categories" editor, each category containing a name and repeatable Q&A pairs. Add/remove questions and categories.
- **`homepage_footer`**: Company description, email, phone, address fields. Social links (Facebook URL, Instagram URL). Quick links array editor.

UX improvements to the editor:
- Show save status indicator (unsaved changes dot)
- Disable save button when no changes made
- Add "dirty state" tracking so admin knows when there are unsaved changes
- Collapsible sections for array fields to reduce clutter

### Phase 3: Frontend Components -- Read from CMS

**File: `src/pages/Index.tsx`**
- Fetch `homepage_how_it_works`, `homepage_faq`, `homepage_footer` content alongside existing hero/homepage fetches
- Pass content as props to child components

**File: `src/components/Hero.tsx`**
- Already CMS-driven, no changes needed (subIntro and trustSignals already read from content.fields)

**File: `src/components/HowItWorks.tsx`**
- Accept optional `content` prop with `fields.steps` array
- Fall back to current hardcoded `steps` array if no CMS content
- Render steps dynamically from CMS data
- Icons remain hardcoded (Search, UserCheck, MessageSquare) mapped by index, since icon selection UI is complex and not worth the effort

**File: `src/components/FAQ.tsx`**
- Accept optional `content` prop with `fields.categories` array
- Fall back to current hardcoded `faqData` if no CMS content
- Render FAQ categories and questions dynamically

**File: `src/components/Footer.tsx`**
- Accept optional `content` prop with contact info and links
- Fall back to current hardcoded values if no CMS content
- Render email, phone, address, social links, quick links from CMS

### Phase 4: Content Defaults Update

**File: `src/config/contentDefaults.ts`**
- Add `howItWorksDefaults`, `faqDefaults`, `footerDefaults` matching the seeded database content
- These serve as fallbacks if CMS fetch fails, preventing blank sections

## Content Sync Strategy

- All content uses React Query with 5-minute `staleTime` (existing pattern via `usePageContent`)
- After admin saves, the `updated_at` timestamp changes; next page load picks up new data
- No real-time subscription needed -- 5-minute cache is acceptable for content that changes infrequently
- Admin can verify changes by opening the site in a new tab after saving

## Technical Details

### Array Editor Component

A new reusable component `ArrayFieldEditor` for editing arrays of items (trust signals, FAQ questions, steps):

```text
Props:
  - items: any[]
  - onUpdate: (items: any[]) => void
  - renderItem: (item, index, onChange) => ReactNode
  - addLabel: string
  - maxItems?: number

Features:
  - Add item button at bottom
  - Remove button per item
  - Drag handle for reorder (stretch goal -- can use simple up/down arrows initially)
  - Collapsible items for long content
```

### Dirty State Tracking

Track `initialContent` vs `currentContent` via JSON comparison. Show:
- Orange dot next to "Speichern" button when unsaved changes exist
- "Ungespeicherte Änderungen" text warning
- Browser beforeunload warning if navigating away with unsaved changes

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| Database migration | INSERT | Seed 3 new page_content rows |
| `src/pages/admin/ContentEditor.tsx` | MODIFY | Add all missing field editors, array editors, dirty state |
| `src/pages/Index.tsx` | MODIFY | Fetch 3 additional page_content rows, pass as props |
| `src/components/HowItWorks.tsx` | MODIFY | Accept CMS content prop, render dynamically |
| `src/components/FAQ.tsx` | MODIFY | Accept CMS content prop, render dynamically |
| `src/components/Footer.tsx` | MODIFY | Accept CMS content prop for contact/links |
| `src/config/contentDefaults.ts` | MODIFY | Add defaults for howItWorks, faq, footer |

### What Does NOT Change

- Major categories remain in `majorCategories.ts` for now (database-driven categories is a separate phase)
- Category landing pages remain as-is
- HandwerkerLanding page remains hardcoded (separate phase)
- RLS policies on `page_content` table remain unchanged (admin-only write access already exists)
- Design system and styling remain consistent

### Edge Cases Handled

- Empty CMS data: falls back to hardcoded defaults
- Partial CMS data: merges with defaults field-by-field
- Admin deletes all FAQ items: shows empty state with "add" button
- Long text in steps/FAQ: textarea with auto-grow
- Concurrent edits: last-write-wins (acceptable for single-admin scenario)

