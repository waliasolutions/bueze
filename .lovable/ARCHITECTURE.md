# Büeze.ch - Complete System Architecture

## Overview

Büeze.ch is a Swiss marketplace connecting homeowners with verified tradespeople (Handwerker). Built with React/Vite frontend and Supabase backend.

---

## 1. Technology Stack

### Frontend
| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | React Query (TanStack) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion (minimal) |

### Backend (Supabase)
| Layer | Technology |
|-------|------------|
| Database | PostgreSQL |
| Auth | Supabase Auth |
| API | Auto-generated REST + RPC |
| Edge Functions | Deno (TypeScript) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (limited use) |

---

## 2. User Roles & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ROLE HIERARCHY                       │
├─────────────────────────────────────────────────────────────┤
│  super_admin  →  Full system access + user management       │
│  admin        →  Content management, approvals, analytics   │
│  handwerker   →  Browse leads, submit proposals, profile    │
│  user         →  Submit leads, review proposals, messaging  │
└─────────────────────────────────────────────────────────────┘
```

### Role Assignment Flow
1. **New User Registration** → `user` role (default)
2. **Handwerker Registration** → `user` role + pending handwerker_profile
3. **Admin Approval** → Role upgraded to `handwerker`
4. **Admin Users** → Created via edge function or SQL

### SSOT: Role Checking
- **Database**: `user_roles` table + `get_user_role()` function
- **Frontend**: `src/lib/roleHelpers.ts` → `getUserRoles()`
- **Hook**: `src/hooks/useUserRole.ts` (React Query cached)

---

## 3. Core Business Flows

### 3.1 Lead Submission (Homeowner)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  SubmitLead  │────►│  Draft Lead  │────►│ Active Lead  │
│    Form      │     │  (optional)  │     │  (visible)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                     ┌──────────────────────────────────────┐
                     │  Triggers:                           │
                     │  • Admin notification                │
                     │  • Email to matching handwerkers     │
                     │  • 10-day proposal_deadline set      │
                     └──────────────────────────────────────┘
```

**Key Files:**
- `src/pages/SubmitLead.tsx` - Multi-step form
- `src/lib/leadHelpers.ts` - Lead utilities
- `supabase/functions/send-lead-notification/` - Email notifications

### 3.2 Proposal Flow (Handwerker)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Browse Leads   │────►│ Submit Proposal │────►│ Pending Review  │
│  (Dashboard)    │     │ (quota check)   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       ▼
        │               ┌───────────────┐       ┌───────────────┐
        │               │ can_submit_   │       │   Accepted/   │
        │               │ proposal()    │       │   Rejected    │
        │               │ RPC check     │       │               │
        │               └───────────────┘       └───────────────┘
        │                                               │
        ▼                                               ▼
┌───────────────────────────────────────────────────────────────┐
│  Quota System (30-day rolling from registration):             │
│  • Free tier: 5 proposals/period                              │
│  • Paid tier: Unlimited (-1)                                  │
│  • Reset: 30 days from current_period_start                   │
└───────────────────────────────────────────────────────────────┘
```

**Key Files:**
- `src/pages/HandwerkerDashboard.tsx` - Main dashboard
- `src/pages/OpportunityView.tsx` - Lead details + proposal form
- `src/hooks/useSubscription.ts` - Quota state management
- `src/components/SubscriptionManager.tsx` - UI for quota display
- DB Function: `can_submit_proposal()` - Server-side quota check

### 3.3 Handwerker Registration & Approval

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Registration  │────►│  Pending       │────►│  Admin Review  │
│  Form          │     │  Profile       │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
        │                                              │
        ▼                                              ▼
┌────────────────────────────────────┐        ┌───────────────┐
│  Creates:                          │        │   Approved?   │
│  • handwerker_profiles (pending)   │        └───────────────┘
│  • Admin notification              │               │
│  • pending_plan (if paid selected) │        ┌──────┴──────┐
└────────────────────────────────────┘        ▼             ▼
                                        ┌──────────┐  ┌──────────┐
                                        │ Approved │  │ Rejected │
                                        └──────────┘  └──────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ • Role → handwerker
                                     │ • Payment link sent
                                     │ • (if pending_plan)
                                     └─────────────────┘
```

**Key Files:**
- `src/pages/HandwerkerOnboarding.tsx` - Registration form
- `src/pages/admin/HandwerkerApprovals.tsx` - Admin approval UI
- `supabase/functions/create-handwerker-self-registration/`
- `supabase/functions/send-approval-email/`

---

## 4. Database Schema (Key Tables)

### Core Tables

```sql
-- User identity
profiles (id, email, full_name, phone, canton, city, zip, ...)
user_roles (user_id, role: app_role)

-- Handwerker-specific
handwerker_profiles (id, user_id, company_name, categories[], service_areas[], verification_status, ...)
handwerker_subscriptions (user_id, plan_type, proposals_limit, proposals_used_this_period, current_period_start, current_period_end, pending_plan, ...)
handwerker_service_areas (handwerker_id, start_plz, end_plz, label)
handwerker_documents (user_id, document_type, document_url, expiry_date, ...)

-- Leads & Proposals
leads (id, owner_id, category, canton, city, zip, title, description, status, proposal_deadline, ...)
lead_proposals (id, lead_id, handwerker_id, price_min, price_max, message, status, ...)
lead_views (lead_id, viewer_id, viewed_at)

-- Communication
conversations (id, lead_id, homeowner_id, handwerker_id, ...)
messages (id, conversation_id, sender_id, recipient_id, content, ...)

-- Reviews
reviews (id, lead_id, reviewer_id, reviewed_id, rating, comment, handwerker_response, ...)

-- Notifications
admin_notifications (id, type, title, message, related_id, read, ...)
handwerker_notifications (id, user_id, type, title, message, ...)
client_notifications (id, user_id, type, title, message, ...)

-- Payments
payment_history (user_id, amount, plan_type, payment_provider, status, ...)
```

### Key Enums

```sql
app_role: 'user' | 'handwerker' | 'admin' | 'super_admin'
lead_status: 'draft' | 'active' | 'completed' | 'expired' | 'cancelled'
proposal_status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
handwerker_category: 'electrician' | 'plumber' | 'carpenter' | ... (15+ categories)
canton: 'ZH' | 'BE' | 'LU' | ... (26 Swiss cantons)
urgency_level: 'emergency' | 'urgent' | 'normal' | 'planning'
budget_type: 'fixed' | 'hourly' | 'estimate'
```

---

## 5. Database Functions (RPC)

| Function | Purpose |
|----------|---------|
| `can_submit_proposal(user_id)` | Quota check + auto-reset (30-day rolling) |
| `get_user_role(user_id)` | Return app_role for RLS policies |
| `has_role(user_id, role)` | Boolean role check for RLS |
| `handwerker_has_proposal_on_lead(lead_id)` | RLS helper to prevent recursion |
| `handle_new_user()` | Trigger: Create profile + default role |
| `increment_proposal_count()` | Trigger: Increment usage on proposal insert |

---

## 6. Edge Functions

### Email Notifications
| Function | Trigger |
|----------|---------|
| `send-lead-notification` | Lead becomes active → email matching handwerkers |
| `send-proposal-notification` | Proposal submitted → email lead owner |
| `send-acceptance-emails` | Proposal accepted → email both parties |
| `send-message-notification` | New message → email recipient |
| `send-rating-notification` | Review submitted → email handwerker |
| `send-rating-response-notification` | Response added → email reviewer |
| `send-approval-email` | Handwerker approved → email with payment link |
| `send-rejection-email` | Handwerker rejected → email with reason |
| `send-handwerker-credentials` | Account created → email with login |
| `proposal-deadline-reminder` | Cron: 48h before deadline → email handwerkers |
| `document-expiry-reminder` | Cron: 30/14/7 days before expiry |
| `send-pending-payment-reminder` | Cron: Remind unpaid pending_plan users |

### Admin/System
| Function | Purpose |
|----------|---------|
| `create-admin-user` | Create admin with proper roles |
| `create-handwerker-account` | Admin creates handwerker directly |
| `create-handwerker-self-registration` | Public registration flow |
| `delete-user` | Full cascade deletion with audit |
| `check-admin-role` | Verify admin access for protected ops |
| `lead-expiry-check` | Cron: Expire leads past deadline |
| `cleanup-orphaned-records` | Cron: Clean up dangling data |

### Payment
| Function | Purpose |
|----------|---------|
| `create-payrexx-gateway` | Generate Payrexx payment link |
| `payrexx-webhook` | Handle payment confirmations |

### SEO/Content
| Function | Purpose |
|----------|---------|
| `generate-sitemap` | Dynamic XML sitemap |
| `submit-to-indexing` | Google Indexing API submission |

---

## 7. Frontend Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (Badge, Button, Card, ...)
│   ├── admin/                 # Admin-specific components
│   └── [Feature]Component.tsx # Feature components
├── pages/
│   ├── admin/                 # Admin pages
│   ├── legal/                 # Legal pages (AGB, Datenschutz, ...)
│   └── [Page].tsx             # Main pages
├── hooks/
│   ├── useSubscription.ts     # Quota state (SSOT)
│   ├── useUserRole.ts         # Role caching
│   └── use[Feature].ts        # Feature hooks
├── lib/
│   ├── swissTime.ts           # Timezone utilities (SSOT)
│   ├── roleHelpers.ts         # Role utilities (SSOT)
│   ├── leadHelpers.ts         # Lead utilities
│   └── [domain]Helpers.ts     # Domain utilities
├── config/
│   ├── subscriptionPlans.ts   # Plan definitions (SSOT)
│   ├── categoryLabels.ts      # Category translations
│   └── [config].ts            # Static configs
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client
│       └── types.ts           # Generated types (read-only)
└── types/
    └── entities.ts            # Shared TypeScript types
```

### Key Design Patterns

#### 1. Single Source of Truth (SSOT)
- **Roles**: `roleHelpers.ts` → `useUserRole.ts`
- **Subscriptions**: `useSubscription.ts`
- **Time/Dates**: `swissTime.ts` (Europe/Zurich)
- **Plans**: `subscriptionPlans.ts`
- **Categories**: `categoryLabels.ts`

#### 2. React Query for Data
```tsx
// All data fetching uses React Query for caching
const { data, isLoading } = useQuery({
  queryKey: ['leads', filters],
  queryFn: () => supabase.from('leads').select('*')
});
```

#### 3. Toast for Notifications
```tsx
// SSOT for user feedback
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
toast({ title: 'Success', description: 'Action completed' });
```

#### 4. Auth Pattern (Deferred Operations)
```tsx
// All async operations in onAuthStateChange are deferred
supabase.auth.onAuthStateChange((event, session) => {
  setTimeout(() => {
    // Async operations here to prevent deadlocks
  }, 0);
});
```

---

## 8. Security Architecture

### Row Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────┐
│                    RLS POLICY PATTERNS                       │
├─────────────────────────────────────────────────────────────┤
│  User Data:     auth.uid() = user_id                        │
│  Admin Access:  get_user_role(auth.uid()) = 'admin'         │
│  Handwerker:    has_role(auth.uid(), 'handwerker')          │
│  Cross-table:   SECURITY DEFINER functions (no recursion)   │
│  Public Read:   USING (true) for SELECT only                │
└─────────────────────────────────────────────────────────────┘
```

### Edge Function Security
- All functions use `SUPABASE_SERVICE_ROLE_KEY` for elevated access
- CORS configured via `_shared/cors.ts`
- Input validation at function entry

### Storage Security
- `handwerker-documents`: Authenticated upload, owner-only read
- `lead-media`: Public read, owner-only write
- `handwerker-portfolio`: Public read, owner-only write

---

## 9. Subscription System

### Plan Definitions (`subscriptionPlans.ts`)

```typescript
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Gratis',
    price: 0,
    proposalsLimit: 5,        // 5 per 30-day period
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 49,
    proposalsLimit: -1,       // Unlimited
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 99,
    proposalsLimit: -1,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    proposalsLimit: -1,
  },
};
```

### Quota Enforcement Flow

```
┌──────────────────┐
│ Proposal Submit  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  1. Frontend: useSubscription.isDepleted │
│     → Show upgrade toast if depleted     │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  2. DB: can_submit_proposal() RPC        │
│     → Check current_period_end           │
│     → Auto-reset if expired (30 days)    │
│     → Return true/false                  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  3. DB Trigger: increment_proposal_count │
│     → Increment proposals_used_this_period
└──────────────────────────────────────────┘
```

---

## 10. Timezone Handling

### Swiss Timezone (Europe/Zurich)

**SSOT**: `src/lib/swissTime.ts`

```typescript
// All time operations use these helpers
import { 
  formatDate,           // dd.MM.yyyy
  formatDateTime,       // dd.MM.yyyy HH:mm
  formatTimeAgo,        // vor 2 Stunden
  formatBudget,         // CHF 1'000 - 2'000
  toSwissTime,          // Convert to Swiss TZ
  fromSwissTime,        // Convert to UTC for storage
} from '@/lib/swissTime';
```

### Database Timezone
- Storage: UTC (PostgreSQL default)
- Conversion: `AT TIME ZONE 'Europe/Zurich'`
- DST-safe: Uses `date_trunc()` for period boundaries

---

## 11. Notification System

### Notification Types

| Type | Trigger | Recipient |
|------|---------|-----------|
| `new_lead` | Lead activated | Admins |
| `new_handwerker_registration` | Registration submitted | Admins |
| `new_proposal` | Proposal submitted | Lead owner |
| `proposal_accepted` | Proposal accepted | Handwerker |
| `proposal_rejected` | Proposal rejected | Handwerker |
| `new_message` | Message sent | Recipient |
| `new_review` | Review submitted | Handwerker |
| `review_response` | Response added | Reviewer |
| `document_expiry` | Document expiring | Handwerker |

### UI Indicators
- **Admin**: `AdminNotifications.tsx` - Bell icon in header
- **Handwerker**: `HandwerkerNotifications.tsx` + tab badges
- **Client**: `ClientNotifications.tsx` - Bell icon in header

---

## 12. Admin Panel

### Pages

| Page | Purpose |
|------|---------|
| `AdminDashboard` | Overview stats, recent activity |
| `HandwerkerApprovals` | Approve/reject registrations |
| `HandwerkerManagement` | Manage existing handwerkers |
| `ClientManagement` | Manage clients (homeowners) |
| `AdminLeadsManagement` | View/edit all leads |
| `ReviewsManagement` | Moderate reviews |
| `AdminPayments` | Payment history, subscriptions |
| `ContentManagement` | CMS for page content |
| `SEOTools` | Meta tags, sitemap, indexing |
| `GTMConfiguration` | Google Tag Manager settings |

### Access Control
- All admin routes require `admin` or `super_admin` role
- Protected via `useAuthGuard` hook + route guards
- RLS policies enforce server-side

---

## 13. Key Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| Payrexx | Swiss payment processing | `PAYREXX_INSTANCE`, `PAYREXX_API_KEY` |
| Stripe | Alternative payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| SMTP2GO | Email delivery | `SMTP2GO_API_KEY` |
| Mapbox | Location maps | Public token in code |
| Google Indexing | SEO indexing | Service account in secrets |

---

## 14. Performance Optimizations

1. **React Query Caching**: All data fetched via useQuery with smart cache keys
2. **RLS SECURITY DEFINER**: Prevents recursion in cross-table policies
3. **Database Indexes**: `search_text` tsvector for full-text search
4. **Lazy Loading**: Routes loaded via React.lazy()
5. **Image Optimization**: Supabase Storage with public CDN

---

## 15. Monitoring & Debugging

### Logging
- Edge function logs: Supabase Dashboard → Functions → Logs
- Database logs: Supabase Dashboard → Logs → Postgres
- Auth logs: Supabase Dashboard → Logs → Auth

### Error Tracking
- `src/lib/errorTracking.ts` - Centralized error handling
- Toast notifications for user-facing errors
- Console logging for development

---

## Version History

| Date | Change |
|------|--------|
| 2024-06 | Initial architecture |
| 2024-12 | Subscription system added |
| 2025-01 | Payrexx integration |
| 2025-02 | Swiss timezone SSOT |
| 2025-02 | 30-day rolling quota periods |

---

*Last updated: February 2025*
