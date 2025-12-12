import { NavLink, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
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

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'sticky top-24 h-[calc(100vh-6rem)] border-r bg-card transition-all duration-300',
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
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
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
