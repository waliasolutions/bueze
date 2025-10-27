import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { TreePine, Layers, Zap, Paintbrush, Truck, MoreHorizontal, ArrowRight } from 'lucide-react';

const categories = [
  { value: 'garden', label: 'Garten', icon: TreePine },
  { value: 'flooring', label: 'Parkett & Boden', icon: Layers },
  { value: 'electrical', label: 'Elektro', icon: Zap },
  { value: 'painting', label: 'Malerarbeiten', icon: Paintbrush },
  { value: 'moving', label: 'Transport & Umzugsarbeiten', icon: Truck },
  { value: 'all', label: 'Alle Kategorien', icon: MoreHorizontal },
];

export const Hero = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryValue: string) => {
    if (categoryValue === 'all') {
      navigate('/submit-lead');
    } else {
      navigate(`/category/${categoryValue}`);
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-pastel-blue-50 via-surface to-pastel-grey-50">
      <div className="container mx-auto px-4 py-20">
        {/* Main Content - Centered */}
        <div className="max-w-4xl mx-auto text-center space-y-12">
          
          {/* Headlines */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-900 leading-tight">
              Finden Sie den besten Handwerker.{' '}
              <span className="text-brand-600">Für jedes Projekt.</span>
            </h1>
            <p className="text-lg md:text-xl text-ink-700 leading-relaxed max-w-2xl mx-auto">
              Erhalten Sie kostenlos mehrere Offerten von zertifizierten Handwerkern aus Ihrer Region.
            </p>
          </div>

          {/* Primary CTA */}
          <div className="py-10">
            <Button
              onClick={() => navigate('/submit-lead')}
              size="lg"
              className="h-16 px-12 text-xl rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] ring-4 ring-brand-400/30 hover:ring-brand-500/40 transition-all duration-300"
            >
              Auftrag erstellen
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </div>

          {/* Category Icons - Below Search */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 pt-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  onClick={() => handleCategoryClick(category.value)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-surface/80 transition-all duration-200 group min-w-[110px]"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200 shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-ink-800 text-center leading-tight">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-ink-600 pt-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
              <span>Über 5'000 geprüfte Betriebe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
              <span>Schweizweit verfügbar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
              <span>Kostenlos für Auftraggeber</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
