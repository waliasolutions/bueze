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
import { homepageSeoDefaults } from '@/config/contentDefaults';

const Index = () => {
  const { content } = usePageContent('homepage');
  const { content: heroContent, loading: heroLoading } = usePageContent('homepage_hero');
  const { content: howItWorksContent } = usePageContent('homepage_how_it_works');
  const { content: faqContent } = usePageContent('homepage_faq');
  const { content: footerContent } = usePageContent('homepage_footer');
  
  // Use CMS FAQ data for schema if available, otherwise use defaults
  const faqCategories = faqContent?.fields?.categories?.length 
    ? faqContent.fields.categories 
    : faqData;

  const faqItems = faqCategories.flatMap((category: any) => 
    (category.questions || []).map((item: any) => ({
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

  const seoData = content?.seo || homepageSeoDefaults;

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
        <HowItWorks content={howItWorksContent} />
        <FAQ content={faqContent} />
      </main>
      <Footer content={footerContent} />
      <MobileStickyFooter />
    </div>
  );
};

export default Index;
