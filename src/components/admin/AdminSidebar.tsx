import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  Star,
  FileText,
  CreditCard,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  onClick?: () => void;
  destructive?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Übersicht',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Benutzer',
    items: [
      { label: 'Handwerker', href: '/admin/handwerkers', icon: UserCheck },
      { label: 'Kunden', href: '/admin/clients', icon: Users },
    ],
  },
  {
    title: 'Inhalte',
    items: [
      { label: 'Aufträge', href: '/admin/leads', icon: Briefcase },
      { label: 'Bewertungen', href: '/admin/reviews', icon: Star },
      { label: 'CMS', href: '/admin/content', icon: FileText },
    ],
  },
  {
    title: 'Finanzen',
    items: [
      { label: 'Zahlungen', href: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Einstellungen',
    items: [
      { label: 'SEO', href: '/admin/seo', icon: Globe },
      { label: 'GTM', href: '/admin/gtm', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Account section added at the bottom
  const accountSection: NavSection = {
    title: 'Konto',
    items: [
      { label: 'Profil', href: '/profile', icon: User },
      { label: 'Abmelden', icon: LogOut, onClick: handleLogout, destructive: true },
    ],
  };

  const allSections = [...navSections, accountSection];

  return (
    <aside
      className={cn(
        'sticky top-16 h-[calc(100vh-4rem)] border-r bg-card transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Toggle */}
        <div className="flex justify-end p-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-4">
          {allSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex === allSections.length - 1 ? 'mt-auto pt-4 border-t' : ''}>
              {!collapsed && (
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  // Handle click items (like logout)
                  if (item.onClick) {
                    return (
                      <li key={item.label}>
                        <button
                          onClick={item.onClick}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
                            item.destructive 
                              ? 'text-destructive hover:bg-destructive/10' 
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                          title={collapsed ? item.label : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </button>
                      </li>
                    );
                  }
                  
                  // Handle navigation items
                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href!}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
