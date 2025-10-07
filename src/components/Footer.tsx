import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import logo from '@/assets/bueze-logo.png';

export const Footer = () => {
  const footerSections = [
    {
      title: 'Für Auftraggeber',
      links: [
        'Projekt erstellen',
        'Handwerker finden',
        'Preise vergleichen',
        'Bewertungen lesen'
      ]
    },
    {
      title: 'Für Handwerker',
      links: [
        'Profil erstellen',
        'Leads kaufen',
        'Preise & Abos',
        'Erfolgstipps'
      ]
    },
    {
      title: 'Kategorien',
      links: [
        'Elektriker',
        'Sanitär',
        'Maler',
        'Gartenbau'
      ]
    },
    {
      title: 'Unternehmen',
      links: [
        'Über uns',
        'Karriere',
        'Presse',
        'Partner'
      ]
    }
  ];

  return (
    <footer className="bg-ink-900 text-surface">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center">
              <img src={logo} alt="Büeze.ch" className="h-10 w-auto" />
            </div>
            
            <p className="text-ink-300 leading-relaxed">
              Die führende Plattform für Handwerker-Vermittlung in der Schweiz. 
              Verbinden Sie sich mit geprüften Profis für Ihr nächstes Projekt.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <Mail className="h-4 w-4" />
                <span>info@büeze.ch</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <Phone className="h-4 w-4" />
                <span>+41 44 123 45 67</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <MapPin className="h-4 w-4" />
                <span>Zürich, Schweiz</span>
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
                    <a 
                      href="#" 
                      className="text-ink-300 hover:text-brand-400 transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-ink-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Legal Links */}
            <div className="flex flex-wrap gap-6 text-sm text-ink-300">
              <a href="#" className="hover:text-brand-400 transition-colors">
                Datenschutz
              </a>
              <a href="#" className="hover:text-brand-400 transition-colors">
                AGB
              </a>
              <a href="#" className="hover:text-brand-400 transition-colors">
                Impressum
              </a>
              <a href="#" className="hover:text-brand-400 transition-colors">
                Cookie-Einstellungen
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors group"
              >
                <Facebook className="h-5 w-5 text-ink-300 group-hover:text-white" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors group"
              >
                <Instagram className="h-5 w-5 text-ink-300 group-hover:text-white" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors group"
              >
                <Linkedin className="h-5 w-5 text-ink-300 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-8 pt-6 border-t border-ink-700">
            <p className="text-sm text-ink-300">
              © 2025 Büeze AG. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};