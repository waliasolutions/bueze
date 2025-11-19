import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryContent } from '@/config/categoryContent';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HowItWorks } from '@/components/HowItWorks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ArrowRight } from 'lucide-react';
import { getMajorCategoryBySubcategory } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import NotFound from './NotFound';

const CategoryLanding = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  
  const content = categorySlug ? categoryContent[categorySlug] : null;
  
  if (!content) {
    return <NotFound />;
  }

  // Get major category for breadcrumbs
  const subcategoryInfo = Object.values(subcategoryLabels).find(
    sub => sub.slug === categorySlug
  );
  const majorCategory = subcategoryInfo 
    ? getMajorCategoryBySubcategory(subcategoryInfo.value)
    : null;

  const handleCTA = () => {
    navigate(`/submit-lead?category=${content.formCategory}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumbs */}
      {majorCategory && (
        <div className="container mx-auto px-4 py-4 pt-24">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/kategorien">Kategorien</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/kategorie/${majorCategory.slug}`}>
                  {majorCategory.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{subcategoryInfo?.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-pastel-blue-50 via-surface to-pastel-grey-50 py-20 pt-12">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-ink-900 leading-tight">
            {content.title}
          </h1>
          <p className="text-xl text-ink-700 leading-relaxed max-w-3xl mx-auto">
            {content.description}
          </p>
          <div className="pt-6 space-y-3">
            <Button
              onClick={handleCTA}
              size="lg"
              className="h-14 px-10 text-lg rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] ring-2 ring-brand-400/50 hover:ring-brand-500 transition-all duration-300"
            >
              Jetzt Offerten einholen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-ink-600">
              Über 2'000 geprüfte Handwerker in der Schweiz
            </p>
          </div>
        </div>
      </section>

      {/* Service Types Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Section heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              Diese Dienstleistungen können Sie beauftragen
            </h2>
            <p className="text-lg text-ink-700 max-w-2xl mx-auto">
              Von kleinen Reparaturen bis zu grossen Projekten – finden Sie den passenden Fachbetrieb
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {content.services.map((service, idx) => {
              const ServiceIcon = service.icon;
              return (
                <Card key={idx} className="border-border hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white mb-4 shadow-md">
                      <ServiceIcon className="w-7 h-7" />
                    </div>
                    <CardTitle className="text-xl text-ink-900">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-ink-700 leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Category-Specific FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
              Häufige Fragen
            </h2>
            <p className="text-lg text-ink-700">
              Alles, was Sie wissen müssen
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {content.faq.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="bg-white rounded-lg shadow-sm border border-border px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-ink-900 hover:text-brand-600">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-ink-700 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-brand-50 to-pastel-blue-100 border-t border-border">
        <div className="container mx-auto px-4 text-center space-y-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900">
            Vergleichen Sie Offerten und sparen Sie Zeit
          </h2>
          <p className="text-xl text-ink-700">
            Beschreiben Sie Ihr Projekt in 3 Minuten. Erhalten Sie bis zu 5 passende Offerten von geprüften Fachbetrieben aus Ihrer Region.
          </p>
          <div className="pt-4">
            <Button
              onClick={handleCTA}
              size="lg"
              className="h-14 px-10 text-lg rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] ring-2 ring-brand-400/50 hover:ring-brand-500 transition-all duration-300"
            >
              Kostenlose Anfrage erstellen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CategoryLanding;
