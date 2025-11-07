import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus, Shield, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserDropdown } from './UserDropdown';
import { AdminNotifications } from './AdminNotifications';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import logo from '@/assets/bueze-logo.png';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHandwerkerExpanded, setIsHandwerkerExpanded] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setUserRole(roleData?.role || null);
      } else {
        setUserRole(null);
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUser(); // Re-check user role
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('/#')) {
      e.preventDefault();
      const id = href.replace('/#', '');
      
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.getElementById(id);
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setIsMenuOpen(false);
    }
  };

  const navItems = [
    { label: 'So funktioniert es', href: '/#how-it-works' },
    { label: 'Kategorien', href: '/kategorien' },
    { 
      label: 'Für Handwerker', 
      submenu: [
        { label: 'Für Handwerker', href: '/handwerker' },
        { label: 'Preise', href: '/pricing' }
      ]
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-line-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate('/');
          }}>
            <img src={logo} alt="Büeze.ch" className="h-24 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-8">
              {navItems.map((item, index) => {
                // Handle hash links
                if (item.href?.startsWith('/#')) {
                  return (
                    <NavigationMenuItem key={index}>
                      <a
                        href={item.href}
                        onClick={(e) => handleNavClick(item.href, e)}
                        className="text-ink-700 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                      >
                        {item.label}
                      </a>
                    </NavigationMenuItem>
                  );
                }
                
                // Handle regular links
                if (item.href) {
                  return (
                    <NavigationMenuItem key={index}>
                      <Link
                        to={item.href}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-ink-700 hover:text-brand-600 transition-colors font-medium"
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuItem>
                  );
                }
                
                // Handle dropdown menu
                if (item.submenu) {
                  return (
                    <NavigationMenuItem key={index}>
                      <NavigationMenuTrigger className="text-ink-700 hover:text-brand-600 transition-colors font-medium bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                        {item.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[200px] gap-1 p-2 bg-white">
                          {item.submenu.map((subItem, subIndex) => (
                            <li key={subIndex}>
                              <NavigationMenuLink asChild>
                                <Link
                                  to={subItem.href}
                                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                  className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                >
                                  <div className="text-sm font-medium leading-none">{subItem.label}</div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }
                
                return null;
              })}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <>
                    <AdminNotifications />
                    <NavigationMenu>
                      <NavigationMenuList>
                        <NavigationMenuItem>
                          <NavigationMenuTrigger className="gap-2 text-brand-600 hover:text-brand-700 bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                            <Shield className="h-4 w-4" />
                            Admin
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid w-[240px] gap-1 p-2 bg-white">
                              <li>
                                <NavigationMenuLink asChild>
                                  <button
                                    onClick={() => {
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                      navigate('/admin/dashboard');
                                    }}
                                    className="block w-full text-left select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    <div className="text-sm font-medium leading-none">Dashboard</div>
                                    <p className="text-xs text-muted-foreground mt-1">Admin-Übersicht</p>
                                  </button>
                                </NavigationMenuLink>
                              </li>
                              <li>
                                <NavigationMenuLink asChild>
                                  <button
                                    onClick={() => {
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                      navigate('/admin/approvals');
                                    }}
                                    className="block w-full text-left select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    <div className="text-sm font-medium leading-none">Handwerker</div>
                                    <p className="text-xs text-muted-foreground mt-1">Freigaben verwalten</p>
                                  </button>
                                </NavigationMenuLink>
                              </li>
                              {isSuperAdmin && (
                                <li>
                                  <NavigationMenuLink asChild>
                                    <button
                                      onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        navigate('/admin/users');
                                      }}
                                      className="block w-full text-left select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                    >
                                      <div className="text-sm font-medium leading-none">Benutzer</div>
                                      <p className="text-xs text-muted-foreground mt-1">Rollen verwalten</p>
                                    </button>
                                  </NavigationMenuLink>
                                </li>
                              )}
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      </NavigationMenuList>
                    </NavigationMenu>
                  </>
                )}
                <Button variant="outline" onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  navigate('/submit-lead');
                }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Auftrag erstellen
                </Button>
                <UserDropdown />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    navigate('/auth');
                  }}
                >
                  Anmelden
                </Button>
                <Button onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  navigate('/submit-lead');
                }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Auftrag erstellen
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 text-ink-700 hover:text-brand-600 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-line-200 py-4 space-y-2">
            {navItems.map((item, index) => {
              // Handle hash links
              if (item.href?.startsWith('/#')) {
                return (
                  <a
                    key={index}
                    href={item.href}
                    onClick={(e) => handleNavClick(item.href, e)}
                    className="block py-2 text-ink-700 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    {item.label}
                  </a>
                );
              }
              
              // Handle regular links without submenu
              if (item.href) {
                return (
                  <Link
                    key={index}
                    to={item.href}
                    className="block py-2 text-ink-700 hover:text-brand-600 transition-colors font-medium"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setIsMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                );
              }
              
              // Handle expandable menu with submenu
              if (item.submenu) {
                return (
                  <div key={index} className="space-y-1">
                    <button
                      onClick={() => setIsHandwerkerExpanded(!isHandwerkerExpanded)}
                      className="w-full flex items-center justify-between py-2 text-ink-700 hover:text-brand-600 transition-colors font-medium"
                    >
                      <span>{item.label}</span>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${
                          isHandwerkerExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isHandwerkerExpanded && (
                      <div className="pl-4 space-y-1 border-l-2 border-brand-200">
                        {item.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.href}
                            className="block py-2 text-ink-600 hover:text-brand-600 transition-colors"
                            onClick={() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              setIsMenuOpen(false);
                            }}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              return null;
            })}
            <div className="flex flex-col gap-3 pt-4 border-t border-line-200">
              {user ? (
                <div className="space-y-3">
                  {isAdmin && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                        className="w-full flex items-center justify-between py-2 text-brand-600 hover:text-brand-700 transition-colors font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </span>
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${
                            isAdminMenuOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isAdminMenuOpen && (
                        <div className="pl-4 space-y-1 border-l-2 border-brand-200">
                          <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              navigate('/admin/dashboard');
                              setIsMenuOpen(false);
                            }}
                          >
                            Dashboard
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              navigate('/admin/approvals');
                              setIsMenuOpen(false);
                            }}
                          >
                            Handwerker
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              className="justify-start w-full"
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                navigate('/admin/users');
                                setIsMenuOpen(false);
                              }}
                            >
                              Benutzer
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <UserDropdown />
                </div>
              ) : (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="justify-start gap-2 w-full" 
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    Anmelden
                  </Button>
                  <Button 
                    variant="default" 
                    className="justify-start gap-2 w-full" 
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      navigate('/submit-lead');
                      setIsMenuOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Auftrag erstellen
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};