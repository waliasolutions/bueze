import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus, Shield, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserDropdown } from './UserDropdown';
import { AdminNotifications } from './AdminNotifications';
import { ClientNotifications } from './ClientNotifications';
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
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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
      // Only synchronous state updates here
      setUser(session?.user ?? null);
      
      // Defer database calls to avoid deadlock
      if (session?.user) {
        setTimeout(() => {
          checkUser();
        }, 0);
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
    { label: 'Handwerker finden', href: '/handwerker-verzeichnis' },
    { label: 'Für Handwerker', href: '/handwerker' },
    { label: 'Preise', href: '/pricing' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-line-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="Bueeze-Logo" className="h-24 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item, index) => {
              // Handle hash links
              if (item.href?.startsWith('/#')) {
                return (
                  <a
                    key={index}
                    href={item.href}
                    onClick={(e) => handleNavClick(item.href, e)}
                    className="text-ink-700 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                  >
                    {item.label}
                  </a>
                );
              }
              
              // Handle regular links
              return (
                <Link
                  key={index}
                  to={item.href}
                  className="text-ink-700 hover:text-brand-600 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Client notifications for non-admin users */}
                {!isAdmin && <ClientNotifications />}
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
                                    onClick={() => navigate('/admin/dashboard')}
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
                                    onClick={() => navigate('/admin/approvals')}
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
                                      onClick={() => navigate('/admin/users')}
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
                <Button variant="outline" onClick={() => navigate('/submit-lead')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Auftrag erstellen
                </Button>
                <UserDropdown />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/auth')}
                >
                  Login
                </Button>
                <Button onClick={() => navigate('/submit-lead')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Auftrag erstellen
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 text-ink-900 hover:text-brand-600 transition-colors"
          >
            {isMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
          </button>
        </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[110] lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Slide-in Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-[111] lg:hidden 
          transform transition-transform duration-300 ease-out shadow-2xl
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
          {/* Menu Header */}
          <div className="flex justify-between items-center p-4 border-b border-line-200 bg-pastel-pink/10">
            <span className="font-bold text-lg text-ink-900">Menü</span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-pastel-pink/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-ink-900" />
            </button>
          </div>
          
          {/* Menu Content */}
          <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-80px)]">
            {navItems.map((item, index) => {
              // Handle hash links
              if (item.href?.startsWith('/#')) {
                return (
                  <a
                    key={index}
                    href={item.href}
                    onClick={(e) => handleNavClick(item.href, e)}
                    className="block py-3 px-4 text-ink-700 hover:text-brand-600 hover:bg-pastel-pink/20 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    {item.label}
                  </a>
                );
              }
              
              // Handle regular links
              return (
                <Link
                  key={index}
                  to={item.href}
                  className="block py-3 px-4 text-ink-700 hover:text-brand-600 hover:bg-pastel-pink/20 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-3 pt-4 border-t border-line-200 mt-4">
              {user ? (
                <div className="space-y-3">
                  {isAdmin && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                        className="w-full flex items-center justify-between py-3 px-4 text-brand-600 hover:text-brand-700 hover:bg-pastel-pink/20 rounded-lg transition-colors font-medium"
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
                            className="justify-start w-full hover:bg-pastel-pink/20"
                            onClick={() => {
                              navigate('/admin/dashboard');
                              setIsMenuOpen(false);
                            }}
                          >
                            Dashboard
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start w-full hover:bg-pastel-pink/20"
                            onClick={() => {
                              navigate('/admin/approvals');
                              setIsMenuOpen(false);
                            }}
                          >
                            Handwerker
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              className="justify-start w-full hover:bg-pastel-pink/20"
                              onClick={() => {
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
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="default" 
                    className="justify-start gap-2 w-full" 
                    onClick={() => {
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
        </div>
      </>
    );
  };