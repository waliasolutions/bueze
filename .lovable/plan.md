
# Automatic Payment Reminder System for Pending Subscriptions

## Overview

This plan implements an automatic payment reminder system that sends payment reminders 2-3 days after admin approval for handwerkers who selected a paid plan during registration. This ensures they complete their subscription without requiring manual follow-up.

## Current Flow (Before)

1. Handwerker registers → selects paid plan → `pending_plan` stored
2. Admin approves profile → `verified_at` timestamp set
3. Approval email sent with payment link
4. ❌ **No follow-up** - user may forget to pay
5. User stuck in "free tier" indefinitely

## New Flow (After)

1. Handwerker registers → selects paid plan → `pending_plan` stored
2. Admin approves profile → `verified_at` timestamp set
3. Approval email sent with payment link
4. ✅ **Day 2-3**: Automatic payment reminder email sent
5. ✅ **Day 7**: Final reminder (optional escalation)
6. User completes payment → `pending_plan` cleared

---

## Technical Implementation

### Component 1: New Edge Function `send-pending-payment-reminder`

**File: `supabase/functions/send-pending-payment-reminder/index.ts`**

This function:
- Queries `handwerker_subscriptions` for records with `pending_plan IS NOT NULL`
- Joins with `handwerker_profiles` to check `verified_at` timestamp
- Filters for profiles approved 48-72 hours ago (first reminder) and 7 days ago (final reminder)
- Sends branded payment reminder emails with direct checkout links
- Tracks sent reminders via new columns to prevent duplicates

```typescript
// Pseudocode structure:
serve(async (req) => {
  const supabase = createSupabaseAdmin();
  
  // Find approved handwerkers with pending plans who haven't been reminded
  const { data: pendingPayments } = await supabase
    .from('handwerker_subscriptions')
    .select(`
      *,
      handwerker_profiles!inner(
        verified_at, first_name, last_name, company_name, email
      ),
      profiles!inner(email)
    `)
    .not('pending_plan', 'is', null)
    .eq('plan_type', 'free');  // Still on free tier
  
  for (const sub of pendingPayments) {
    const approvedAt = new Date(sub.handwerker_profiles.verified_at);
    const hoursSinceApproval = (Date.now() - approvedAt.getTime()) / (1000 * 60 * 60);
    
    // First reminder: 48-72 hours after approval
    if (hoursSinceApproval >= 48 && !sub.payment_reminder_1_sent) {
      await sendPaymentReminder(sub, 'first');
      await markReminderSent(sub.id, 'payment_reminder_1_sent');
    }
    
    // Final reminder: 7 days after approval
    if (hoursSinceApproval >= 168 && !sub.payment_reminder_2_sent) {
      await sendPaymentReminder(sub, 'final');
      await markReminderSent(sub.id, 'payment_reminder_2_sent');
    }
  }
});
```

### Component 2: Database Migration

**New columns on `handwerker_subscriptions`:**

```sql
-- Track payment reminder status
ALTER TABLE handwerker_subscriptions
ADD COLUMN payment_reminder_1_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN payment_reminder_2_sent BOOLEAN DEFAULT FALSE;
```

### Component 3: Cron Job Setup

**Daily cron job at 10:00 AM Swiss time (9:00 UTC in summer, 8:00 UTC in winter):**

```sql
SELECT cron.schedule(
  'pending-payment-reminders',
  '0 9 * * *',  -- 9:00 UTC = 10:00 Swiss time (summer)
  $$
  SELECT net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-pending-payment-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <anon_key>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Component 4: Email Templates

**First Reminder (48 hours):**
- Subject: "💳 Vergessen? Ihr Abo wartet auf Sie - Büeze.ch"
- Tone: Friendly reminder
- CTA: Direct payment link

**Final Reminder (7 days):**
- Subject: "⏰ Letzte Erinnerung: Aktivieren Sie Ihr Abo - Büeze.ch"
- Tone: Urgency, mention expiring opportunity
- CTA: Direct payment link + option to cancel pending plan

### Component 5: Update `supabase/config.toml`

```toml
[functions.send-pending-payment-reminder]
verify_jwt = false
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/send-pending-payment-reminder/index.ts` | Create | New edge function for payment reminders |
| `supabase/config.toml` | Modify | Add function configuration |
| Database migration | Create | Add reminder tracking columns |
| SQL for cron job | Manual | User runs in Supabase SQL Editor |

---

## Email Template Design

**First Reminder (48 hours after approval):**

```
Subject: 💳 Vergessen? Ihr Abo wartet auf Sie - Büeze.ch

Hallo [Name],

Vor 2 Tagen wurde Ihr Handwerker-Profil freigeschaltet – herzlichen Glückwunsch! 🎉

Sie haben sich für das [Plan Name] entschieden, aber die Zahlung steht noch aus.

Mit Ihrem gewählten Abo erhalten Sie:
✅ Unbegrenzte Offerten pro Monat
✅ Sofortigen Zugang zu allen Aufträgen
✅ Mehr Chancen auf neue Kunden

[JETZT BEZAHLEN UND STARTEN]

Oder starten Sie kostenlos mit 5 Offerten pro Monat.

Bei Fragen: info@bueeze.ch
```

**Final Reminder (7 days after approval):**

```
Subject: ⏰ Letzte Erinnerung: Aktivieren Sie Ihr Abo - Büeze.ch

Hallo [Name],

Ihr Handwerker-Profil ist seit einer Woche aktiv, aber Ihr gewähltes 
[Plan Name] wartet noch auf die Aktivierung.

Während Sie warten, gewinnen andere Handwerker bereits neue Aufträge. 
Sichern Sie sich Ihren Wettbewerbsvorteil!

[JETZT ABO AKTIVIEREN]

Nicht interessiert? Sie können den ausstehenden Plan hier stornieren 
und kostenlos weitermachen: [PLAN STORNIEREN]

Ihr Büeze.ch Team
```

---

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| User pays before reminder | `pending_plan` is NULL, no reminder sent |
| User cancels pending plan | `pending_plan` is NULL, no reminder sent |
| Profile not yet approved | `verified_at` is NULL, skipped |
| Reminder already sent | Boolean flag prevents duplicates |
| Multiple pending plans (impossible) | Only one `pending_plan` column exists |

---

## Testing Plan

1. Create test handwerker with pending plan
2. Approve profile (sets `verified_at`)
3. Manually invoke edge function with past timestamp simulation
4. Verify email received with correct content
5. Verify reminder flag updated
6. Run again, verify no duplicate email

---

## Implementation Order

1. **Create database migration** - Add reminder tracking columns
2. **Create edge function** - `send-pending-payment-reminder`
3. **Update config.toml** - Register new function
4. **Deploy edge function** - Automatic on save
5. **Set up cron job** - Manual SQL execution in Supabase dashboard

---

## Notes

- Cron job SQL must be run manually in Supabase SQL Editor (not via migrations) because it contains instance-specific URLs and keys
- The 48-72 hour window gives users time to complete payment on their own schedule while ensuring follow-up
- Final reminder at 7 days creates urgency without being annoying
- Both reminders include option to cancel pending plan and stay on free tier
