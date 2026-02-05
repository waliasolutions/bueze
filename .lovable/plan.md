
# Fix: Highlight New Messages and Reviews for Handwerker Dashboard

## Problem Identified

The dashboard notification cards (already implemented) are **not visible** because the `handwerker_notifications` table is never populated. The Edge Functions only send emails but don't create in-app notification records.

**Current State:**
- Dashboard has cards for unread messages, accepted proposals, and new reviews
- Cards query `handwerker_notifications` table WHERE `read = false`
- But `handwerker_notifications` is **always empty** - Edge Functions don't insert records

**Evidence from Database:**
- 1 unread message exists (in `messages` table where `read_at IS NULL`)
- 2 reviews exist for handwerker (in `reviews` table)
- 0 records in `handwerker_notifications` table

---

## Solution Overview

Update three Edge Functions to insert in-app notifications for handwerkers:

```text
┌─────────────────────────────────────┐
│   Edge Function Updates             │
├─────────────────────────────────────┤
│ send-message-notification           │
│   ✉️  Email → Recipient             │
│   📥 INSERT handwerker_notifications│
│       (if recipient is handwerker)  │
├─────────────────────────────────────┤
│ send-rating-notification            │
│   ✉️  Email → Handwerker            │
│   📥 INSERT handwerker_notifications│
│       type: 'new_review'            │
├─────────────────────────────────────┤
│ send-acceptance-emails              │
│   ✉️  Email → Both parties          │
│   📥 INSERT handwerker_notifications│
│       type: 'proposal_accepted'     │
└─────────────────────────────────────┘
```

---

## Technical Changes

### 1. Update `send-message-notification/index.ts`

After sending the email, insert a notification record for the recipient if they're a handwerker:

```typescript
// After successful email send (around line 93)

// Check if recipient is a handwerker
const { data: isHandwerker } = await supabase
  .from('handwerker_profiles')
  .select('user_id')
  .eq('user_id', message.recipient_id)
  .maybeSingle();

if (isHandwerker) {
  await supabase.from('handwerker_notifications').insert({
    user_id: message.recipient_id,
    type: 'new_message',
    title: 'Neue Nachricht',
    message: `${senderName} hat Ihnen eine Nachricht gesendet`,
    related_id: message.id,
    metadata: { 
      conversationId: message.conversation_id,
      senderId: message.sender_id
    }
  });
  console.log('[send-message-notification] Handwerker notification created');
}
```

### 2. Update `send-rating-notification/index.ts`

After sending the rating email, insert a notification:

```typescript
// After successful email send (around line 76)

// Insert in-app notification for handwerker
await supabase.from('handwerker_notifications').insert({
  user_id: review.reviewed_id,
  type: 'new_review',
  title: 'Neue Bewertung erhalten',
  message: `${clientFirstName} hat Sie mit ${review.rating} Sternen bewertet`,
  related_id: reviewId,
  metadata: { 
    lead_id: review.lead_id,
    rating: review.rating
  }
});
console.log('[send-rating-notification] Handwerker notification created');
```

### 3. Update `send-acceptance-emails/index.ts`

After creating the conversation, insert a notification:

```typescript
// After successful conversation creation (around line 69)

// Insert in-app notification for handwerker
await supabase.from('handwerker_notifications').insert({
  user_id: proposal.handwerker_id,
  type: 'proposal_accepted',
  title: 'Offerte angenommen!',
  message: `${clientProfile?.fullName || 'Ein Kunde'} hat Ihre Offerte für "${proposal.leads?.title}" angenommen`,
  related_id: proposalId,
  metadata: { 
    lead_id: proposal.lead_id,
    conversation_id: conversation?.id
  }
});
console.log('[send-acceptance-emails] Handwerker notification created');
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-message-notification/index.ts` | Add handwerker_notifications insert |
| `supabase/functions/send-rating-notification/index.ts` | Add handwerker_notifications insert |
| `supabase/functions/send-acceptance-emails/index.ts` | Add handwerker_notifications insert |

---

## After Implementation

When a handwerker logs in, they will see:

```text
┌──────────────────────────────────────────────────┐
│  💬 2 Neue      ✅ 1 Angenommene   ⭐ 1 Neue    │
│  Nachrichten     Offerte           Bewertung    │
└──────────────────────────────────────────────────┘
```

Clicking each card navigates to:
- Messages → `/conversations`
- Accepted Offers → Switches to "Angebote" tab
- Reviews → Switches to "Bewertungen" tab

---

## Summary

The notification cards are already implemented in the dashboard, but the Edge Functions never populate the `handwerker_notifications` table. By adding INSERT statements to the three key Edge Functions, handwerkers will immediately see their new messages, accepted offers, and reviews upon login.
