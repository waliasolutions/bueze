## Root cause confirmed

- Recent `backfill-image-compression` logs show `Memory limit exceeded`.
- The current edge function imports JPEG, PNG, WebP, and resize WASM modules and initializes all of them before processing.
- The largest `handwerker-portfolio` candidates are around 5 MB, which can exceed the Supabase Edge Function memory budget once decoded/resized/encoded, even with `limit: 1` and even in dry-run.

## Permanent fix plan

1. **Move heavy image processing out of the Edge Function**
   - Keep the Edge Function as the secure admin/operator gate and privileged Storage writer only.
   - Remove `@jsquash/*` WASM imports from the function so it cannot OOM during dry-run.

2. **Reuse the existing browser compression SSOT**
   - Use the existing `compressToWebP(...)` client-side Canvas utility for the admin backfill page.
   - Dry-run will fetch one public Storage image, compress it locally in the browser, and report estimated savings without uploading.
   - Apply will compress locally, then send only the smaller WebP blob to the Edge Function for privileged overwrite.

3. **Refactor the Edge Function into safe actions**
   - `list`: validate the operator email, bucket, mode/limit, then return candidates only.
   - `commit`: validate the operator email, bucket, object path, MIME type, and that the compressed file is smaller than the original, then overwrite via service role.
   - Every per-image problem returns structured JSON, not a thrown non-2xx crash.

4. **Make the admin UI resilient**
   - Process images one by one with visible progress.
   - Continue after per-image failures and show them in the JSON results.
   - Stop automatically when no candidates remain.
   - Replace the vague `Edge Function returned a non-2xx status code` display with the actual backend error body when available.

5. **Keep access restricted**
   - Preserve the three-layer restriction to `info@walia-solutions.ch`: sidebar visibility, route redirect, and Edge Function authorization.
   - No change to public user workflows, uploads, emails, or database references.

## Expected outcome

- Dry-run no longer crashes the Edge Function.
- Existing oversized legacy images can still be tested/compressed because the browser does the memory-heavy work.
- The Edge Function returns predictable JSON and only performs secure, validated overwrites.