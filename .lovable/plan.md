## Globale Suche nach „MHS Haustechnik" — Ergebnis

Durchsucht wurden: gesamter Repo-Baum (inkl. versteckter Dateien), Supabase-Migrations/Edge-Functions und die Live-Datenbank (`billing_settings`, alle Text-Spalten in `public`).

### Fundstellen

| # | Ort | Zeile | Inhalt | Handlung |
|---|-----|-------|--------|----------|
| 1 | `src/pages/legal/Impressum.tsx` | 91 | `<p><strong>Geschäftsführung:</strong> MHS Haustechnik GmbH</p>` | ✅ **Bereits ersetzt** durch `{b.company_legal_name}` (SSOT aus `billing_settings`) |
| 2 | `.lovable/plan.md` | 3, 18, 27 | Erwähnungen im Planungsdokument der letzten Änderung | ⏭️ Keine Aktion — reines Verlaufs-/Planungsdokument, keine Auslieferung an Endnutzer |

### Nicht gefunden in

- Edge Functions (`supabase/functions/**`) — 0 Treffer
- Migrationen (`supabase/migrations/**`) — 0 Treffer
- Email-Templates, HTML-Export, `public/`, `index.html`, `llms.txt` — 0 Treffer
- Datenbank: `billing_settings.company_name` / `company_legal_name` — kein Treffer für „MHS" oder „Haustechnik"

### Fazit

Es existiert **keine offene Fundstelle** von „MHS Haustechnik" mehr, die noch ersetzt werden muss. Die einzige echte Referenz (Impressum) wurde bereits in der vorherigen Runde auf die SSOT-Quelle `billing_settings.company_legal_name` umgestellt und zieht damit automatisch „Büeze.ch GmbH".

### Nächste Schritte

Kein Plan zur Umsetzung nötig. Falls gewünscht, kann ich zusätzlich:
- die Erwähnungen in `.lovable/plan.md` bereinigen (rein kosmetisch), oder
- die Suche auf weitere Varianten ausweiten (z. B. „M.H.S.", „mhs-haustechnik.ch", frühere UID/Handelsregister-Nummern) — bitte Varianten nennen.
