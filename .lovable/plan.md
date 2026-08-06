# Fix: Profil-Bearbeiten "closes by itself" when uploading a logo

Reported by Edgar Mkrtchyan (Art Multiservices, MKRTCHYAN — profile is `approved`, `logo_url` is still empty, so no logo ever landed). The page he uses is `src/pages/HandwerkerProfileEdit.tsx`.

## What the code review shows

Three confirmed weaknesses on that page, all of which look to a user like "the page closes without reason":

1. **Blank screen instead of an error.** If the initial load throws (mobile network hiccup, slow request), the catch block only fires a toast and leaves `profile` at `null`; the component then returns `null` — a fully empty page.
2. **Hard redirect on any auth hiccup.** The page calls `supabase.auth.getUser()` (a network call) once on mount and redirects to `/auth` as soon as it returns no user. On iOS, opening the photo picker suspends/reloads the tab; coming back with a not-yet-refreshed session sends the user off the page instantly.
3. **Logo/portfolio/document uploads bypass the shared upload pipeline.** `handleLogoUpload` and `handleImageUpload` are hand-rolled: raw original file, no compression, hard 5MB reject, `fileExt` taken from the filename. An iPhone photo (5–15MB, HEIC) therefore either gets rejected or is pushed uncompressed over a mobile connection, which is exactly where Safari kills the tab. The project already has an SSOT for this (`compressToWebP` + the `uploadLeadMedia` pattern in `src/lib/fileUpload.ts`), used for lead media and proposal attachments but not here.

## Plan

### 1. Confirm the failure on the real page (before changing behaviour)
Drive the profile-edit page in a headless browser with the craftsman's session, upload an oversized iPhone-style image, and capture console + network output. This tells us which of the three paths actually fired for him instead of guessing.

### 2. Route logo uploads through the existing upload SSOT
Extend `src/lib/fileUpload.ts` with one `uploadHandwerkerImage(file, userId, kind)` function that reuses the existing validate → `compressToWebP` → upload → publicUrl flow (bucket `handwerker-portfolio`, `contentType` set, deterministic `logo.webp` path with `upsert: true` for the logo, timestamped path for portfolio images). Then delete the duplicated inline logic in `handleLogoUpload` and `handleImageUpload` and call the shared helper. Same helper for the onboarding page if it duplicates the logic.

Effect: a 12MB iPhone photo becomes a ~150KB WebP before it ever hits the network — no size rejection, no memory spike, no HEIC extension problems.

### 3. No more blank page, no more surprise redirect
- On load failure: keep `profile` null but render an inline error card with a "Erneut versuchen" button instead of returning `null`.
- Replace the mount-time `getUser()` gate with `getSession()` plus the existing deferred-role pattern, and only redirect to `/auth` when the session is genuinely absent — never on a network error.
- Keep the upload button disabled while `uploading` is true and show progress, so a slow mobile upload does not look frozen.

### 4. Verify
Re-run the browser check: upload a large image, confirm the compressed logo appears, `logo_url` is written by autosave, and the page stays mounted. Confirm the load-error path renders the retry card instead of a blank screen.

### 5. Reply to the craftsman
Not automated — I will give you a short German/French text you can send once the fix is live.

## Notes on scope (SSOT / DRY / YAGNI)
- No new upload library, no new bucket, no new state machine: one shared function added to the file that already owns uploads, duplicated code removed.
- No design changes to the page beyond the error card and the disabled/progress state on the upload button.
- Document uploads keep using `DocumentManagementSection`; they are only touched if they duplicate the same inline upload code.
