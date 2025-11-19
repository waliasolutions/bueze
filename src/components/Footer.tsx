import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import logo from '@/assets/bueze-logo.png';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';

export const Footer = () => {
  // Group subcategories by major category
  const categoriesWithSubs = Object.values(majorCategories).map(category => {
    // Use the same approach as MajorCategoryLanding: only show subcategories 
    // explicitly listed in category.subcategories array
    const subs = category.subcategories
      .map(subId => subcategoryLabels[subId])
      .filter(Boolean) // Remove any undefined entries
      .slice(0, 8); // Limit to 8 for scannability
    
    return {
      ...category,
      subcategories: subs
    };
  });

  const quickLinks = [
    { label: 'Für Auftraggeber', href: '/submit-lead' },
    { label: 'Für Handwerker', href: '/handwerker' },
    { label: 'Preise', href: '/pricing' },
    { label: 'AGB', href: '/legal/agb' },
    { label: 'Impressum', href: '/impressum' },
    { label: 'Datenschutz', href: '/datenschutz' },
  ];

  return (
    <footer className="bg-ink-900 text-surface">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Company Info - 3 columns on desktop */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center">
              <img src={logo} alt="Büeze.ch" className="h-20 w-auto" />
            </div>
            
            <p className="text-ink-300 leading-relaxed text-sm">
              Die Plattform für Handwerker-Vermittlung in der Schweiz. 
              Verbinden Sie sich mit geprüften Profis für Ihr nächstes Projekt.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a 
                  href="mailto:info@bueeze.ch"
                  className="hover:text-brand-400 transition-colors"
                >
                  info@bueeze.ch
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a 
                  href="tel:+41415582233"
                  className="hover:text-brand-400 transition-colors"
                >
                  +41 41 558 22 33
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Gotthardstrasse 37, 6410 Goldau</span>
              </div>
            </div>
          </div>

          {/* Categories Grid - 9 columns on desktop */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {categoriesWithSubs.map((category) => (
                <div key={category.id} className="space-y-3">
                <Link
                  to={`/kategorie/${category.slug}`}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                  className="font-semibold text-surface hover:text-brand-400 transition-colors block"
                >
                  {category.label}
                </Link>
                  <ul className="space-y-2">
                    {category.subcategories.map((sub) => (
                      <li key={sub.value}>
                      <Link 
                        to={`/kategorie/${category.slug}#${sub.slug}`}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                        className="text-ink-300 hover:text-brand-400 transition-colors text-sm block"
                      >
                        {sub.label}
                      </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-ink-700 mt-12 pt-8">
          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
            {quickLinks.map((link, index) => (
              <React.Fragment key={link.href}>
                <Link
                  to={link.href}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                  className="text-ink-300 hover:text-brand-400 transition-colors text-sm"
                >
                  {link.label}
                </Link>
                {index < quickLinks.length - 1 && (
                  <span className="text-ink-500">|</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <a 
              href="https://m.facebook.com/profile.php?id=61582960604117"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors"
            >
              <Facebook className="h-5 w-5 text-white" />
            </a>
            <a 
              href="https://www.instagram.com/bueeze.ch/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors"
            >
              <Instagram className="h-5 w-5 text-white" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-ink-300">
              © 2025 Büeze GmbH. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
