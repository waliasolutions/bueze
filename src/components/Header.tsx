import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Hammer, User, Settings } from 'lucide-react';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Hammer className="h-6 w-6 text-ink-900" />
            </div>
            <div className="font-bold text-xl text-ink-900">
              HandwerkerLeads
            </div>
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

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" className="gap-2">
              <User className="h-4 w-4" />
              Anmelden
            </Button>
            <Button variant="default" className="gap-2">
              <Settings className="h-4 w-4" />
              Handwerker werden
            </Button>
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
              <Button variant="ghost" className="justify-start gap-2">
                <User className="h-4 w-4" />
                Anmelden
              </Button>
              <Button variant="default" className="justify-start gap-2">
                <Settings className="h-4 w-4" />
                Handwerker werden
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};