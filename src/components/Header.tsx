import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserDropdown } from './UserDropdown';
import logo from '@/assets/bueze-logo.webp';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Navigation function that works both inside and outside Router context
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems = [
    { label: 'So funktioniert es', href: '#how-it-works' },
    { label: 'Kategorien', href: '#categories' },
    { label: 'Für Handwerker', href: '#for-professionals' },
    { label: 'Preise', href: '#pricing' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-line-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="Büeze.ch" className="h-8 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-ink-700 hover:text-brand-600 transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => navigate('/submit-lead')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Auftrag erstellen
                </Button>
                <UserDropdown />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="gap-2" onClick={() => navigate('/auth')}>
                  <User className="h-4 w-4" />
                  Anmelden
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
            className="lg:hidden p-2 text-ink-700 hover:text-brand-600 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-line-200 py-4 space-y-4">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="block py-2 text-ink-700 hover:text-brand-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-line-200">
              {user ? (
                <div className="space-y-3">
                  <UserDropdown />
                </div>
              ) : (
                <div className="space-y-3">
                  <Button variant="ghost" className="justify-start gap-2 w-full" onClick={() => navigate('/auth')}>
                    <User className="h-4 w-4" />
                    Anmelden
                  </Button>
                  <Button variant="default" className="justify-start gap-2 w-full" onClick={() => navigate('/submit-lead')}>
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