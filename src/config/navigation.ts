import {
  LucideIcon,
  LayoutDashboard,
  Search,
  FileText,
  MessageSquare,
  Settings,
  ClipboardList,
  Plus,
  User,
  Crown,
  Users,
  Receipt,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const roleNavigation: Record<'handwerker' | 'client', NavItem[]> = {
  handwerker: [
    { label: 'Dashboard', href: '/handwerker-dashboard', icon: LayoutDashboard },
    { label: 'Aufträge finden', href: '/search', icon: Search },
    { label: 'Meine Angebote', href: '/proposals', icon: FileText },
    { label: 'Nachrichten', href: '/conversations', icon: MessageSquare },
    { label: 'Abo verwalten', href: '/profile?tab=subscription', icon: Crown },
    { label: 'Rechnungen', href: '/handwerker-invoices', icon: Receipt },
    { label: 'Profil bearbeiten', href: '/handwerker-profile/edit', icon: Settings },
  ],
  client: [
    { label: 'Meine Aufträge', href: '/dashboard', icon: ClipboardList },
    { label: 'Auftrag erstellen', href: '/submit-lead', icon: Plus },
    { label: 'Nachrichten', href: '/conversations', icon: MessageSquare },
    { label: 'Profil', href: '/profile', icon: User },
  ],
};
