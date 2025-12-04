import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { usePageContent } from '@/hooks/usePageContent';
import { MobileStickyFooter } from '@/components/MobileStickyFooter';

const Index = () => {
  const { content } = usePageContent('homepage');
  const { content: heroContent, loading: heroLoading } = usePageContent('homepage_hero');
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

  const seoData = content?.seo || {
    title: "Lokale Handwerker finden | Handwerker Schweiz | Büeze.ch",
    description: "Finden Sie mit Bueeze vertrauenswürdige lokale Handwerker in der ganzen Schweiz. Unser Schweizer Handwerkerportal verbindet Sie mit kompetenten Fachleuten für Reparaturen, Renovierungen und Hausdienstleistungen. Schnell, zuverlässig und einfach zu bedienen.",
    canonical: "https://bueeze.ch/"
  };

  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet
        title={seoData.title}
        description={seoData.description}
        canonical={seoData.canonical}
        robotsMeta={seoData.robots}
        ogImage={seoData.og_image}
        schemaMarkup={schemaMarkup}
      />
      <Header />
      <main className="pt-16">
        <Hero content={heroContent} loading={heroLoading} />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
      <MobileStickyFooter />
    </div>
  );
};

export default Index;
