
# Handwerker Offerten-Limit Prüfung und UI-Verbesserungen

## Zusammenfassung der Änderungen

Es werden **3 Änderungen** implementiert:

1. **Mindestzeichenanzahl entfernen** - Die 50-Zeichen-Pflicht für Offerten-Nachrichten entfällt
2. **Standard-Textvorlage hinzufügen** - Automatischer Grusstext mit Firmenname beim Öffnen des Dialogs
3. **Quota-Prüfung funktioniert bereits** - Die Limit-Prüfung via `can_submit_proposal` RPC ist implementiert

---

## Aktuelle Situation

### Offerten-Limit (bereits funktional)
- `can_submit_proposal` RPC prüft vor jeder Offerte das Kontingent
- Bei Limit-Überschreitung: Toast "Kontingent erschöpft" + Weiterleitung zu `/checkout`
- `ProposalLimitBadge` zeigt verbleibende Offerten an

### Validierung (zu ändern)
- **Datei:** `src/hooks/useProposalFormValidation.ts` (Zeilen 68-78)
- **Aktuell:** Minimum 50 Zeichen erforderlich
- **UI-Label:** "Ihre Nachricht * (min. 50 Zeichen)"

---

## Änderung 1: Mindestzeichenanzahl entfernen

### Datei: `src/hooks/useProposalFormValidation.ts`

**Zeilen 68-78 ändern von:**
```typescript
case 'message': {
  if (!values.message) {
    return 'Nachricht ist erforderlich';
  }
  if (values.message.length < 50) {
    return `Noch ${50 - values.message.length} Zeichen erforderlich`;
  }
  if (values.message.length > 2000) {
    return 'Maximal 2000 Zeichen erlaubt';
  }
  return null;
}
```

**Zu:**
```typescript
case 'message': {
  if (!values.message || values.message.trim().length === 0) {
    return 'Nachricht ist erforderlich';
  }
  if (values.message.length > 2000) {
    return 'Maximal 2000 Zeichen erlaubt';
  }
  return null;
}
```

### Datei: `src/pages/HandwerkerDashboard.tsx`

**Zeile 1264 ändern von:**
```tsx
<Label htmlFor="message">Ihre Nachricht * (min. 50 Zeichen)</Label>
```

**Zu:**
```tsx
<Label htmlFor="message">Ihre Nachricht *</Label>
```

**Zeilen 1278-1280 entfernen:** (Zeichenzähler mit min. 50)
```tsx
<p className={`text-xs ${proposalForm.message.length < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
  {proposalForm.message.length}/50 Zeichen (min. 50)
</p>
```

### Datei: `src/pages/OpportunityView.tsx`

**Zeile 355 ändern von:**
```tsx
<Label htmlFor="message">Ihre Nachricht * (min. 50 Zeichen)</Label>
```

**Zu:**
```tsx
<Label htmlFor="message">Ihre Nachricht *</Label>
```

**Zeilen 359-360 entfernen:** HTML-Attribute `minLength={50}`

**Zeilen 368-370 entfernen:** (Zeichenzähler)
```tsx
<p className={`text-xs ${formValues.message.length < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
  {formValues.message.length}/50 Zeichen (min. 50)
</p>
```

---

## Änderung 2: Standard-Textvorlage mit Firmenname

Beim Öffnen des Offerten-Dialogs soll automatisch ein Standard-Text eingefügt werden:

```
Guten Tag

Gerne schicken wir Ihnen unsere Offerte.

Freundliche Grüsse
[Firmenname]
```

### Datei: `src/pages/HandwerkerDashboard.tsx`

**Zeile 1191 ändern von:**
```tsx
<Button onClick={() => setSelectedLead(lead)}>
```

**Zu:**
```tsx
<Button onClick={() => {
  // Set default message template with company name
  const companyName = handwerkerProfile?.company_name || 'Ihr Handwerker-Team';
  setProposalForm(prev => ({
    ...prev,
    message: prev.message || `Guten Tag\n\nGerne schicken wir Ihnen unsere Offerte.\n\nFreundliche Grüsse\n${companyName}`
  }));
  setSelectedLead(lead);
}}>
```

**Wichtig:** `prev.message ||` stellt sicher, dass nur bei leerem Nachrichtenfeld der Standardtext eingefügt wird. Hat der Handwerker bereits etwas geschrieben, bleibt es erhalten.

### Datei: `src/pages/OpportunityView.tsx`

Der OpportunityView-Formular benötigt Zugriff auf das Handwerker-Profil:

**Nach Zeile 29 (neue State):**
```typescript
const [handwerkerProfile, setHandwerkerProfile] = useState<{company_name: string | null} | null>(null);
```

**In fetchData() (nach Zeile 69), Handwerker-Profil laden:**
```typescript
// Fetch handwerker profile for default message
if (currentUser) {
  const { data: hwProfile } = await supabase
    .from('handwerker_profiles')
    .select('company_name')
    .eq('user_id', currentUser.id)
    .maybeSingle();
  
  if (hwProfile) {
    setHandwerkerProfile(hwProfile);
    // Set default message if empty
    const companyName = hwProfile.company_name || 'Ihr Handwerker-Team';
    setFormValues(prev => ({
      ...prev,
      message: `Guten Tag\n\nGerne schicken wir Ihnen unsere Offerte.\n\nFreundliche Grüsse\n${companyName}`
    }));
  }
}
```

---

## Änderung 3: Quota-Check Validierung (bereits implementiert)

Die Quota-Prüfung funktioniert bereits korrekt:

### HandwerkerDashboard.tsx (Zeilen 503-518):
```typescript
// Check quota
const { data: canSubmit, error: checkError } = await supabase.rpc('can_submit_proposal', {
  handwerker_user_id: user.id
});
if (checkError) throw checkError;
if (!canSubmit) {
  toast({
    title: 'Kontingent erschöpft',
    description: 'Sie haben Ihr monatliches Offerten-Limit erreicht. Bitte upgraden Sie Ihr Abo.',
    variant: 'destructive'
  });
  setSubmittingProposal(false);
  return;
}
```

### OpportunityView.tsx (Zeilen 106-120):
Gleiche Logik mit Weiterleitung zu `/checkout`

### Visuelles Feedback:
- `ProposalLimitBadge` zeigt "X von Y Offerten übrig"
- Bei Limit erreicht: "Limit erreicht - Jetzt upgraden" (klickbar)

---

## Dateien zu ändern

| Datei | Änderung |
|-------|----------|
| `src/hooks/useProposalFormValidation.ts` | Mindestzeichenprüfung entfernen |
| `src/pages/HandwerkerDashboard.tsx` | Label anpassen, Zeichenzähler entfernen, Standard-Textvorlage |
| `src/pages/OpportunityView.tsx` | Label anpassen, Zeichenzähler entfernen, Standard-Textvorlage |

---

## Erwartetes Verhalten nach Implementierung

1. **Textfeld:** Handwerker sehen sofort den vorausgefüllten Text:
   ```
   Guten Tag
   
   Gerne schicken wir Ihnen unsere Offerte.
   
   Freundliche Grüsse
   walia solutions
   ```

2. **Keine Zeichenbeschränkung:** Kurze Nachrichten wie "Siehe Anhang" sind erlaubt

3. **Quota bei Limit:** Nach 5 Offerten (Free-Plan) erscheint Toast + Upgrade-Aufforderung

---

## Technische Anmerkung zur Quota

Der aktuelle `proposals_used_this_period` Wert in der Datenbank scheint nicht synchron mit der tatsächlichen Anzahl eingereichten Proposals zu sein. Dies wird über den `increment_proposal_count` Trigger gesteuert. Falls Diskrepanzen auftreten, kann eine SQL-Korrektur vorgenommen werden:

```sql
-- Proposal-Zähler synchronisieren
UPDATE handwerker_subscriptions hs
SET proposals_used_this_period = (
  SELECT COUNT(*) 
  FROM lead_proposals lp 
  WHERE lp.handwerker_id = hs.user_id 
    AND lp.created_at >= hs.current_period_start
)
WHERE status = 'active';
```
