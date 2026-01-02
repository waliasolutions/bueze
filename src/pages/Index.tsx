import React, { Suspense, lazy } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Footer } from '@/components/Footer';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { usePageContent } from '@/hooks/usePageContent';
import { MobileStickyFooter } from '@/components/MobileStickyFooter';
import { generateFAQSchema, generateOrganizationSchema, generateWebsiteSchema, generateLocalBusinessSchema, wrapInGraph } from '@/lib/schemaHelpers';

// Lazy load below-fold components for faster initial paint
const HowItWorks = lazy(() => import('@/components/HowItWorks').then(m => ({ default: m.HowItWorks })));
const FAQ = lazy(() => import('@/components/FAQ').then(m => ({ default: m.FAQ })));

// Import FAQ data statically for schema generation (small data, not a component)
import { faqData } from '@/components/FAQ';

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
    title: "Handwerker in Ihrer Nähe finden | Büeze.ch",
    description: "Sie suchen einen zuverlässigen Handwerker? Auf Büeze.ch finden Sie geprüfte Fachbetriebe aus Ihrer Region. Beschreiben Sie Ihr Projekt und vergleichen Sie kostenlos mehrere Offerten.",
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
        <Suspense fallback={<div className="min-h-[400px] bg-pastel-blue-50" />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<div className="min-h-[600px] bg-pastel-blue-50" />}>
          <FAQ />
        </Suspense>
      </main>
      <Footer />
      <MobileStickyFooter />
    </div>
  );
};

export default Index;
