// Centralized schema generation helpers for SEO structured data

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export interface CompanyData {
  company_name: string;
  company_street: string;
  company_zip: string;
  company_city: string;
  company_country: string;
  company_email: string;
  company_phone: string;
  company_website: string;
}

export const generateFAQSchema = (faqItems: FAQItem[]) => ({
  "@type": "FAQPage",
  "mainEntity": faqItems.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
});

export const generateBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    ...(item.url ? { "item": item.url } : {})
  }))
});

export const generateOrganizationSchema = (company?: CompanyData) => ({
  "@type": "Organization",
  "name": company?.company_name ?? "Büeze.ch",
  "url": `https://${company?.company_website ?? 'bueeze.ch'}`.replace('https://www.', 'https://'),
  "logo": "https://bueeze.ch/favicon.png",
  "description": "Handwerker Portal für die Schweiz – verbindet Auftraggeber mit geprüften Handwerkern",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": company?.company_street ?? "Industriestrasse 28",
    "addressLocality": company?.company_city ?? "Gamprin-Bendern",
    "postalCode": company?.company_zip ?? "9487",
    "addressCountry": company?.company_country === 'Liechtenstein' ? 'LI' : 'CH'
  },
  "areaServed": {
    "@type": "Country",
    "name": "Switzerland"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": company?.company_phone ?? "+41 41 558 22 33",
    "email": company?.company_email ?? "info@bueeze.ch",
    "contactType": "customer service",
    "availableLanguage": "German"
  },
  "sameAs": [
    "https://m.facebook.com/profile.php?id=61582960604117",
    "https://www.instagram.com/bueeze.ch/"
  ]
});

export const generateWebsiteSchema = () => ({
  "@type": "WebSite",
  "name": "Büeze.ch",
  "url": "https://bueeze.ch",
  "description": "Handwerker Marktplatz Schweiz – Finden Sie lokale Handwerker für alle Projekte",
  "inLanguage": "de-CH",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://bueeze.ch/kategorien?q={search_term_string}"
    },
    "query-input": {
      "@type": "PropertyValueSpecification",
      "valueName": "search_term_string",
      "valueRequired": true
    }
  }
});

export const generateLocalBusinessSchema = (company?: CompanyData) => ({
  "@type": "LocalBusiness",
  "@id": "https://bueeze.ch/#organization",
  "name": company?.company_name ?? "Büeze.ch",
  "image": "https://bueeze.ch/favicon.png",
  "url": "https://bueeze.ch",
  "telephone": company?.company_phone ?? "+41 41 558 22 33",
  "email": company?.company_email ?? "info@bueeze.ch",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": company?.company_street ?? "Industriestrasse 28",
    "addressLocality": company?.company_city ?? "Gamprin-Bendern",
    "postalCode": company?.company_zip ?? "9487",
    "addressCountry": company?.company_country === 'Liechtenstein' ? 'LI' : 'CH'
  },
  "priceRange": "CHF",
  "areaServed": {
    "@type": "Country",
    "name": "Switzerland"
  }
});

export const generateWebPageSchema = (name: string, description: string, url: string) => ({
  "@type": "WebPage",
  "name": name,
  "description": description,
  "url": url,
  "inLanguage": "de-CH"
});

export const generateServiceSchema = (name: string, description: string) => ({
  "@type": "Service",
  "name": name,
  "description": description,
  "provider": {
    "@type": "Organization",
    "name": "Büeze.ch",
    "url": "https://bueeze.ch"
  },
  "serviceType": name,
  "areaServed": {
    "@type": "Country",
    "name": "Schweiz"
  }
});

export const wrapInGraph = (...schemas: object[]) => JSON.stringify({
  "@context": "https://schema.org",
  "@graph": schemas
});
