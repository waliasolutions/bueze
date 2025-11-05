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
  
  // Scroll to top when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug]);
  
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
                <BreadcrumbLink href={`/kategorien/${majorCategory.slug}`}>
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
              <strong className="text-brand-600">Kostenlos & unverbindlich</strong> für Auftraggeber
            </p>
          </div>
        </div>
      </section>

      {/* Service Types Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {content.services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <Card key={idx} className="border-border hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white mb-4 shadow-md">
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl text-ink-900">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-ink-700 leading-relaxed">
                      {service.description}
                    </CardDescription>
                    <Button
                      onClick={handleCTA}
                      variant="outline"
                      className="w-full border-brand-500 text-brand-600 hover:bg-brand-50"
                    >
                      Offerte einholen
                    </Button>
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
      <section className="py-20 bg-pastel-blue-50">
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900">
            Bereit anzufangen?
          </h2>
          <p className="text-xl text-ink-700 max-w-2xl mx-auto">
            Erstellen Sie jetzt Ihre kostenlose Anfrage und erhalten Sie mehrere Offerten von qualifizierten Handwerkern.
          </p>
          <div className="pt-4 space-y-3">
            <Button
              onClick={handleCTA}
              size="lg"
              className="h-14 px-10 text-lg rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] ring-2 ring-brand-400/50 hover:ring-brand-500 transition-all duration-300"
            >
              Jetzt Auftrag erstellen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-ink-600">
              <strong className="text-brand-600">Kostenlos & unverbindlich</strong> für Auftraggeber
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CategoryLanding;
