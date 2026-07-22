## Ziel
1. **Neue Uploads:** Client-seitige WebP-Komprimierung (Q=0.8, max 1920 px) im Upload-SSOT.
2. **Bestehende Bilder:** Einmaliger, admin-gesteuerter Backfill (Q=0.85, max 1920 px) über eine Edge Function — hohe Qualität, kein sichtbarer Detailverlust.

## Erwartete Ersparnis (verifiziert, live gemessen)

Aktueller Stand in Storage (nur konvertierbare Bilder — WebP/GIF ausgeschlossen):

| Bucket | Objekte | Größe heute | Erwartet nach Backfill (Q=0.85) | Ersparnis |
|---|---:|---:|---:|---:|
| `handwerker-portfolio` | 865 | **1113 MB** | ~170–220 MB | **~890–940 MB (80–85 %)** |
| `lead-media` | 36 | **24 MB** | ~4–5 MB | **~19–20 MB (80–83 %)** |
| **Total** | **901** | **~1137 MB** | **~175–225 MB** | **~910–960 MB (≈ 80–85 %)** |

Bei Q=0.85 liegen typische Smartphone-Fotos visuell praktisch verlustfrei — sichtbar wird der Unterschied erst bei direktem Pixel-Vergleich in 400 %-Zoom.

## Teil A — Neue Uploads (SSOT im Frontend)

**1. Neu: `src/lib/imageCompressor.ts`**
- Export `compressToWebP(file, quality=0.8, maxWidth=1920): Promise<File>`
- Nutzt `<img>` + `<canvas>` + `canvas.toBlob('image/webp', q)`; kein npm-Dep.
- Skippt `image/gif`, Nicht-Bilder → Original zurück.
- Alle Fehlerpfade → Original zurück (fail-safe), Log via `logWithCorrelation`.
- `URL.revokeObjectURL` in `onload`/`onerror`.

**2. Edit: `src/lib/fileUpload.ts`**
- Import `compressToWebP`.
- In `uploadLeadMedia` und `uploadProposalAttachment`: vor Validierung `const processed = await compressToWebP(file)`; Größen-/Typ-Checks + `.upload(path, processed, { contentType: processed.type })` arbeiten mit `processed`.
- PDFs & GIFs bleiben durch den Helper unverändert.
- Alle Call-Sites (`SubmitLead`, `HandwerkerDashboard`, `OpportunityView`) profitieren automatisch — keine Änderungen dort.

## Teil B — Einmaliger Backfill für bestehende Bilder

**Prinzip:** Objekte **in-place** überschreiben (gleicher Storage-Key), nur Bytes + `content-type` werden ersetzt. Damit bleiben **alle DB-Referenzen** in `leads.media_urls`, `handwerker_profiles.portfolio_urls`/`gallery_urls`, `lead_proposals.attachment_url` unangetastet. Browser rendern WebP-Bytes auch unter `.jpg`-Endung korrekt (Content-Type-Header entscheidet).

**Neu: `supabase/functions/backfill-image-compression/index.ts`**
- Admin-only (JWT + `has_role(uid,'admin')`), niemals per Cron.
- Input: `{ bucket: 'lead-media' | 'handwerker-portfolio', mode: 'dry-run' | 'apply' (default dry-run), limit?: number, quality?: 0.85 }`.
- Iteriert `storage.objects` mit `mimetype LIKE 'image/%' AND mimetype NOT IN ('image/webp','image/gif')`.
- Für jedes Objekt: Download → WASM-Decode → Resize auf max 1920 px Breite → WebP-Encode (Q=0.85) → wenn kleiner als Original: `upload(path, bytes, { upsert: true, contentType: 'image/webp' })`; sonst überspringen.
- **WASM-Toolchain:** `@jsquash/jpeg`, `@jsquash/png`, `@jsquash/webp`, `@jsquash/resize` via `esm.sh` (läuft in Deno-Edge-Runtime, keine nativen Binärabhängigkeiten).
- Fail-safe: pro-Objekt try/catch, Fehler werden gesammelt und im Response-JSON zurückgegeben; Original bleibt bei jedem Fehler intakt.
- Idempotent: Objekte, die bereits `image/webp` sind, werden übersprungen — Funktion kann beliebig oft wiederholt werden.
- Report: Anzahl geprüft/geschrumpft/übersprungen/fehlgeschlagen, Bytes vorher/nachher, geschätzte Ersparnis.
- `supabase/config.toml`: `verify_jwt = true`.

**Ausführung durch Admin (manuell, in dieser Reihenfolge):**
1. `dry-run` auf `lead-media` (36 Objekte) → Bericht prüfen.
2. `apply` auf `lead-media` → Sichtprüfung Lead-Details.
3. `dry-run` auf `handwerker-portfolio` (865 Objekte, in Batches à 50–100).
4. `apply` auf `handwerker-portfolio` in mehreren Aufrufen bis leer.

## Bewusst NICHT im Scope (YAGNI)
- Keine automatische Umbenennung auf `.webp` (würde DB-Updates + Cache-Bruch bedeuten — Extension ist irrelevant, Content-Type entscheidet).
- Kein pg_cron für den Backfill; einmaliger admin-getriggerter Vorgang.
- Keine externe npm-Dep im Frontend.
- Keine Änderungen an RLS/Bucket-Policies.

## Verifikation
- Frontend: neuer Upload landet als `image/webp`, ~150–400 KB.
- Backfill dry-run: Bericht zeigt Objekt-Anzahl + geschätzte Ersparnis, ohne Storage-Änderung.
- Nach `apply`: `SELECT bucket_id, pg_size_pretty(sum((metadata->>'size')::bigint)) FROM storage.objects GROUP BY 1;` — Erwartung ~175–225 MB total.
- Sichtprüfung: Lead-Details, Handwerker-Profile-Galerie, Proposal-Anhänge — Bilder erscheinen scharf und identisch positioniert.
