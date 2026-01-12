import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQ, faqData } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { usePageContent } from '@/hooks/usePageContent';
import { MobileStickyFooter } from '@/components/MobileStickyFooter';
import { generateFAQSchema, generateOrganizationSchema, generateWebsiteSchema, generateLocalBusinessSchema, wrapInGraph } from '@/lib/schemaHelpers';

const Index = () => {
  const { content } = usePageContent('homepage');
  const { content: heroContent, loading: heroLoading } = usePageContent('homepage_hero');
  
  // Transform FAQ data to schema format
  const faqItems = faqData.flatMap(category => 
    category.questions.map(item => ({
      question: item.q,
      answer: item.a
    }))
  );

  const schemaMarkup = wrapInGraph(
    generateWebsiteSchema(),
    generateOrganizationSchema(),
    generateLocalBusinessSchema(),
    generateFAQSchema(faqItems)
  );

  const seoData = content?.seo || {
    title: "Handwerker finden in der Schweiz | Kostenlose Offerten | Büeze.ch",
    description: "Ihr Schweizer Marktplatz für geprüfte Handwerker. Beschreiben Sie Ihr Projekt und erhalten Sie kostenlos bis zu 3 Offerten von Fachbetrieben aus Ihrer Region. Jetzt starten!",
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
