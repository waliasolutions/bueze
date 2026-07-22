# Portfolio-Bilder auf 1600 px normalisieren + Bucket-Auslastung anzeigen

## Ziel

1. Alle Portfolio-Bilder auf **max. 1600 px Breite, Q=0.82 WebP** normalisieren (retina-crisp bis 800 px Anzeige).
2. Backfill soll auch bereits konvertierte WebPs neu prüfen (aktuell werden sie übersprungen).
3. Im Admin-Backfill-UI **Gesamt-Bucket-Größe** live anzeigen, damit die Ersparnis sichtbar ist.

## Änderungen

### 1. `src/lib/imageCompressor.ts`
- Default `maxWidth` von 1920 → **1600**
- Default `quality` von 0.85 → **0.82**
- Wirkt sofort für alle Neu-Uploads (Portfolio, Lead-Bilder etc.).

### 2. `src/pages/admin/ImageBackfill.tsx` — progressive Stufen anpassen
```
1600 × 0.82  →  1500 × 0.80  →  1400 × 0.78  →  1200 × 0.75  →  1000 × 0.70
```
Commit-Guard („nur schreiben wenn kleiner als aktueller Storage-Stand") bleibt bestehen — kein Qualitätsverlust bei bereits gut komprimierten Bildern.

### 3. Migration: `list_image_backfill_candidates` erweitern
Aktuell filtert die RPC `mimetype <> 'image/webp'`. Neue Logik:
- Nicht-WebP: immer Kandidat (wie bisher).
- WebP: Kandidat **wenn `size > 400 KB`** (heuristischer Proxy für „zu groß / vermutlich >1600 px breit"), da Storage-Metadata keine Pixel-Dimensionen enthält.

### 4. `ImageBackfill.tsx` — Bucket-Statistik-Panel
Neuer Header pro Bucket zeigt:
- **Gesamt-Dateien** und **Gesamt-Speicher** (aus `storage.objects` via neuer RPC `get_bucket_storage_stats(p_bucket)`)
- Aufschlüsselung: WebP-Anteil vs. Original-Anteil
- Aktualisiert nach jedem Batch, damit der Nutzer die Reduktion in Echtzeit sieht.

### 5. Neue RPC (Migration): `get_bucket_storage_stats(p_bucket text)`
SECURITY DEFINER, nur für die Admin-E-Mail-Allowlist (`info@walia-solutions.ch`) ausführbar. Gibt zurück:
`total_files, total_bytes, webp_files, webp_bytes, other_files, other_bytes`.

## Erwartete Ersparnis (verifiziert aus aktuellen Bucket-Daten)

- Heute `handwerker-portfolio`: **1006 MB / 875 Dateien** (Ø 1.15 MB, davon 128 WebP mit Ø 2.7 MB — die alten 1920px-WebPs sind größer als der Rest, weil die kleinen Originale beim Commit-Guard übersprungen wurden).
- Nach 1600 px / Q=0.82 Backfill (Schätzung): **~700–790 MB total**, also **~220–300 MB Ersparnis**.
- Neu-Uploads landen ab sofort mit dem neuen Cap — kein weiterer Bloat.

## Verifikation

1. Testcharge Apply(25) → 3 Bilder visuell in Lightbox (Desktop 27" + Mobile) prüfen.
2. Bucket-Stats-Panel zeigt Reduktion.
3. Vollständiger Backfill in 200er-Batches, bis „Übersprungen" ≈ „Geprüft" ist.

## Nicht im Scope

- `lead-media` (24 MB) und `handwerker-documents` (39 MB, PDFs) — bleiben unangetastet.
- Keine Änderungen an Display-Komponenten (URLs stabil, MIME bleibt WebP).
