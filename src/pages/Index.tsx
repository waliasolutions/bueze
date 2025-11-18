import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';

const Index = () => {
  const schemaMarkup = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Büeze.ch",
        "url": "https://bueeze.ch",
        "description": "Handwerker Marktplatz Schweiz – Finden Sie lokale Handwerker für alle Projekte",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://bueeze.ch/kategorien?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "name": "Büeze.ch",
        "url": "https://bueeze.ch",
        "logo": "https://bueeze.ch/favicon.png",
        "description": "Handwerker Portal für die Schweiz – verbindet Auftraggeber mit geprüften Handwerkern",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "CH"
        }
      }
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title="Handwerker Marktplatz Schweiz | Lokaler Handwerker Finden | Büeze.ch"
        description="Handwerker Portal für die Schweiz. Finden Sie lokale Handwerker in Ihrer Region. Kostenlos mehrere Angebote vergleichen. Handwerker Schweiz – professionell und geprüft."
        canonical="https://bueeze.ch/"
        schemaMarkup={schemaMarkup}
      />
      <Header />
      <main className="pt-16">
        <Hero />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
