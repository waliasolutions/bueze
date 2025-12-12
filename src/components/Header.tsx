import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus, LogOut } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserDropdown } from './UserDropdown';
import { AdminNotifications } from './AdminNotifications';
import { ClientNotifications } from './ClientNotifications';
import { HandwerkerNotifications } from './HandwerkerNotifications';
import { AdminViewSwitcher } from './AdminViewSwitcher';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import logo from '@/assets/bueze-logo.png';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isAdmin, isHandwerker, userId } = useUserRole();

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

  // Determine current view for AdminViewSwitcher based on route
  const getCurrentView = (): 'admin' | 'client' | 'handwerker' => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/handwerker-dashboard')) return 'handwerker';
    return 'client';
  };

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
              {userId ? (
              <div className="flex items-center gap-3">
                {/* Role-specific notifications */}
                {isAdmin && (
                  <>
                    <AdminNotifications />
                    <AdminViewSwitcher currentView={getCurrentView()} />
                  </>
                )}
                {isHandwerker && !isAdmin && <HandwerkerNotifications />}
                {!isAdmin && !isHandwerker && <ClientNotifications />}
                
                {/* Hide "Auftrag erstellen" for admins */}
                {!isAdmin && (
                  <Button variant="outline" onClick={() => navigate('/submit-lead')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Auftrag erstellen
                  </Button>
                )}
                
                {/* Minimal logout-only dropdown for admins, full UserDropdown for others */}
                {isAdmin ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            A
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover">
                      <DropdownMenuItem
                        onClick={async () => {
                          await supabase.auth.signOut();
                          navigate('/');
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Abmelden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <UserDropdown />
                )}
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
              {userId ? (
                <div className="space-y-3">
                  {/* Mobile notifications */}
                  <div className="px-4 py-2 flex items-center gap-2">
                    {isAdmin && <AdminNotifications />}
                    {isHandwerker && !isAdmin && <HandwerkerNotifications />}
                    {!isAdmin && !isHandwerker && <ClientNotifications />}
                  </div>
                  {isAdmin && (
                    <div className="px-4 py-2">
                      <AdminViewSwitcher currentView={getCurrentView()} />
                    </div>
                  )}
                  {/* Minimal logout for admins, full UserDropdown for others */}
                  {isAdmin ? (
                    <Button 
                      variant="ghost" 
                      className="justify-start gap-2 w-full text-destructive hover:text-destructive" 
                      onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/');
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Abmelden
                    </Button>
                  ) : (
                    <UserDropdown />
                  )}
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