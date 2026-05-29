# Büeze Codebase Audit Report

**Datum:** 2026-03-05
**Auditor:** Senior Full-Stack Auditor (AI-gestützt)
**Scope:** Gesamte Codebase (Frontend + Supabase Backend + Edge Functions)

---

## TEIL 1 — VOLLSTÄNDIGE ARCHITEKTUR-ÜBERSICHT

### 1.1 Dateibaum & Verantwortlichkeiten

#### Frontend (`src/`)

| Datei | Tag | Verantwortlichkeit |
|-------|-----|-------------------|
| `App.tsx` | `[Config]` | Root-Routing, Provider-Setup, Auth-Listener, Lazy Loading |
| `main.tsx` | `[Config]` | React-Entry, DOM-Mount |
| **Contexts** | | |
| `contexts/AdminAuthContext.tsx` | `[Store]` | Admin-Auth-State + Role-Check (30s Cache) |
| `contexts/ViewModeContext.tsx` | `[Store]` | Admin-View-Switching (Handwerker/Client simulieren) |
| **Pages (24 Seiten + 14 Admin)** | | |
| `pages/Index.tsx` | `[UI]` | Homepage (Hero, HowItWorks, Categories, FAQ) |
| `pages/Auth.tsx` | `[UI]` | Login/Register mit Tab-Wechsel |
| `pages/Dashboard.tsx` | `[UI]` | Client-Dashboard (Leads, Proposals, Rating-Prompts) |
| `pages/HandwerkerDashboard.tsx` | `[UI]` | Handwerker-Dashboard (1826 Zeilen — **zu gross**) |
| `pages/BrowseLeads.tsx` | `[UI]` | Lead-Suche mit Filtern |
| `pages/SubmitLead.tsx` | `[UI]` | Multi-Step Lead-Formular |
| `pages/Messages.tsx` | `[UI]` | Chat-Interface mit Realtime |
| `pages/Profile.tsx` | `[UI]` | Profil-Verwaltung + Subscription |
| `pages/Checkout.tsx` | `[UI]` | Payrexx Payment-Flow |
| `pages/ProposalsManagement.tsx` | `[UI]` | Proposal-Übersicht/-Verwaltung |
| `pages/HandwerkerProfileEdit.tsx` | `[UI]` | Handwerker-Profilbearbeitung |
| `pages/LeadDetails.tsx` | `[UI]` | Lead-Detailansicht |
| `pages/OpportunityView.tsx` | `[UI]` | Handwerker-Ansicht eines Leads |
| `pages/ProposalReview.tsx` | `[UI]` | Proposal-Detail + Accept/Reject |
| `pages/ResetPassword.tsx` | `[UI]` | Passwort-Reset-Flow |
| `pages/MagicLinkHandler.tsx` | `[UI]` | Magic-Link-Token-Validierung |
| `pages/CategoryLanding.tsx` | `[UI]` | SEO-Landing per Kategorie |
| `pages/KategorienLanding.tsx` | `[UI]` | Kategorie-Übersicht |
| `pages/MajorCategoryLanding.tsx` | `[UI]` | Hauptkategorie-Landing |
| `pages/HandwerkerLanding.tsx` | `[UI]` | Handwerker-CTA-Page |
| `pages/HandwerkerVerzeichnis.tsx` | `[UI]` | Öffentliches Verzeichnis |
| `pages/TestDashboard.tsx` | `[UI]` | **Test-Page in Produktion** |
| `pages/Sitemap.tsx` | `[UI]` | XML-Sitemap |
| **Admin Pages** | | |
| `pages/admin/AdminDashboard.tsx` | `[UI]` | Admin-Übersicht mit KPIs |
| `pages/admin/HandwerkerManagement.tsx` | `[UI]` | Handwerker CRUD + Approval |
| `pages/admin/HandwerkerApprovals.tsx` | `[UI]` | **Duplikat** von HandwerkerManagement |
| `pages/admin/ClientManagement.tsx` | `[UI]` | Client-Verwaltung |
| `pages/admin/UserManagement.tsx` | `[UI]` | User/Role-Verwaltung |
| `pages/admin/AdminLeadsManagement.tsx` | `[UI]` | Lead-Verwaltung |
| `pages/admin/ReviewsManagement.tsx` | `[UI]` | Review-Moderation |
| `pages/admin/AdminPayments.tsx` | `[UI]` | Payment-Übersicht |
| `pages/admin/ContentManagement.tsx` | `[UI]` | CMS-Verwaltung |
| `pages/admin/ContentEditor.tsx` | `[UI]` | CMS-Editor |
| `pages/admin/SEOTools.tsx` | `[UI]` | SEO-Settings |
| `pages/admin/BulkMetaManager.tsx` | `[UI]` | Bulk-Meta-Tags |
| `pages/admin/GTMConfiguration.tsx` | `[UI]` | GTM-Einstellungen |
| `pages/admin/DeletionAudit.tsx` | `[UI]` | GDPR-Löschprotokoll |
| **Hooks (10)** | | |
| `hooks/useUserRole.ts` | `[Hook]` | SSOT für Rollen (5min Cache) |
| `hooks/useAuthGuard.ts` | `[Hook]` | Auth-Guard mit Role-Check |
| `hooks/useSubscription.ts` | `[Hook]` | Subscription-State + Usage |
| `hooks/usePageContent.ts` | `[Hook]` | CMS-Content via React Query |
| `hooks/useMultiStepForm.ts` | `[Hook]` | Multi-Step-Navigation |
| `hooks/useProposalFormValidation.ts` | `[Hook]` | Proposal-Formularvalidierung |
| `hooks/useHandwerkerDocuments.ts` | `[Hook]` | Dokument-Management |
| `hooks/useSiteSettings.ts` | `[Hook]` | Admin-Site-Settings |
| `hooks/use-toast.ts` | `[Hook]` | Toast-Notification-State |
| `hooks/use-mobile.tsx` | `[Hook]` | Mobile-Erkennung (768px) |
| **Lib (21 Dateien)** | | |
| `lib/utils.ts` | `[Util]` | Tailwind `cn()` Helper |
| `lib/swissTime.ts` | `[Util]` | Schweizer Zeitzone + Formatierung |
| `lib/proposalHelpers.ts` | `[Util]` | Proposal Accept/Reject (SSOT) |
| `lib/proposalQueries.ts` | `[Util]` | Proposal-Withdrawal |
| `lib/leadHelpers.ts` | `[Util]` | Lead-Matching + Status-Ops |
| `lib/roleHelpers.ts` | `[Util]` | Role-CRUD |
| `lib/fileUpload.ts` | `[Util]` | File-Upload zu Supabase Storage |
| `lib/errorTracking.ts` | `[Util]` | Sentry + Correlation IDs |
| `lib/errorCategories.ts` | `[Util]` | Error-Kategorisierung |
| `lib/fetchHelpers.ts` | `[Util]` | Fetch mit Retry + Backoff |
| `lib/queryInvalidation.ts` | `[Util]` | React Query Cache Keys (SSOT) |
| `lib/validationHelpers.ts` | `[Util]` | Passwort-Validierung |
| `lib/reviewValidation.ts` | `[Util]` | Review-Spam/Profanity-Filter |
| `lib/spamProtection.ts` | `[Util]` | Honeypot + Rate-Limiting |
| `lib/profileCompleteness.ts` | `[Util]` | Profil-Vollständigkeit |
| `lib/serviceAreaHelpers.ts` | `[Util]` | Service-Area Parsing |
| `lib/cantonPostalCodes.ts` | `[Util]` | Kanton↔PLZ Mapping |
| `lib/swissPostalCodes.ts` | `[Util]` | PLZ-Lookup (JSON, lazy-load) |
| `lib/schemaHelpers.ts` | `[Util]` | SEO Structured Data |
| `lib/idempotency.ts` | `[Util]` | Idempotenz-Tracking |
| `lib/localStorageVersioning.ts` | `[Util]` | Versionierter LocalStorage |
| **Config (13 Dateien)** | | |
| `config/siteConfig.ts` | `[Config]` | Site-Name, URLs |
| `config/roles.ts` | `[Config]` | Rollen-Definitionen |
| `config/subscriptionPlans.ts` | `[Config]` | Plan-Preise + Limits |
| `config/categoryLabels.ts` | `[Config]` | Kategorie-Labels (SSOT) |
| `config/subcategoryLabels.ts` | `[Config]` | Subkategorie-Details |
| `config/majorCategories.ts` | `[Config]` | Kategorie-Hierarchie |
| `config/leadStatuses.ts` | `[Config]` | Lead-Status-Enum |
| `config/urgencyLevels.ts` | `[Config]` | Dringlichkeits-Levels |
| `config/cantons.ts` | `[Config]` | Schweizer Kantone |
| `config/navigation.ts` | `[Config]` | Role-basierte Navigation |
| `config/messageTemplates.ts` | `[Config]` | Chat-Vorlagen |
| `config/contentDefaults.ts` | `[Config]` | CMS-Fallback-Content |
| `config/languages.ts` | `[Config]` | Sprach-Optionen |
| **Types** | | |
| `types/entities.ts` | `[Type]` | Frontend-Entity-Interfaces |
| `integrations/supabase/types.ts` | `[Type]` | Auto-generierte DB-Typen (SSOT) |
| **Components (50+)** | | |
| UI-Primitives in `components/ui/` | `[UI]` | shadcn/ui Basis-Komponenten |
| Feature-Komponenten in `components/` | `[UI]` | Business-spezifische UI |

#### Backend (`supabase/`)

| Datei | Tag | Verantwortlichkeit |
|-------|-----|-------------------|
| `functions/_shared/cors.ts` | `[Util]` | CORS Headers + Response-Helpers |
| `functions/_shared/supabaseClient.ts` | `[Service]` | Admin-Supabase-Client |
| `functions/_shared/smtp2go.ts` | `[Service]` | Email-Versand (3x Retry) |
| `functions/_shared/emailTemplates.ts` | `[Util]` | 20+ HTML-Email-Templates |
| `functions/_shared/siteConfig.ts` | `[Config]` | Frontend-URL, Site-Name |
| `functions/_shared/categoryLabels.ts` | `[Config]` | Kategorie-Labels (**Duplikat**) |
| `functions/_shared/subcategoryLabels.ts` | `[Config]` | Subkategorie-Labels (**Duplikat**) |
| `functions/_shared/planLabels.ts` | `[Config]` | Plan-Preise + Names |
| `functions/_shared/profileHelpers.ts` | `[Util]` | Profil-Fetch + Magic-Token |
| `functions/_shared/dateFormatter.ts` | `[Util]` | Datum/Zeit CH-Format |
| `functions/_shared/errorUtils.ts` | `[Util]` | Error-Message-Extraktion |
| 30+ Edge Functions | `[Service]` | Siehe Abschnitt 1.4 |
| 130+ SQL Migrations | `[Migration]` | Schema + RLS + Triggers |

### 1.2 Namenskonventionen

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Dateinamen konsistent? | ⚠️ | Gemischt: `PascalCase` für Komponenten (gut), `camelCase` für Libs (gut), aber `kebab-case` für `use-toast.ts` vs `useUserRole.ts` |
| Komponenten = Dateinamen? | ✅ | Konsistent (PascalCase Dateien = PascalCase Exports) |
| Hook-Namen `useXyz`? | ✅ | Alle Hooks folgen dem Pattern |
| DB-Tabellen snake_case? | ✅ | Konsistent (handwerker_profiles, lead_proposals, etc.) |
| Gemischte Sprachen? | ⚠️ | Deutsch/Englisch gemischt: `HandwerkerDashboard`, `KategorienLanding`, `auftrag-erfolgreich` (Route) vs. `LeadDetails`, `BrowseLeads` |

### 1.3 Ordnerstruktur

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Klares Pattern? | ⚠️ | **Layer-based** (pages/, components/, hooks/, lib/, config/) — funktional, aber Feature-Cohesion fehlt |
| Zusammengehöriges nah? | ❌ | Proposal-Logik verteilt über: `lib/proposalHelpers.ts`, `lib/proposalQueries.ts`, `hooks/useProposalFormValidation.ts`, `pages/ProposalsManagement.tsx`, `components/ReceivedProposals.tsx` |
| Verwaiste Ordner? | ⚠️ | `html-export/` — scheint Export/Mockup, nicht in Build integriert |
| Shared-Bereich? | ✅ | `lib/`, `config/`, `components/ui/` dienen als Shared-Layer |

### 1.4 Supabase Datenbankschema

**37 Tabellen identifiziert** (aus types.ts):

#### Core-Tabellen
| Tabelle | Zweck | Beziehungen |
|---------|-------|-------------|
| `profiles` | User-Master (id, email, full_name, phone) | FK → auth.users |
| `handwerker_profiles` | Handwerker-Daten (company, categories[], service_areas) | FK user_id → profiles |
| `leads` | Aufträge (category, city, canton, budget, urgency, status) | FK owner_id → profiles |
| `lead_proposals` | Offerten (price, timeframe, status) | FK lead_id → leads, handwerker_id → handwerker_profiles |
| `conversations` | Chat-Konversationen | FK handwerker_id, homeowner_id |
| `messages` | Chat-Nachrichten | FK conversation_id → conversations |
| `reviews` | Bewertungen (1-5 Sterne) | FK reviewer_id, reviewed_id → profiles |
| `handwerker_subscriptions` | Abo-Verwaltung (plan_type, proposals_limit) | FK user_id |
| `payment_history` | Zahlungen (Payrexx) | FK user_id, UNIQUE payrexx_transaction_id |
| `magic_tokens` | One-time Auth Links | FK user_id, TTL expires_at |
| `handwerker_documents` | Dokumente + Verfall | FK user_id, handwerker_profile_id |
| `handwerker_service_areas` | Kanton/PLZ Service-Gebiete | FK handwerker_id |
| `user_roles` | Rollen (admin, super_admin, handwerker, client) | FK user_id |
| `deletion_audit` | GDPR-Löschprotokoll | Standalone |

#### Analytics/SEO-Tabellen (möglicherweise unused)
| Tabelle | Status |
|---------|--------|
| `ab_test_results` | ⚠️ Keine Frontend-Referenz gefunden |
| `clarity_insights` | ⚠️ Keine Frontend-Referenz gefunden |
| `clarity_sessions` | ⚠️ Keine Frontend-Referenz gefunden |
| `optimization_suggestions` | ⚠️ Keine Frontend-Referenz gefunden |
| `pmax_analytics` | ⚠️ Keine Frontend-Referenz gefunden |
| `snippets` | ⚠️ Keine Frontend-Referenz gefunden |
| `form_submissions` | ⚠️ Keine Frontend-Referenz gefunden |
| `contact_requests` | ⚠️ Keine Frontend-Referenz gefunden |
| `resources` | ⚠️ Keine Frontend-Referenz gefunden |
| `countries` | ⚠️ Keine Frontend-Referenz gefunden |

**DB-Enums (aus types.ts):**
- `app_role`: admin, super_admin, handwerker, client
- `budget_type`: fixed, hourly, estimate
- `canton`: 26 Schweizer Kantone
- `handwerker_category`: 80+ Kategorien
- `lead_status`: active, paused, completed, expired, cancelled, deleted
- `proposal_status`: pending, accepted, rejected, withdrawn
- `subscription_plan`: free, monthly, 6_month, annual
- `urgency_level`: today, this_week, this_month, planning

**DB-Funktionen:**
- `can_submit_proposal()` — Proposal-Limit-Enforcement
- `check_lead_expiry()` — Ablauf-Prüfung
- `get_user_role()`, `has_role()` — Rollen-Abfrage
- `budget_ranges_overlap()` — Budget-Validierung
- `handwerker_has_proposal_on_lead()` — Duplikat-Check

### 1.5 Datenfluss-Diagramme

#### Lead-Submission-Flow
```
User → SubmitLead (Multi-Step Form)
  → useMultiStepForm() (Navigation-State)
  → spamProtection.runAllSpamChecks() (Honeypot + Rate-Limit)
  → supabase.from('leads').insert()
  → supabase.functions.invoke('send-lead-notification')
    → Edge Function: matching Handwerker (Kategorie + Service-Area)
    → smtp2go.sendEmails() → Handwerker-Benachrichtigung
  → Navigate('/auftrag-erfolgreich')
```

#### Proposal-Flow
```
Handwerker → OpportunityView (Lead-Detail)
  → useProposalFormValidation() (Form-State)
  → supabase.from('lead_proposals').insert()
  → Edge Function: send-proposal-notification
  → Client sieht Proposal in Dashboard/ReceivedProposals
  → Accept: proposalHelpers.acceptProposal() → Status-Update + Email
  → Reject: proposalHelpers.rejectProposal() → Status-Update + Email
```

#### Payment-Flow
```
Handwerker → Checkout
  → supabase.functions.invoke('create-payrexx-gateway')
    → Payrexx API → Gateway-URL
  → Redirect to Payrexx
  → Payrexx Webhook → payrexx-webhook Edge Function
    → HMAC-SHA256 Signature Validation
    → Amount Whitelist Validation (90/510/960 CHF)
    → Idempotent Upsert payment_history
    → Activate/Upgrade Subscription
    → Send Confirmation Email
  → Profile.tsx: Realtime Subscription auf handwerker_subscriptions
```

#### Auth-Flow
```
Login: Auth.tsx → supabase.auth.signInWithPassword()
  → onAuthStateChange('SIGNED_IN')
  → queryClient.clear() + clearRoleCache()
  → useUserRole() → fetch user_roles → cache (5min)
  → ProtectedRoute → useAuthGuard() → redirect if unauthorized

Magic-Link: MagicLinkHandler → validate-magic-token Edge Function
  → Token-Lookup → Auto-Login → Redirect to Resource

Admin: AdminAuthProvider → check user_roles for admin|super_admin
  → 30-second cache TTL
```

### 1.6 Auth-Flow Detail

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Login/Logout | ✅ | Supabase Auth, Cache-Clear auf Auth-Events |
| Protected Routes | ✅ | `<ProtectedRoute>` Wrapper + `useAuthGuard()` |
| User-Kontext SSOT | ✅ | `useUserRole()` mit 5min Cache |
| Token-Refresh | ✅ | Supabase SDK handles automatically |
| Redirect nach Login | ✅ | Via `useAuthGuard({ redirectTo })` |
| Session-Expiry | ⚠️ | Supabase Default (1 Stunde), kein Custom-Handling |
| Rollen-Konsistenz | ⚠️ | Frontend: `useUserRole()` vs Admin: `AdminAuthContext` — zwei separate Mechanismen |

---

## TEIL 2 — SSOT AUDIT

### 2.1 State Management

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Doppelter State? | ⚠️ | `useUserRole()` cached Rollen UND `AdminAuthContext` cached Rollen separat |
| Supabase-Spiegel ohne Sync? | ⚠️ | `HandwerkerDashboard.tsx` spiegelt viel DB-State lokal ohne Invalidierung |
| Optimistic Updates sync? | ❌ | `Messages.tsx` hat Optimistic, `Dashboard.tsx` nicht — inkonsistent |
| useState statt Store? | ⚠️ | Filter-State in `BrowseLeads.tsx` gehört in URL-Params |
| Derived State korrekt? | ✅ | `useSubscription()` berechnet Usage korrekt |
| URL-Param State? | ❌ | Filter/Pagination/Tabs nie in URL — nicht bookmarkbar |

### 2.2 Typen & Interfaces

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| SSOT für DB-Typen? | ✅ | `integrations/supabase/types.ts` auto-generiert |
| `supabase gen types`? | ✅ | Eingerichtet, Postgrest Version 12.2.3 |
| Typen aktuell? | ⚠️ | 1 TODO in `LeadDetails.tsx:55` deutet auf veraltete Typen |
| Manuelle Duplikate? | ⚠️ | `types/entities.ts` existiert neben auto-generierten Typen |
| Zod-Validierung konsistent? | ❌ | Zod in `Profile.tsx`, aber manuelles useState in `Auth.tsx`, `ProposalFormValidation` |
| `any`-Typen? | ⚠️ | `errorTracking.ts`, `leadHelpers.ts` verwenden `any` für Error-Handling |

### 2.3 Config & Environment

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| ENV-Variablen zentralisiert? | ⚠️ | Nur 3 Variablen in `.env`, aber Backend braucht mehr (SMTP2GO, PAYREXX, SENTRY) |
| Supabase nie hardcoded? | ✅ | Nur in `client.ts` via `import.meta.env` |
| Feature Flags zentralisiert? | ✅ | Keine Feature-Flags vorhanden (nicht nötig) |
| `.env.example`? | ❌ | **Fehlt komplett** |
| `.env` in `.gitignore`? | ❌ | **`.env` NICHT in `.gitignore`** — Supabase Anon-Key im Repo! |

### 2.4 Konstanten & Magic Values

| Problem | Datei:Zeile | Wert |
|---------|-------------|------|
| File-Size-Limits inkonsistent | `fileUpload.ts:4` vs `ProposalFileUpload.tsx` vs `DocumentUploadDialog.tsx` | 3MB / 5MB / 10MB an verschiedenen Stellen |
| Hardcoded Firmeninfo | `schemaHelpers.ts:44-55` | Adresse, Telefon, Email direkt im Code |
| Magic Time Constants | `spamProtection.ts:26,43` | `minSeconds=5`, `maxAttempts=3`, `windowMs=60000` |
| Hardcoded Bio-Minimum | `profileCompleteness.ts:32` | `bio.length >= 50` |
| Profanity-Liste | `reviewValidation.ts:7-13` | 23 deutsche Wörter hardcoded |

---

## TEIL 3 — DRY AUDIT

### 3.1 Duplizierte Logik

| Duplikat | Stellen | Empfehlung |
|----------|---------|------------|
| **Kategorie-Labels** | `config/categoryLabels.ts`, `config/subcategoryLabels.ts`, `functions/_shared/categoryLabels.ts`, `functions/_shared/subcategoryLabels.ts`, `send-lead-notification/index.ts` | Shared Package oder Build-Step der Backend-Labels aus Frontend generiert |
| **`getCantonFromPostalCode()`** | `cantonPostalCodes.ts:92` (sync), `swissPostalCodes.ts:122` (async, deprecated) | Deprecated Version löschen |
| **Status-Badge-Funktion** | `HandwerkerManagement.tsx`, `AdminLeadsManagement.tsx`, `ClientManagement.tsx` (je eigene `getStatusBadge()`) | Auslagern in `lib/statusBadges.ts` |
| **Datum-Formatierung** | `new Date(x).toLocaleDateString('de-CH')` in 8+ Admin-Seiten | `swissTime.formatSwissDate()` verwenden |
| **Error-Handling-Blöcke** | Try/catch + toast in fast jeder Page identisch | Shared `handleMutationError()` |
| **`select('*')`-Queries** | 33 Stellen im Frontend | Spezifische Felder selektieren |

### 3.2 Komponenten-Duplikate

| Duplikat | Details |
|----------|---------|
| `HandwerkerApprovals.tsx` vs `HandwerkerManagement.tsx` | Beide behandeln Handwerker-Approvals — konsolidieren |
| Loading/Error/Empty-States | Inkonsistent: manche Pages nutzen `EmptyState`, manche plain text |
| Admin-Page-Skeleton | Eigene `AdminPageSkeleton` + generische Skeletons — könnte vereinheitlicht werden |

### 3.3 Hook-Duplikate

| Duplikat | Details |
|----------|---------|
| Data-Fetching-Pattern | Gleicher `useEffect(() => { let isMounted = true; ... })` in 15+ Pages |
| Nur `usePageContent()` nutzt React Query | Alle anderen Hooks fetchen direkt via Supabase — sollte React Query nutzen |
| Form-Validation | Mischung aus React Hook Form + Zod, manueller useState-Validation, `useProposalFormValidation` |

---

## TEIL 4 — DEAD CODE & BLOAT AUDIT

### 4.1 Toter Code

| Fund | Datei:Zeile | Empfehlung |
|------|-------------|------------|
| **TestDashboard.tsx** — Test-Page erreichbar in Produktion | `pages/TestDashboard.tsx` (ganzes File) | Route entfernen oder hinter Admin-Guard |
| **testData.ts + testDataPopulation.ts** — Test-Utilities | `utils/testData.ts`, `utils/testDataPopulation.ts` | In Dev-Only verschieben oder löschen |
| **Deprecated `searchByPostalCode()`** — gibt leeres Array zurück | `swissPostalCodes.ts:139` | Löschen |
| **Deprecated `CANTON_NAMES`** | `cantonPostalCodes.ts:15` | Löschen |
| **Deprecated `getCantonFromPostalCode()`** | `swissPostalCodes.ts:122` | Löschen |
| **`idempotency.ts`** — scheint nirgends importiert | `lib/idempotency.ts` (ganzes File) | Prüfen und ggf. löschen |
| **Leere Migration** | `20260305160741_0c288af4.sql` (0 Zeilen) | Löschen |
| **`html-export/`** — nicht im Build referenziert | Ganzes Verzeichnis | Entfernen oder dokumentieren |
| **1 TODO-Kommentar** | `LeadDetails.tsx:55` | Beheben oder Ticket erstellen |
| **120 console.log/error** Statements | 40 Dateien, 120 Occurrences | Durch strukturiertes Logging ersetzen |
| **AdminViewSwitcher.tsx** | Nicht in Admin-Layout referenziert | Prüfen ob benötigt |

### 4.2 Potenziell ungenutzte DB-Tabellen

| Tabelle | Begründung |
|---------|------------|
| `ab_test_results` | Kein Frontend-Import gefunden |
| `clarity_insights` + `clarity_sessions` | Kein Frontend-Import |
| `optimization_suggestions` | Kein Frontend-Import |
| `pmax_analytics` | Kein Frontend-Import |
| `snippets` | Kein Frontend-Import |
| `form_submissions` | Kein Frontend-Import |
| `contact_requests` | Kein Frontend-Import |
| `resources` | Kein Frontend-Import |
| `countries` | Kein Frontend-Import |

### 4.3 Dependency-Analyse

| Package | Status | Details |
|---------|--------|---------|
| `mapbox-gl` (3.16.0) | ⚠️ | Schwer (~500KB), nur in `ServiceAreaMap.tsx` — Lazy-Load empfohlen |
| `recharts` (2.15.4) | ⚠️ | ~400KB, nur in Admin-Dashboard — bereits lazy-loaded via Route |
| `next-themes` (0.3.0) | ⚠️ | Next.js Paket in Vite-App — prüfen ob wirklich genutzt |
| `embla-carousel-react` | ⚠️ | Prüfen ob noch verwendet |
| `lovable-tagger` (devDep) | ✅ | Nur Dev |
| Keine bekannten CVEs | ✅ | Major-Versions aktuell |

### 4.4 Bundle-Analyse

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Tree-Shaking | ✅ | Named imports von lucide-react, date-fns |
| Code-Splitting | ✅ | Lazy Loading für alle Routes (gut implementiert) |
| Admin-Separate | ✅ | Eigener Suspense-Boundary für Admin |
| mapbox-gl Lazy? | ❌ | Import in ServiceAreaMap nicht lazy-loaded |

---

## TEIL 5 — CRUD & SAVE AUDIT

### 5.1 Vollständigkeits-Check

| Tabelle | CREATE | READ | UPDATE | DELETE | Notes |
|---------|--------|------|--------|--------|-------|
| **profiles** | ✅ Auth | ✅ Dashboard, Profile | ✅ Profile | ✅ Admin delete-user | Vollständig |
| **handwerker_profiles** | ✅ Onboarding | ✅ Dashboard, Verzeichnis | ✅ ProfileEdit | ✅ Admin delete-user | Vollständig |
| **leads** | ✅ SubmitLead | ✅ Dashboard, BrowseLeads | ✅ EditLead, Status-Ops | ✅ leadHelpers.deleteLead | Vollständig |
| **lead_proposals** | ✅ OpportunityView | ✅ ReceivedProposals | ✅ Accept/Reject/Withdraw | ❌ Kein Hard-Delete | Soft-Delete via Status |
| **conversations** | ✅ Messages (auto) | ✅ ConversationsList | ✅ last_message_at | ❌ Kein Delete | Ggf. GDPR-Lücke |
| **messages** | ✅ Messages | ✅ Messages (Realtime) | ❌ Kein Edit | ❌ Kein Delete | Ggf. GDPR-Lücke |
| **reviews** | ✅ RatingForm | ✅ CategoryRatings | ⚠️ Admin-Only | ❌ Kein User-Delete | Review-Moderation nur Admin |
| **subscriptions** | ✅ Auto (Webhook) | ✅ Profile, Checkout | ✅ Webhook | ❌ Kein Cancel | Abo-Kündigung fehlt? |
| **payment_history** | ✅ Webhook | ✅ PaymentHistoryTable | ❌ Immutable | ❌ N/A | Korrekt |
| **handwerker_documents** | ✅ DocumentUpload | ✅ useHandwerkerDocuments | ❌ Kein Edit | ✅ Delete + Storage | Gut |
| **magic_tokens** | ✅ Edge Functions | ✅ Validate-Token | ❌ N/A | ✅ Auto-Expire | Gut |

### 5.2 Save-Qualität

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Loading-Indikator beim Save? | ✅ | Buttons disabled + Spinner in den meisten Forms |
| Erfolgs-Feedback? | ✅ | Toast-Notifications |
| Fehler-Feedback? | ⚠️ | Technische Fehlermeldungen teilweise sichtbar |
| Formular nach Save reset? | ✅ | Multi-Step-Form resettet korrekt |
| Cache nach Mutation aktualisiert? | ⚠️ | `queryInvalidation.ts` vorhanden, aber nicht überall genutzt |
| Race Conditions? | ⚠️ | `acceptProposal()` hat optimistic locking, aber `submitProposal` nicht |
| Double-Submit-Schutz? | ✅ | `disabled={isSubmitting}` Pattern |
| Unsaved-Changes-Warnung? | ❌ | **Fehlt komplett** — Navigation vom Formular weg ohne Warnung |

### 5.3 Realtime & Stale Data

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Listen-Refresh nach Mutation? | ⚠️ | Inkonsistent — manche Pages refetchen, manche nicht |
| Realtime wo nötig? | ⚠️ | Nur Messages + Payment-Status haben Realtime |
| Stale-Data nach Navigation? | ⚠️ | React Query staleTime=2min — akzeptabel aber knapp |
| Subscription Cleanup? | ✅ | `channel.unsubscribe()` in Cleanup-Functions |

### 5.4 Offline/Netzwerkfehler

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Supabase nicht erreichbar? | ⚠️ | Fehler-Toast, aber kein Retry-UI |
| Retry-Logik? | ✅ | React Query retry=2, `fetchHelpers.ts` Backoff |
| Timeout-Handling? | ✅ | `fetchHelpers.ts` mit 10s Timeout |
| Verständliche Fehlermeldung? | ⚠️ | Technische Errors teilweise durchgereicht |

---

## TEIL 6 — SICHERHEIT

### 6.1 Supabase RLS & Policies

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| RLS für jede Tabelle? | ⚠️ | Nicht verifizierbar ohne DB-Zugang, aber Migrations zeigen RLS-Setup |
| Fremde Daten les-/schreibbar? | ⚠️ | Admin-Pages nutzen `select('*')` — Frontend-Auth ist kein Schutz |
| Service Keys nur serverseitig? | ✅ | `SERVICE_ROLE_KEY` nur in Edge Functions |
| SQL-Injection? | ✅ | PostgREST parametrisiert, keine Raw Queries |
| Storage Policies? | ⚠️ | Nicht aus Code ersichtlich |

### 6.2 Input-Validierung

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| User-Input validiert? | ⚠️ | Frontend: Zod/Manual, DB: Trigger-Validation, aber Lücken |
| XSS-Risiken? | ✅ | Nur 1x `dangerouslySetInnerHTML` (chart.tsx, shadcn Library) |
| File-Upload geprüft? | ✅ | Typ + Grösse validiert, aber Limits inkonsistent |
| URL-Parameter validiert? | ⚠️ | Route-Params wie `:id` nicht gegen UUID validiert |

### 6.3 Kritische Sicherheitsprobleme

| Problem | Schwere | Details |
|---------|---------|---------|
| **`.env` nicht in `.gitignore`** | 🔴 KRITISCH | Supabase Anon-Key im Git-Repository |
| **`.env.example` fehlt** | 🟠 Wichtig | Dokumentation der benötigten Variablen fehlt |
| **Admin-Mutations ohne Server-Auth** | 🟠 Wichtig | Admin-Pages mutieren direkt via Supabase Client — Schutz nur via Frontend-Guard |
| **`send-lead-notification` ohne Auth** | 🟠 Wichtig | Edge Function ohne JWT/Token — potentiell von aussen aufrufbar |
| **`PAYREXX_TEST_MODE` Bypass** | 🟠 Wichtig | Kann in Prod aktiviert werden → fake Payments |
| **CORS: Allow-Origin: *` auf allen Edge Functions** | 🟡 Niedrig | Akzeptabel für Public API, aber einschränken empfohlen |
| **console.log-Statements (120 Stück)** | 🟡 Niedrig | Könnten sensitive Daten loggen |

### 6.4 Edge Functions Auth-Muster

| Funktion | verify_jwt | Eigene Auth | Bewertung |
|----------|-----------|-------------|-----------|
| `create-payrexx-gateway` | false | Bearer Token | ✅ OK |
| `payrexx-webhook` | false | HMAC-SHA256 | ✅ Stark |
| `delete-user` | false | Bearer + Admin-Role | ✅ Stark |
| `create-handwerker-account` | false | Bearer + Admin-Role | ✅ OK |
| `send-lead-notification` | false | **Keine** | 🔴 Lücke |
| `check-admin-role` | true | JWT | ✅ OK |
| `create-admin-user` | true | JWT | ✅ OK |

---

## TEIL 7 — PERFORMANCE AUDIT

### 7.1 Datenbank-Performance

| Problem | Schwere | Details |
|---------|---------|---------|
| **`select('*')` — 33 Stellen** | 🟠 | Unnötige Daten transferiert, z.B. `BrowseLeads.tsx:79` |
| **Fehlende Pagination in Admin** | 🟠 | `AdminLeadsManagement`, `HandwerkerManagement` laden ALLE Records |
| **N+1 in Admin-Pages** | 🟠 | `AdminLeadsManagement`: per-Lead Proposal-Fetch |
| **`send-lead-notification`: O(n) Matching** | 🟡 | Alle Handwerker in Memory, lokal gefiltert |
| **Indexes vorhanden** | ✅ | Migrations zeigen Index-Erstellung für RLS-Subqueries |
| **`can_submit_proposal()` DB-Function** | ✅ | Gute Server-Side-Enforcement |

### 7.2 Frontend-Performance

| Problem | Schwere | Details |
|---------|---------|---------|
| **HandwerkerDashboard.tsx: 1826 Zeilen** | 🟠 | Massive Komponente, schwer zu optimieren |
| **BrowseLeads Filter: kein Debounce** | 🟠 | Re-filtert bei jedem Keystroke |
| **Lazy Loading für Routes** | ✅ | Gut implementiert |
| **mapbox-gl nicht lazy** | 🟡 | ~500KB nicht Code-Split |
| **Fehlende useMemo/useCallback** | 🟡 | Filter-Funktionen in BrowseLeads neu erstellt bei jedem Render |
| **Keine Liste-Virtualisierung** | 🟡 | Lange Listen (Handwerker, Leads) nicht virtualisiert |

### 7.3 Netzwerk-Performance

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Unnötige API-Calls? | ⚠️ | Mehrere Pages fetchen gleiche Daten (Profil, Rolle) |
| Caching? | ✅ | React Query mit staleTime=2min, gcTime=5min |
| Wasserfall-Requests? | ⚠️ | Dashboard.tsx: Auth → Role → Profile → Data (sequentiell) |

---

## TEIL 8 — BARRIEREFREIHEIT (a11y)

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Focus-Styles? | ✅ | shadcn/ui bringt Default-Focus-Rings |
| Alt-Texte? | ⚠️ | Nicht systematisch geprüft, Hero-Images sollten Alt haben |
| Semantisches HTML? | ✅ | shadcn/ui nutzt `<button>`, `<dialog>`, etc. |
| Tastatur-Navigation? | ✅ | Radix UI Primitives unterstützen Keyboard |
| Form-Labels? | ⚠️ | Manche Formulare nutzen nur Placeholder |
| ARIA-Attribute? | ✅ | Via shadcn/ui Primitives |
| Farbkontraste? | ⚠️ | Nicht geprüft, Tailwind-Theme abhängig |
| Heading-Hierarchie? | ⚠️ | Nicht systematisch geprüft |

---

## TEIL 9 — RESPONSIVE DESIGN

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Mobile/Tablet/Desktop? | ✅ | `use-mobile.tsx` Hook, responsive Breakpoints |
| Tailwind Breakpoints? | ✅ | sm/md/lg/xl konsistent genutzt |
| Touch-Targets? | ⚠️ | Nicht systematisch geprüft |
| Modals auf Mobile? | ✅ | Sheet-Komponente für Mobile Sidebar |
| Horizontaler Overflow? | ⚠️ | Admin-Tabellen könnten overflown auf Mobile |
| `MobileStickyFooter.tsx` | ✅ | Mobile-First CTA |

---

## TEIL 10 — TESTING

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Unit Tests? | ❌ | **Keine Tests im Repository** |
| Integration Tests? | ❌ | Keine |
| E2E Tests? | ❌ | Keine (Playwright/Cypress nicht installiert) |
| Error Boundaries? | ✅ | `ErrorBoundary.tsx` + `RouteErrorBoundary.tsx` |
| Sentry Integration? | ✅ | `errorTracking.ts` mit Sentry |
| Console-Logging? | ⚠️ | 120 Stellen — kein strukturiertes Logging |

---

## TEIL 11 — i18n / Lokalisierung

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Strings externalisiert? | ❌ | Alle Strings hardcoded in Deutsch |
| i18n-Framework? | ❌ | Keines — App ist nur Deutsch |
| Datum/Zeit lokalisiert? | ✅ | `swissTime.ts` mit `de` Locale |
| Zahlen/Währung? | ✅ | `formatCurrency()` für CHF |
| Error-Messages? | ❌ | Alle hardcoded Deutsch |
| Profanity nur Deutsch | ⚠️ | `reviewValidation.ts` — nur deutsche Wörter |

**Bewertung:** App ist explizit auf Deutsch/Schweiz ausgerichtet. i18n ist aktuell kein Requirement, aber Datum/Zahlenformatierung ist korrekt.

---

## TEIL 12 — MIGRATIONS & DEPLOYMENT

### 12.1 Migrations

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Sequentiell nummeriert? | ✅ | Timestamp-basiert (2025-09 bis 2026-03) |
| Widersprüchliche Migrations? | ⚠️ | 130+ Migrations — schwer zu überblicken |
| Reversibilität? | ❌ | Keine Down-Migrations sichtbar |
| Leere Migration | ⚠️ | `20260305160741_0c288af4.sql` hat 0 Zeilen |
| Recent Fixes (Feb/Mar 2026) | ✅ | FK-Constraints, Indexes, Proposal-Limits, Trigger-Fixes |

### 12.2 CI/CD

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Build-Pipeline? | ⚠️ | `vercel.json` vorhanden, aber keine CI-Config (GitHub Actions) |
| Auto-Migrations? | ❌ | Kein automatisches Migration-Deployment |
| Type-Checks in Pipeline? | ❌ | Kein CI — ESLint/TS-Check nicht erzwungen |
| Rollback-Strategie? | ❌ | Keine dokumentiert |

---

## TEIL 13 — ABSCHLUSS-REPORT

### 🔴 Kritische Probleme (sofort beheben)

| # | Problem | Datei:Zeile | Fix |
|---|---------|-------------|-----|
| 1 | **`.env` nicht in `.gitignore`** — Supabase Key im Repo | `.gitignore` | `.env` zu `.gitignore` hinzufügen, `.env.example` erstellen, Secrets rotieren |
| 2 | **Keine Tests** — kein einziger Unit/Integration/E2E-Test | Projekt-weit | Mindestens kritische Flows testen (Auth, Payments, Proposals) |
| 3 | **`send-lead-notification` ohne Auth** | `supabase/functions/send-lead-notification/index.ts` | Auth-Check hinzufügen oder als interne Funktion markieren |
| 4 | **Admin-Mutations direkt via Supabase Client** — Frontend-Auth ist kein Schutz | `pages/admin/*.tsx` | Sensitive Ops via Edge Functions mit Server-Auth |
| 5 | **TestDashboard.tsx in Produktion erreichbar** | `App.tsx:~line 186` (keine Route sichtbar, aber File existiert) | Route entfernen oder hinter Admin-Guard |
| 6 | **HandwerkerDashboard.tsx: 1826 Zeilen** — unmaintainable | `pages/HandwerkerDashboard.tsx` | In Sub-Komponenten aufteilen |

### 🟠 Wichtige Verbesserungen (nächster Sprint)

| # | Problem | Datei:Zeile | Fix |
|---|---------|-------------|-----|
| 7 | **33x `select('*')`** statt spezifischer Felder | Siehe Liste oben | Spezifische Felder selektieren |
| 8 | **Admin-Pages ohne Pagination** | `admin/HandwerkerManagement.tsx`, `admin/AdminLeadsManagement.tsx` | Server-Side Pagination implementieren |
| 9 | **Kategorie-Labels 3x dupliziert** (Frontend + 2x Backend) | `config/`, `functions/_shared/` | Shared Build oder Single-Source generieren |
| 10 | **Status-Badge-Funktion 3x dupliziert** | Admin-Pages | In `lib/statusBadges.ts` extrahieren |
| 11 | **Unsaved-Changes-Warnung fehlt** | Alle Formulare | `beforeunload` Event + React Router Blocker |
| 12 | **Filter-State nicht in URL** | `BrowseLeads.tsx`, Admin-Pages | URL-Params für Filter/Pagination |
| 13 | **React Query nicht einheitlich** | Nur `usePageContent()` nutzt RQ | Data-Fetching auf React Query migrieren |
| 14 | **`PAYREXX_TEST_MODE` Bypass** | `create-payrexx-gateway/index.ts` | Env-Variable nur in Dev erlauben |
| 15 | **Deprecated Exports noch vorhanden** | `swissPostalCodes.ts:122,139`, `cantonPostalCodes.ts:15` | Deprecated Code entfernen |
| 16 | **HandwerkerApprovals.tsx Duplikat** | `pages/admin/HandwerkerApprovals.tsx` | Mit HandwerkerManagement konsolidieren |
| 17 | **errorCategories.ts Memory Leak** | `lib/errorCategories.ts` errorFrequency Map | Max-Size + Cleanup implementieren |
| 18 | **120 console.log/error Statements** | 40 Dateien | Durch `logWithCorrelation()` ersetzen |

### 🟡 Nice-to-Have Refactorings

| # | Problem | Datei:Zeile | Fix |
|---|---------|-------------|-----|
| 19 | BrowseLeads Search ohne Debounce | `pages/BrowseLeads.tsx` | `useDebounce` einsetzen (Package vorhanden) |
| 20 | `idempotency.ts` scheint ungenutzt | `lib/idempotency.ts` | Prüfen und ggf. löschen |
| 21 | Hardcoded Firmeninfo in Schema | `lib/schemaHelpers.ts:44-55` | In `config/company.ts` verschieben |
| 22 | File-Size-Limits nicht zentralisiert | Diverse Dateien | Zentrale `FILE_UPLOAD_LIMITS` Konstante |
| 23 | `swissTime.ts` mischt Währung + Zeit | `lib/swissTime.ts` | Formatierung extrahieren |
| 24 | `mapbox-gl` nicht lazy-loaded | `components/ServiceAreaMap.tsx` | Dynamic Import |
| 25 | `next-themes` in Vite-App | `package.json` | Prüfen ob nötig |
| 26 | Form-Validation inconsistent | Diverse | Einheitlich auf RHF + Zod migrieren |
| 27 | `html-export/` Verzeichnis | Root | Entfernen oder in README dokumentieren |
| 28 | ~10 ungenutzte DB-Tabellen | Siehe 4.2 | Prüfen und bereinigen |
| 29 | Leere Migration | `20260305160741_0c288af4.sql` | Löschen |
| 30 | `.env.example` fehlt | Root | Erstellen mit allen benötigten Variablen |

### ✅ Was gut gemacht ist

| Pattern | Details |
|---------|---------|
| **Lazy Loading** | Alle Routes korrekt lazy-loaded mit Suspense-Boundaries |
| **Auth-Cache-Clear** | `queryClient.clear()` + `clearRoleCache()` bei Auth-Events — verhindert Cross-Account-Leaks |
| **SSOT für Rollen** | `useUserRole()` mit Cache als zentrale Rolle-Quelle |
| **SSOT für Query Keys** | `queryInvalidation.ts` zentralisiert alle Cache-Keys |
| **Payment-Idempotenz** | Payrexx-Webhook mit HMAC + Unique-Constraint — verhindert Double-Charging |
| **GDPR-Compliance** | `delete-user` Edge Function mit Audit-Trail + Rollback |
| **Optimistic Locking** | `acceptProposal()` prüft aktuellen Status vor Mutation |
| **Proposal-Limit Enforcement** | DB-Level via `can_submit_proposal()` — nicht nur Frontend |
| **Shared Email Templates** | 20+ Templates mit safe interpolation |
| **Error-Tracking** | Sentry Integration mit Correlation IDs |
| **Spam-Protection** | Honeypot + Rate-Limiting + Content-Validation |
| **Swiss-Timezone-Handling** | Dediziertes `swissTime.ts` mit date-fns-tz |
| **Code-Organization** | Klare Layer-Trennung (pages/components/hooks/lib/config) |

### 📊 Gesamt-Score

```
SSOT:              [7/10]  — Gute Ansätze (useUserRole, queryInvalidation), aber Kategorie-Labels tripliziert
DRY:               [5/10]  — Status-Badges, Datum-Formatierung, select('*') vielfach dupliziert
Dead Code & Bloat: [6/10]  — Deprecated Exports, ~10 ungenutzte Tabellen, html-export/
CRUD-Qualität:     [7/10]  — Vollständig, aber Conversations/Messages ohne Delete (GDPR?)
Save-UX:           [7/10]  — Loading/Success gut, Unsaved-Changes fehlt
Sicherheit:        [5/10]  — .env im Repo, Admin-Frontend-Auth, send-lead-notification ohne Auth
Performance:       [6/10]  — Lazy Loading gut, aber select(*), keine Pagination, 1826-Zeilen-Komponente
Barrierefreiheit:  [7/10]  — shadcn/ui bringt gute Basis, aber nicht systematisch geprüft
Responsive:        [7/10]  — Mobile-Hook, Sticky-Footer, Sheet-Sidebar
Testing:           [1/10]  — Keine Tests vorhanden
i18n / l10n:       [7/10]  — Swiss-Locale korrekt, aber keine Externalisierung (akzeptabel für DE-only)
Migrations:        [6/10]  — 130+ Migrations, keine Reversibilität, 1 leere Migration
─────────────────────────
GESAMT:            [71/120]
```

### Prioritäten-Übersicht

1. **Sofort (Tag 1):** `.env` in `.gitignore`, `.env.example` erstellen, TestDashboard absichern
2. **Diese Woche:** Auth-Lücken in Edge Functions schliessen, Admin-Mutations via Edge Functions
3. **Nächster Sprint:** `select('*')` → spezifische Felder, Pagination, DRY-Refactoring
4. **Backlog:** Test-Suite aufbauen, React Query Migration, Komponenten-Refactoring
