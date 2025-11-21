import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { majorCategories } from '@/config/majorCategories';
import { usePageContent } from '@/hooks/usePageContent';

const homeCategories = Object.values(majorCategories)
  .filter(cat => cat.showOnHome)
  .slice(0, 6);

export const Hero = () => {
  const navigate = useNavigate();
  const { content, loading } = usePageContent('homepage_hero');

  const handleCategoryClick = (categorySlug: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/kategorie/${categorySlug}`);
  };

  return (
    <section id="hero" className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-pastel-blue-50 via-surface to-pastel-grey-50">
      <div className="container mx-auto px-4 py-20">
        {/* Main Content - Centered */}
        <div className="max-w-4xl mx-auto text-center space-y-12">
          
          {/* Headlines */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-900 leading-tight">
              {content?.fields?.title || 'Den richtigen Handwerker für Ihr Projekt finden'}
            </h1>
            <p className="text-lg md:text-xl text-ink-700 leading-relaxed max-w-2xl mx-auto">
              {content?.fields?.subtitle || 'Kostenlose Offerten von geprüften Handwerkern.'}
            </p>
          </div>

          {/* Primary CTA */}
          <div className="py-10 flex justify-center">
            <Button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                navigate('/submit-lead');
              }}
              size="lg"
              className="relative h-16 px-12 text-xl rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold 
                shadow-lg hover:shadow-xl 
                transition-all duration-300 
                hover:scale-105 active:scale-95
                group"
            >
              <span className="relative z-10">{content?.fields?.ctaText || 'Auftrag erstellen'}</span>
              <ArrowRight className="relative z-10 ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Category Icons - Below Search */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 pt-4">
            {homeCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-surface/80 transition-all duration-200 group min-w-[110px]"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200 shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-ink-800 text-center leading-tight">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* "All Categories" Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                navigate('/kategorien');
              }}
              variant="outline"
              size="lg"
              className="text-brand-600 border-brand-600 hover:bg-brand-50 border-2"
            >
              Alle Kategorien ansehen
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-ink-600 pt-8">
            {(content?.fields?.trustSignals || [
              'Über 100 geprüfte Betriebe',
              'Kostenlos & unverbindlich für Auftraggeber',
              'Geprüfte Fachbetriebe'
            ]).map((signal: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                <span dangerouslySetInnerHTML={{ __html: signal }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
