
# Implementierungsplan: Kritische Korrekturen und Entfernung Handwerkerverzeichnis

## Zusammenfassung der Testergebnisse

### ✅ Funktioniert korrekt:
- **Lead-Submission-Formular** (`/submit-lead`): 3-Schritt-Formular mit Kontakt → Projekt → Standort
- **Edge-Funktionen**: `send-pending-payment-reminder`, `lead-expiry-check` funktionieren einwandfrei
- **Datenbank**: 15 Leads, 17 Handwerker-Profile, 6 Offerten, 1 Bewertung
- **Subscription-System**: Tracking-Spalten für Zahlungserinnerungen vorhanden
- **Admin-Bewertungsmanagement**: Voll funktionsfähig mit Filterung und Moderation

### ⚠️ Gefundene Probleme:
1. **Toter Link in Navigation**: `/browse-leads` existiert nicht, sollte `/search` sein
2. **Handwerkerverzeichnis muss entfernt werden** (wie vom Benutzer gewünscht)

---

## Änderungen

### 1. Navigation-Link korrigieren
**Datei:** `src/config/navigation.ts`
- Zeile 22: `/browse-leads` → `/search` ändern

### 2. Handwerkerverzeichnis komplett entfernen

**Dateien zu ändern:**

| Datei | Änderung |
|-------|----------|
| `src/App.tsx` | Route `/handwerker-verzeichnis` entfernen (Zeile 44, 160) |
| `supabase/functions/generate-sitemap/index.ts` | Kommentar über `/handwerker-verzeichnis` entfernen (Zeile 98) |

**Datei zu löschen:**
- `src/pages/HandwerkerVerzeichnis.tsx`

### 3. Keine Änderungen erforderlich:
- `src/components/Header.tsx` - kein Link zum Verzeichnis
- `src/components/Footer.tsx` - kein Link zum Verzeichnis
- `src/config/navigation.ts` - kein Link zum Verzeichnis

---

## Technische Details

### Änderung 1: Navigation-Link korrigieren

```typescript
// src/config/navigation.ts Zeile 22
// ALT:
{ label: 'Aufträge finden', href: '/browse-leads', icon: Search },

// NEU:
{ label: 'Aufträge finden', href: '/search', icon: Search },
```

### Änderung 2: App.tsx - Route entfernen

```typescript
// Entfernen:
// Zeile 44:
const HandwerkerVerzeichnis = lazy(() => import("./pages/HandwerkerVerzeichnis"));

// Zeile 160:
<Route path="/handwerker-verzeichnis" element={<HandwerkerVerzeichnis />} />
```

### Änderung 3: Sitemap-Kommentar entfernen

```typescript
// supabase/functions/generate-sitemap/index.ts
// Zeile 98 entfernen:
// - /handwerker-verzeichnis (directory - user requested noindex)
```

---

## 18 Manuelle Testszenarien (Vereinfacht)

### Kunde-Tests

**Szenario 1: Neuen Auftrag erstellen**
1. Gehe auf `bueze.ch` und klicke auf "Jetzt starten"
2. Fülle Kontaktdaten aus: Vorname, Nachname, E-Mail, Passwort
3. Klicke "Weiter" und wähle eine Kategorie (z.B. Elektrik)
4. Gib einen Titel ein und klicke "Weiter"
5. Gib PLZ "8001" ein und wähle ein Budget
6. Klicke "Auftrag veröffentlichen"
→ **Erwartetes Ergebnis:** Erfolgsseite erscheint, E-Mail-Bestätigung kommt

**Szenario 2: Anmeldung mit bestehendem Konto**
1. Gehe auf `bueze.ch/auth`
2. Gib E-Mail und Passwort ein
3. Klicke "Anmelden"
→ **Erwartetes Ergebnis:** Weiterleitung zum Dashboard

**Szenario 3: Offerten im Dashboard ansehen**
1. Melde dich als Kunde an
2. Gehe auf "Meine Aufträge" im Menü
3. Klicke auf einen bestehenden Auftrag
→ **Erwartetes Ergebnis:** Auftragsdetails und erhaltene Offerten sichtbar

**Szenario 4: Offerte annehmen**
1. Als Kunde: Öffne einen Auftrag mit Offerten
2. Klicke auf "Annehmen" bei einer Offerte
3. Bestätige die Annahme
→ **Erwartetes Ergebnis:** Status ändert sich, Kontaktdaten des Handwerkers werden sichtbar

**Szenario 5: Nachricht an Handwerker senden**
1. Nach Offerte-Annahme: Klicke auf "Nachricht senden"
2. Schreibe eine Nachricht
3. Sende die Nachricht
→ **Erwartetes Ergebnis:** Nachricht erscheint im Chat

**Szenario 6: Passwort zurücksetzen**
1. Gehe auf `bueze.ch/auth`
2. Klicke auf "Passwort vergessen"
3. Gib deine E-Mail-Adresse ein
4. Prüfe dein E-Mail-Postfach
→ **Erwartetes Ergebnis:** E-Mail mit Reset-Link kommt an

---

### Handwerker-Tests

**Szenario 7: Als Handwerker registrieren**
1. Gehe auf `bueze.ch/handwerker`
2. Klicke "Jetzt registrieren"
3. Fülle alle Kontaktdaten aus
4. Wähle mindestens eine Kategorie und Servicegebiet
5. Schliesse die Registrierung ab
→ **Erwartetes Ergebnis:** Bestätigungsseite, Hinweis auf Admin-Prüfung

**Szenario 8: Handwerker-Dashboard nutzen**
1. Melde dich als genehmigter Handwerker an
2. Dashboard sollte automatisch laden
3. Prüfe: Passende Aufträge, Offerten-Zähler, Nachrichten
→ **Erwartetes Ergebnis:** Alle Bereiche laden ohne Fehler

**Szenario 9: Offerte für einen Auftrag einreichen**
1. Als Handwerker: Öffne einen passenden Auftrag
2. Gib Preisspanne ein (z.B. 500 - 1500 CHF)
3. Schreibe eine Nachricht an den Kunden
4. Klicke "Offerte einreichen"
→ **Erwartetes Ergebnis:** Erfolgsmeldung, Offerte im "Meine Angebote"-Bereich

**Szenario 10: Offerten-Limit prüfen (Gratis-Paket)**
1. Als Handwerker im Gratis-Paket
2. Versuche die 6. Offerte einzureichen
→ **Erwartetes Ergebnis:** Upgrade-Hinweis erscheint, Offerte wird blockiert

**Szenario 11: Abo-Upgrade durchführen**
1. Gehe auf `bueze.ch/checkout?plan=monthly`
2. Prüfe die Plandetails (CHF 90/Monat)
3. Klicke "Jetzt bezahlen"
→ **Erwartetes Ergebnis:** Weiterleitung zu Payrexx-Zahlungsseite

**Szenario 12: Profil bearbeiten**
1. Als Handwerker: Gehe auf "Profil bearbeiten"
2. Ändere die Beschreibung oder lade ein Logo hoch
3. Speichere die Änderungen
→ **Erwartetes Ergebnis:** Erfolgsmeldung, Änderungen sichtbar

---

### Admin-Tests

**Szenario 13: Handwerker freischalten**
1. Melde dich als Admin an (`bueze.ch/auth`)
2. Gehe auf "Freigaben" im Admin-Menü
3. Finde einen ausstehenden Handwerker
4. Klicke "Freischalten"
→ **Erwartetes Ergebnis:** Handwerker wird genehmigt, E-Mail wird versendet

**Szenario 14: Bewertungen verwalten**
1. Als Admin: Gehe auf "Bewertungen" im Admin-Menü
2. Prüfe die Statistiken (Gesamt, Durchschnitt, Öffentlich/Versteckt)
3. Verstecke oder lösche eine Bewertung
→ **Erwartetes Ergebnis:** Aktionen werden ausgeführt, Erfolgsmeldung erscheint

**Szenario 15: Aufträge im Admin-Bereich verwalten**
1. Als Admin: Gehe auf "Aufträge"
2. Filtere nach Status oder Kategorie
3. Pausiere oder lösche einen Auftrag
→ **Erwartetes Ergebnis:** Status ändert sich entsprechend

---

### System-Tests

**Szenario 16: 404-Seite testen**
1. Gehe auf `bueze.ch/nicht-existiert`
→ **Erwartetes Ergebnis:** "Seite nicht gefunden"-Meldung erscheint

**Szenario 17: Handwerkerverzeichnis ist entfernt**
1. Gehe auf `bueze.ch/handwerker-verzeichnis`
→ **Erwartetes Ergebnis:** 404-Seite erscheint (Route existiert nicht mehr)

**Szenario 18: Mobile Navigation testen**
1. Öffne die Seite auf dem Handy
2. Tippe auf das Menü-Symbol (☰)
3. Navigiere durch alle Menüpunkte
→ **Erwartetes Ergebnis:** Alle Links funktionieren, Menü schliesst nach Auswahl

---

## Zusammenfassung der Änderungen

| Komponente | Status | Aktion |
|------------|--------|--------|
| Lead-Submission | ✅ Funktioniert | Keine |
| Handwerker-Registrierung | ✅ Funktioniert | Keine |
| Subscription-System | ✅ Funktioniert | Keine |
| Payment-Reminder | ✅ Funktioniert | Keine |
| Bewertungsverwaltung | ✅ Funktioniert | Keine |
| Navigation-Link | ❌ Defekt | Korrigieren |
| Handwerkerverzeichnis | Zu entfernen | Route + Datei löschen |

Nach der Implementierung wird das System vollständig funktionsfähig sein ohne tote Links oder unerwünschte Seiten.
