# HandwerkerLeads.ch

**Die führende Plattform für Handwerker-Vermittlung in der Schweiz**

HandwerkerLeads.ch verbindet Auftraggeber mit geprüften Handwerkern in der ganzen Schweiz. Kostenlos für Auftraggeber, transparent für Handwerker.

## 🛠️ Technologie-Stack

Dieses Projekt basiert auf modernen Web-Technologien:

- **Frontend Framework**: React 18 mit TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS mit Custom Design System
- **UI Components**: Radix UI & shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form mit Zod Validation
- **State Management**: TanStack Query
- **Internationalization**: Zeitzone CET/CEST (Schweiz)

## 📋 Voraussetzungen

- Node.js (v18 oder höher)
- npm oder bun als Package Manager
- Ein Supabase-Projekt (für Backend-Funktionalität)

## 🚀 Lokale Entwicklung

### Installation

```bash
# Repository klonen
git clone <YOUR_GIT_URL>
cd handwerkerleads

# Dependencies installieren
npm install
# oder
bun install

# Umgebungsvariablen konfigurieren
# .env Datei erstellen und Supabase-Credentials hinzufügen
cp .env.example .env

# Development Server starten
npm run dev
# oder
bun run dev
```

Der Development Server läuft standardmäßig auf `http://localhost:8080`

### Verfügbare Scripts

```bash
npm run dev          # Development Server starten
npm run build        # Production Build erstellen
npm run preview      # Production Build lokal testen
npm run lint         # Code Linting durchführen
```

## 📁 Projektstruktur

```
handwerkerleads/
├── src/
│   ├── components/        # Wiederverwendbare UI-Komponenten
│   │   ├── ui/           # shadcn/ui Basis-Komponenten
│   │   └── ...           # Feature-spezifische Komponenten
│   ├── pages/            # Route-Komponenten
│   │   ├── admin/        # Admin-spezifische Seiten
│   │   └── legal/        # Rechtliche Seiten (AGB, etc.)
│   ├── config/           # Konfigurationsdateien
│   ├── hooks/            # Custom React Hooks
│   ├── lib/              # Utility-Funktionen & Helpers
│   ├── integrations/     # Externe Service-Integrationen
│   └── index.css         # Design System Tokens
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Datenbank-Migrationen
├── public/               # Statische Assets
└── html-export/          # Static HTML Export (für Laravel Migration)
```

## 🎨 Design System

Das Design System basiert auf einem konsistenten Token-System definiert in `src/index.css` und `tailwind.config.ts`:

- **Farben**: Semantische Farb-Tokens (primary, secondary, brand, pastel, neutral)
- **Typografie**: Swiss-optimiertes Font-System
- **Spacing**: Konsistentes Spacing-Schema
- **Animationen**: Vordefinierte Animationen für UX

### Design-Prinzipien

1. **Semantic Tokens**: Verwendung von CSS Custom Properties
2. **Dark/Light Mode**: Vollständige Theme-Unterstützung
3. **Responsive**: Mobile-First Ansatz
4. **Accessibility**: WCAG 2.1 AA konform

## 🔐 Authentifizierung & Autorisierung

- **User Types**: Clients (Auftraggeber) und Handwerker
- **Auth Provider**: Supabase Auth
- **Protected Routes**: Rollenbasierte Zugriffskontrolle
- **RLS Policies**: Row Level Security in Supabase

## 🗄️ Datenbank

### Haupttabellen
- `profiles`: Benutzerprofile
- `leads`: Aufträge/Leads
- `lead_purchases`: Handwerker Lead-Käufe
- `conversations` & `messages`: Messaging-System
- `subscriptions`: Abonnement-Verwaltung

### Zeitzone
Alle Timestamps verwenden die Schweizer Zeitzone (CET/CEST).

## 📦 Deployment

### Production Build

```bash
npm run build
```

Die Build-Artefakte befinden sich im `dist/` Verzeichnis.

### Hosting-Optionen

- **Empfohlen**: Vercel, Netlify, oder Cloudflare Pages
- **Traditionell**: Eigener Server mit nginx/Apache
- **Supabase Storage**: Kann als einfaches Static Hosting dienen

### Umgebungsvariablen

Folgende Environment Variables müssen gesetzt werden:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing

```bash
# Unit Tests (falls konfiguriert)
npm run test

# E2E Tests (falls konfiguriert)
npm run test:e2e
```

## 📝 Weitere Dokumentation

- **HTML Export**: Siehe `html-export/README.md` für Laravel-Migration
- **Supabase Setup**: Siehe `supabase/README.md` (falls vorhanden)
- **Component Library**: Siehe Storybook (falls konfiguriert)

## 🤝 Beitragen

1. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
2. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
3. Branch pushen (`git push origin feature/AmazingFeature`)
4. Pull Request erstellen

## 📄 Lizenz

Proprietäre Software - Alle Rechte vorbehalten bei HandwerkerLeads AG

## 📞 Support

Bei Fragen oder Problemen:
- **Email**: support@handwerkerleads.ch
- **Dokumentation**: Siehe `/docs` (falls vorhanden)

---

**Entwickelt mit ❤️ in der Schweiz**
