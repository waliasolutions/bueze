import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { majorCategories } from '@/config/majorCategories';

const homeCategories = Object.values(majorCategories)
  .filter(cat => cat.showOnHome)
  .slice(0, 6);

interface HeroProps {
  content?: {
    fields?: {
      title?: string;
      subtitle?: string;
      subIntro?: string;
      ctaText?: string;
      trustSignals?: string[];
    };
  } | null;
  loading?: boolean;
}

export const Hero = ({ content, loading = false }: HeroProps) => {
  const navigate = useNavigate();

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/kategorien/${categorySlug}`);
  };

  return (
    <section id="hero" className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-pastel-blue-50 via-surface to-pastel-grey-50">
      <div className="container mx-auto px-4 py-20">
        {/* Main Content - Centered */}
        <div className="max-w-4xl mx-auto text-center space-y-12">
          
          {/* Headlines */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-900 leading-tight">
              {content?.fields?.title || 'Handwerker finden. Projekte realisieren.'}
            </h1>
            <p className="text-lg md:text-xl text-ink-700 leading-relaxed max-w-2xl mx-auto">
              {content?.fields?.subtitle || 'Ihr lokaler Handwerker-Marktplatz für die ganze Schweiz'}
            </p>
            <p className="text-sm md:text-base text-ink-500 leading-relaxed max-w-xl mx-auto mt-6">
              {content?.fields?.subIntro || 'Unser Portal bringt Sie mit erfahrenen Handwerkern aus der ganzen Schweiz zusammen – für Reparaturen, Renovierungen und Projekte jeder Grösse.'}
            </p>
          </div>

          {/* Primary CTA */}
          <div className="py-10 flex justify-center">
            <Button
              onClick={() => navigate('/submit-lead')}
              size="lg"
              className="relative h-16 px-12 text-xl rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold 
                shadow-lg hover:shadow-xl 
                transition-all duration-300 
                hover:scale-105 active:scale-95
                group"
            >
              <span className="relative z-10">{content?.fields?.ctaText || 'Jetzt starten'}</span>
              <ArrowRight className="relative z-10 ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Category Icons - Below Search */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 pt-4">
            {homeCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-surface/80 active:bg-surface/60 transition-all duration-200 group min-w-[80px] sm:min-w-[110px] min-h-[44px]"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white group-hover:scale-110 active:scale-95 transition-transform duration-200 shadow-md`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-ink-800 text-center leading-tight">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* "All Categories" Button */}
          <div className="flex justify-center pt-6 sm:pt-8">
            <Button
              onClick={() => navigate('/kategorien')}
              variant="outline"
              size="lg"
              className="text-brand-600 border-brand-600 hover:bg-brand-50 border-2 min-h-[44px]"
            >
              Alle Kategorien ansehen
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-6 md:gap-8 text-xs sm:text-sm text-ink-600 pt-6 sm:pt-8">
            {(content?.fields?.trustSignals || [
              'Geprüfte Fachbetriebe schweizweit',
              'Kostenlos & unverbindlich für Auftraggeber',
              'Schweizer Datenschutzstandards'
            ]).map((signal: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0"></div>
                <span dangerouslySetInnerHTML={{ __html: signal }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
