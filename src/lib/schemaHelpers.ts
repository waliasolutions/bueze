// Centralized schema generation helpers for SEO structured data

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url?: string;
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

export const generateOrganizationSchema = () => ({
  "@type": "Organization",
  "name": "Büeze.ch",
  "url": "https://bueeze.ch",
  "logo": "https://bueeze.ch/favicon.png",
  "description": "Handwerker Portal für die Schweiz – verbindet Auftraggeber mit geprüften Handwerkern",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "CH",
    "addressLocality": "Schweiz"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Switzerland"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "German"
  }
});

export const generateWebsiteSchema = () => ({
  "@type": "WebSite",
  "name": "Büeze.ch",
  "url": "https://bueeze.ch",
  "description": "Handwerker Marktplatz Schweiz – Finden Sie lokale Handwerker für alle Projekte",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://bueeze.ch/kategorien?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
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
