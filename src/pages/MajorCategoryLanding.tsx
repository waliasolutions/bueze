import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
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
            <Icon className="w-10 h-10" />
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
      
      {/* Subcategories Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-ink-900">
            Alle Dienstleistungen in {majorCategory.label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcategories.map((subcat) => (
              <Card 
                key={subcat.value}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-border"
                onClick={() => navigate(`/category/${subcat.slug}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg text-ink-900">{subcat.label}</CardTitle>
                  <CardDescription className="text-ink-700">{subcat.shortDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full text-brand-600 hover:bg-brand-50">
                    Mehr erfahren →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-16 bg-pastel-grey-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-ink-900">
            Ihre Vorteile mit Büeze.ch
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Kostenlos & unverbindlich Offerten einholen',
              'Geprüfte und zertifizierte Handwerker',
              'Mehrere Angebote zum Vergleichen',
              'Schnelle Rückmeldung innert 24h',
              'Faire Preise durch Wettbewerb',
              'Schweizweite Abdeckung'
            ].map((benefit, index) => (
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
