import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { categoryContent } from '@/config/categoryContent';
import { HowItWorks } from '@/components/HowItWorks';
import NotFound from './NotFound';

const MajorCategoryLanding = () => {
  const { majorCategorySlug } = useParams();
  const navigate = useNavigate();
  
  const majorCategory = Object.values(majorCategories).find(
    cat => cat.slug === majorCategorySlug
  );
  
  if (!majorCategory) {
    return <NotFound />;
  }
  
  const Icon = majorCategory.icon;
  const subcategories = majorCategory.subcategories
    .map(subId => subcategoryLabels[subId])
    .filter(Boolean);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumbs */}
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
              <BreadcrumbPage>{majorCategory.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-pastel-blue-50 to-surface">
        <div className="container mx-auto px-4 text-center">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${majorCategory.color} flex items-center justify-center text-white mx-auto mb-6 shadow-lg`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-ink-900 mb-4">
            {majorCategory.label}
          </h1>
          <p className="text-xl text-ink-700 max-w-3xl mx-auto mb-8">
            {majorCategory.description}
          </p>
          <Button
            onClick={() => navigate('/submit-lead')}
            size="lg"
            className="h-14 px-10 text-lg rounded-full"
          >
            Auftrag erstellen
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
      
      {/* Subcategories as Rich Content Sections */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4 text-ink-900">
            Unsere Dienstleistungen in {majorCategory.label}
          </h2>
          <p className="text-center text-ink-700 mb-12 max-w-2xl mx-auto">
            Finden Sie den passenden Handwerker für Ihr Projekt – kostenlos und unverbindlich
          </p>
          
          <div className="space-y-16">
            {subcategories.map((subcat, index) => {
              const content = categoryContent[subcat.slug];
              const SubIcon = Icon;
              
              return (
                <div 
                  key={subcat.value} 
                  id={subcat.value}
                  className="scroll-mt-24"
                >
                  <Card className="border-2 border-border overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-pastel-blue-50 to-surface pb-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${majorCategory.color} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                          <SubIcon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-2xl text-ink-900 mb-2">{subcat.label}</CardTitle>
                          <CardDescription className="text-base text-ink-700">
                            {subcat.shortDescription || content?.description || ''}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {content && content.services && content.services.length > 0 && (
                      <CardContent className="pt-6">
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          {content.services.slice(0, 3).map((service, idx) => {
                            const ServiceIcon = service.icon;
                            return (
                              <div key={idx} className="p-4 rounded-lg bg-pastel-grey-50 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                  <ServiceIcon className="w-5 h-5 text-brand-600" />
                                  <h4 className="font-semibold text-ink-900">{service.title}</h4>
                                </div>
                                <p className="text-sm text-ink-700">{service.description}</p>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex justify-center">
                          <Button
                            onClick={() => navigate(`/submit-lead?category=${content.formCategory}`)}
                            className="h-12 px-8"
                          >
                            Offerte einholen für {subcat.label}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                    
                    {(!content || !content.services || content.services.length === 0) && (
                      <CardContent className="pt-6">
                        <div className="flex justify-center">
                          <Button
                            onClick={() => navigate(`/submit-lead`)}
                            className="h-12 px-8"
                          >
                            Offerte einholen für {subcat.label}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Benefits Section */}
      <section className="py-16 bg-pastel-grey-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-ink-900">
            Ihre Vorteile mit Büeze.ch
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {majorCategory.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-ink-700 font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-4 text-ink-900">
            Häufig gestellte Fragen
          </h2>
          <p className="text-center text-ink-700 mb-12">
            Antworten zu {majorCategory.label}
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            {majorCategory.faq.map((faqItem, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-ink-900">
                  {faqItem.question}
                </AccordionTrigger>
                <AccordionContent className="text-ink-700">
                  {faqItem.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bereit für Ihr Projekt?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Erstellen Sie jetzt Ihre Anfrage und erhalten Sie kostenlose Offerten
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => navigate('/submit-lead')}
            className="h-14 px-10 text-lg"
          >
            Jetzt Auftrag erstellen
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default MajorCategoryLanding;
