import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import logo from '@/assets/bueze-logo.png';

export const Footer = () => {
  const navigate = useNavigate();
  
  const footerSections = [
    {
      title: 'Für Auftraggeber',
      links: [
        { label: 'Auftrag erstellen', href: '/submit-lead' },
        { label: 'Kategorien', href: '/kategorien' },
      ]
    },
    {
      title: 'Für Handwerker',
      links: [
        { label: 'Handwerker-Infos', href: '/handwerker' },
        { label: 'Leads durchsuchen', href: '/search' },
      ]
    },
    {
      title: 'Preise',
      links: [
        { label: 'Abonnements', href: '/pricing' },
      ]
    },
    {
      title: 'Rechtliches',
      links: [
        { label: 'AGB', href: '/legal/agb' },
      ]
    }
  ];

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Force scroll to top synchronously before navigation
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0; // For Safari
    
    // Small delay to ensure scroll completes before navigation
    setTimeout(() => {
      navigate(href);
    }, 10);
  };

  return (
    <footer className="bg-ink-900 text-surface">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center">
              <img src={logo} alt="Büeze.ch" className="h-20 w-auto" />
            </div>
            
            <p className="text-ink-300 leading-relaxed">
              Die Plattform für Handwerker-Vermittlung in der Schweiz. 
              Verbinden Sie sich mit geprüften Profis für Ihr nächstes Projekt.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <Mail className="h-4 w-4" />
                <span>info@bueeze.ch</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <Phone className="h-4 w-4" />
                <span>+41 41 558 22 33</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <MapPin className="h-4 w-4" />
                <span>Gotthardstrasse 37, 6410 Goldau</span>
              </div>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="font-semibold text-surface">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.href} 
                      onClick={(e) => handleNavigation(e, link.href)}
                      className="text-ink-300 hover:text-brand-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-ink-700 mt-12 pt-8">
          <div className="flex justify-center items-center">
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a 
                href="https://m.facebook.com/profile.php?id=61582960604117"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors group"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a 
                href="https://www.instagram.com/bueeze.ch/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors group"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-8 pt-6 border-t border-ink-700">
            <p className="text-sm text-ink-300">
              © 2025 Büeze GmbH. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};