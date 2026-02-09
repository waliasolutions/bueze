import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import logo from '@/assets/bueze-logo.png';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { footerDefaults } from '@/config/contentDefaults';

interface FooterProps {
  content?: { fields?: any } | null;
}

export const Footer = ({ content }: FooterProps) => {
  const fields = content?.fields;
  const companyDescription = fields?.companyDescription || footerDefaults.companyDescription;
  const email = fields?.email || footerDefaults.email;
  const phone = fields?.phone || footerDefaults.phone;
  const address = fields?.address || footerDefaults.address;
  const socialLinks = {
    facebook: fields?.socialLinks?.facebook || footerDefaults.socialLinks.facebook,
    instagram: fields?.socialLinks?.instagram || footerDefaults.socialLinks.instagram,
  };
  const quickLinks = fields?.quickLinks?.length ? fields.quickLinks : footerDefaults.quickLinks;

  // Group subcategories by major category
  const categoriesWithSubs = Object.values(majorCategories).map(category => {
    const subs = category.subcategories
      .map(subId => subcategoryLabels[subId])
      .filter(Boolean)
      .slice(0, 8);
    
    return {
      ...category,
      subcategories: subs
    };
  });

  return (
    <footer className="bg-ink-900 text-surface">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center">
              <img src={logo} alt="Büeze.ch - Geprüfte Handwerker in der Schweiz finden" className="h-20 w-auto" loading="lazy" decoding="async" width="80" height="80" />
            </div>
            
            <p className="text-ink-300 leading-relaxed text-sm">
              {companyDescription}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-brand-400 transition-colors">
                  {email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-brand-400 transition-colors">
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-300">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{address}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {categoriesWithSubs.map((category) => (
                <div key={category.id} className="space-y-2 sm:space-y-3">
                <Link
                  to={`/kategorien/${category.slug}`}
                  className="font-semibold text-surface hover:text-brand-400 transition-colors block text-sm sm:text-base min-h-[44px] flex items-center"
                >
                  {category.label}
                </Link>
                  <ul className="space-y-1.5 sm:space-y-2 hidden sm:block">
                    {category.subcategories.slice(0, 4).map((sub) => (
                      <li key={sub.value}>
                      <Link 
                        to={`/kategorien/${category.slug}#${sub.value}`}
                        className="text-ink-300 hover:text-brand-400 transition-colors text-xs sm:text-sm block py-0.5"
                      >
                        {sub.label}
                      </Link>
                      </li>
                    ))}
                    {category.subcategories.length > 4 && (
                      <li>
                        <Link 
                          to={`/kategorien/${category.slug}`}
                          className="text-brand-400 hover:text-brand-300 transition-colors text-xs sm:text-sm block py-0.5"
                        >
                          +{category.subcategories.length - 4} mehr
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-ink-700 mt-12 pt-8">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
            {quickLinks.map((link: any, index: number) => (
              <React.Fragment key={link.href}>
                <Link
                  to={link.href}
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

          <div className="flex justify-center items-center gap-4 mb-8">
            <a 
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors"
            >
              <Facebook className="h-5 w-5 text-white" />
            </a>
            <a 
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 bg-ink-700 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors"
            >
              <Instagram className="h-5 w-5 text-white" />
            </a>
          </div>

          <div className="text-center">
            <p className="text-sm text-ink-300">
              © {new Date().getFullYear()} Büeze.ch GmbH. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
