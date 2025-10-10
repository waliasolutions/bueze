import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Zap, 
  Droplets, 
  Paintbrush, 
  Hammer, 
  TreePine, 
  Flame,
  Layers,
  Home
} from 'lucide-react';

const categories = [
  { icon: Droplets, name: 'Sanitär' },
  { icon: Zap, name: 'Elektrik' },
  { icon: Paintbrush, name: 'Malerei' },
  { icon: Hammer, name: 'Schreinerei' },
  { icon: Home, name: 'Dacharbeiten' },
  { icon: Layers, name: 'Bodenbeläge' },
  { icon: Flame, name: 'Heizung' },
  { icon: TreePine, name: 'Garten' }
];

export const Categories = () => {
  return (
    <section className="py-20 bg-pastel-grey-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
            Alle Handwerk-Kategorien
          </h2>
          <p className="text-xl text-ink-700 max-w-2xl mx-auto">
            Von Elektriker bis Gartenbau – finden Sie Experten für jedes Projekt
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={index} 
                className="p-6 text-center border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-surface hover:bg-pastel-blue-50 cursor-pointer group"
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-200 transition-colors">
                  <IconComponent className="h-6 w-6 text-brand-600" />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-ink-900 mb-2 text-sm md:text-base">
                  {category.name}
                </h3>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};