

# Bulk Password Reset — Neuregistrationen seit letztem Montag

## Scope

Alle User, die seit **Montag, 13.04.2026 00:00 Swiss time** registriert wurden, bekommen das Passwort `A12345678` gesetzt — unabhängig davon, ob sie sich schon eingeloggt haben oder nicht.

Begründung: Du willst die Liste der Neuregistrationen pauschal resetten (z.B. weil es Mass-Imports waren). Das `last_sign_in_at IS NULL`-Kriterium fällt damit weg.

## Step 1 — Detection Query

```sql
SELECT u.id, u.email,
       u.created_at AT TIME ZONE 'Europe/Zurich' AS created_swiss,
       u.last_sign_in_at AT TIME ZONE 'Europe/Zurich' AS last_signin_swiss,
       p.full_name,
       COALESCE(r.role::text, 'user') AS role,
       hp.verification_status AS handwerker_status,
       hp.company_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
LEFT JOIN public.handwerker_profiles hp ON hp.user_id = u.id
WHERE u.created_at >= '2026-04-13 00:00:00+02'::timestamptz   -- Montag 00:00 Swiss
  AND u.email_confirmed_at IS NOT NULL
  AND u.banned_until IS NULL
  AND u.deleted_at IS NULL
  AND (r.role IS NULL OR r.role NOT IN ('admin', 'super_admin'))
  AND u.email != 'info@bueeze.ch'
ORDER BY u.created_at ASC;
```

Schliesst Admins und die System-Mailbox aus. Sonst keine Filter.

## Step 2 — Liste präsentieren

Tabelle im Chat: Email, Firma, Name, Rolle, Status, Erstellt (Swiss), Letzter Login. Du kannst Zeilen streichen, falls jemand nicht resettet werden soll.

## Step 3 — Anpassung der Re-Detection im Edge Function

Die aktuelle `bulk-custom`-Logik in `reset-user-password/index.ts` filtert Kandidaten erneut anhand des alten `last_sign_in_at IS NULL` + `updated_at`-Kriteriums (siehe `getStillStuckCandidates`). Für diesen Lauf passt das nicht — User die sich bereits eingeloggt haben würden rausfallen.

**Lösung:** Einen neuen Modus-Parameter `skipReDetection: true` einführen. Wenn gesetzt, überspringt der Function die Re-Detection und resettet stur alle übergebenen `userIds`. Verifikation pro User bleibt aktiv (Snapshot → Update → Re-Query → signInWithPassword-Test).

Änderung an einer Stelle, ~10 Zeilen, kein Bruch der bestehenden Logik.

## Step 4 — Execute

Invoke `reset-user-password` mit:
- `userIds: [...alle aus Step 2 nach deinem OK]`
- `customPassword: 'A12345678'`
- `skipReDetection: true`

Pro User: Snapshot in Backup-Tabelle → Update → Verify (updated_at + signInWithPassword) → Result-Eintrag. Continue-on-error.

## Step 5 — Output

- Per-User-Resultatstabelle im Chat (success/failed + Fehler)
- CSV unter `/mnt/documents/bulk-password-reset-2026-04-17.csv` mit: email, full_name, company_name, user_id, status, error
- Audit-Row in `admin_notifications` (`type = 'bulk_password_reset'`, mit triggered_by, requested_ids, succeeded_ids, failed)
- Backup-Rows in `password_reset_backup_2026_04_17` (Rollback-Pfad bleibt offen)

## Files

| # | File | Change |
|---|------|--------|
| 1 | `supabase/functions/reset-user-password/index.ts` | Add `skipReDetection` flag handling (~10 Zeilen) |
| 2 | Read-only: Detection-Query | Kein File-Change |
| 3 | One-time invocation nach deiner Listen-Freigabe | Kein File-Change |

## Gates

1. ✅ Policy bestätigt
2. ✅ Passwort: `A12345678`
3. ✅ Hypothesen-Check: übersprungen per User-Override
4. **Pending:** Du gibst die Liste aus Step 2 frei
5. **Pending:** Edge-Function-Anpassung (Step 3) wird vor dem Execute deployed

Ich starte direkt mit Step 1 (Detection-Query) sobald du diesen Plan freigibst.

