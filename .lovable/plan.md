## Problem
Registrierte Handwerker posten versehentlich Aufträge als Auftraggeber. Bereits 3× manueller Cleanup. Quotas werden verbraucht, E-Mails gehen raus.

## Ziel
Handwerker-Konten können keine Leads erstellen — hart in der DB (SSOT), freundlich im UI.

---

## Phase 1 · DB-Guard (SSOT)

Migration: `BEFORE INSERT` Trigger `prevent_handwerker_lead_creation` auf `public.leads`.

- **Check-Quelle:** `user_roles.role = 'handwerker'` für `NEW.owner_id` (konsistent mit `has_role` / `roleHelpers.ts`).
- **Fehler:** `RAISE EXCEPTION 'HANDWERKER_CANNOT_POST_LEADS' USING ERRCODE = 'P0001'`.
- **Bypass:** `service_role` und Admins (`has_role(...,'admin'|'super_admin')`) — konsistent mit `prevent_subscription_self_escalation`.
- **`owner_id IS NULL`** (Gast-Leads) → passiert einfach durch.

## Phase 2 · Frontend-Guard in `SubmitLead.tsx`

`useUserRole()` beim Mount. Wenn `isHandwerker && !isAdmin` → Formular nicht rendern, Info-Card zeigen (bestehende Card-Komponenten):

> **Sie sind als Handwerker angemeldet 👋**
> Dieses Konto ({email}) ist als Handwerker registriert. Aufträge als Auftraggeber sind mit diesem Konto nicht möglich.
>
> 💡 Privat einen Auftrag ausschreiben? Melden Sie sich ab und registrieren Sie sich mit einer anderen (z. B. privaten) E-Mail-Adresse.
>
> **[Verfügbare Aufträge ansehen]** · [Zum Handwerker-Dashboard] · [Abmelden]

Kein Toast-Mapping — Guard verhindert Submit. YAGNI.

## Phase 3 · Gast-Flow: Post-Login-Check + Draft-Cleanup

Der Multi-Step-Gast-Flow speichert den Entwurf in `localStorage` (siehe `useMultiStepForm` / `localStorageVersioning`). Nach Login, **vor** `leads.insert`:

- Frisch geladene Rolle prüfen.
- Wenn Handwerker → Insert abbrechen, gleiche Card wie Phase 2 zeigen, Zusatzhinweis: *"Ihr Entwurf wurde nicht übernommen."*

**Draft-Cleanup (kritisch):**
- In **einer** zentralen Helper-Funktion `clearLeadDraft()` (SSOT für alle Draft-Keys inkl. Legacy-Versionen aus `localStorageVersioning`).
- Aufrufen bei: (a) Abbruch wegen Handwerker-Rolle, (b) erfolgreichem Insert, (c) `onAuthStateChange` beim `SIGNED_OUT` **und** `SIGNED_IN`-Übergang, wenn sich `user.id` gegenüber dem letzten Draft-Owner ändert.
- Damit ist ausgeschlossen, dass ein alter Draft auf einem geteilten Gerät bei einem späteren Login (egal welcher Rolle) automatisch abgesendet wird.

## Phase 4 · Navigation aufräumen

- `Header.tsx` Desktop-Button (Z. 163): Condition erweitern auf `&& !isHandwerker`.
- `MobileStickyFooter.tsx`: `useUserRole()` einbinden, für `isHandwerker || isAdmin` nicht rendern.
- `UserDropdown.tsx`: Handwerker-Sichtbarkeit prüfen und ggf. filtern.
- Landing-Hero-CTA bleibt (Gäste = Zielmarkt); eingeloggte Handwerker landen im Guard aus Phase 2.

---

## Bewusst NICHT enthalten (YAGNI)
- Registrierungs-E-Mail-Blocker (Zweitkonten erlaubt).
- Rollen-Wechsel-UI.
- Migration alter Fehlleads (bereits manuell erledigt).
- Separates Toast-Mapping für den DB-Fehler.

## Reihenfolge
1. Migration (Trigger + Bypass).
2. `clearLeadDraft()`-Helper + `SubmitLead.tsx` Guard-Card + Post-Login-Check.
3. `onAuthStateChange`-Listener für Draft-Cleanup bei User-Wechsel.
4. `Header.tsx`, `MobileStickyFooter.tsx`, `UserDropdown.tsx` Sichtbarkeit.

## Smoke-Test
1. Als Handwerker eingeloggt → `/submit-lead` direkt aufrufen → Info-Card, kein Formular.
2. Als Handwerker: Menü, Sticky-Footer, UserDropdown enthalten kein "Auftrag erstellen".
3. Direkter `supabase.from('leads').insert(...)` in der Konsole als Handwerker → DB-Exception `HANDWERKER_CANNOT_POST_LEADS`.
4. Als Gast: Multi-Step-Draft ausfüllen, Login als Handwerker → Abbruch-Card, **`localStorage` inspizieren: alle `lead-draft*`-Keys weg**.
5. Erneut Gast-Draft ausfüllen, Login als Client → Draft-Owner-ID stimmt, Insert läuft.
6. Draft als Gast anlegen, Browser-Tab schließen, in **neuem** Browser-Kontext als anderer User einloggen → alter Draft wird beim `SIGNED_IN` mit fremder `user.id` verworfen, nichts wird abgesendet.
7. Als Admin: `/submit-lead` weiterhin nutzbar (Bypass greift).
