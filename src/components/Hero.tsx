import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TreePine, Layers, Zap, Paintbrush, Truck, MoreHorizontal, Search } from 'lucide-react';

const categories = [
  { value: 'garden', label: 'Garten', icon: TreePine },
  { value: 'flooring', label: 'Parkett & Boden', icon: Layers },
  { value: 'electrical', label: 'Elektro', icon: Zap },
  { value: 'painting', label: 'Malerarbeiten', icon: Paintbrush },
  { value: 'moving', label: 'Transport & Umzugsarbeiten', icon: Truck },
  { value: 'all', label: 'Alle Kategorien', icon: MoreHorizontal },
];

export const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/browse-leads?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (categoryValue: string) => {
    if (categoryValue === 'all') {
      navigate('/browse-leads');
    } else {
      navigate(`/browse-leads?category=${categoryValue}`);
    }
  };

  const handleExampleClick = () => {
    setSearchQuery('Montage Küche');
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

          {/* Category Icons */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  onClick={() => handleCategoryClick(category.value)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-surface/80 transition-all duration-200 group min-w-[120px]"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200 shadow-md">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-medium text-ink-800 text-center leading-tight">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Welche Arbeit soll erledigt werden?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="h-14 pl-5 pr-12 text-base rounded-full border-2 border-border focus-visible:border-brand-500 shadow-sm"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="h-14 px-8 rounded-full bg-[#FDB71A] hover:bg-[#E5A616] text-ink-900 font-semibold shadow-md"
              >
                Suchen
              </Button>
            </div>
            
            {/* Example Search */}
            <button
              onClick={handleExampleClick}
              className="text-sm text-ink-600 hover:text-brand-600 transition-colors"
            >
              Zum Beispiel: <span className="font-medium underline">Montage Küche</span>
            </button>
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
