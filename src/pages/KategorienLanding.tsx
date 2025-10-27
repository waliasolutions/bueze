import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TreePine, Layers, Zap, Paintbrush, Truck, ChefHat, ArrowRight } from 'lucide-react';

const categories = [
  { 
    value: 'garden', 
    label: 'Garten', 
    icon: TreePine,
    description: 'Gartengestaltung, Pflege und Landschaftsbau von erfahrenen Experten.'
  },
  { 
    value: 'flooring', 
    label: 'Parkett & Boden', 
    icon: Layers,
    description: 'Professionelle Bodenverlegung für jeden Raum und Stil.'
  },
  { 
    value: 'electrical', 
    label: 'Elektro', 
    icon: Zap,
    description: 'Sichere Elektroinstallationen und Reparaturen vom Fachmann.'
  },
  { 
    value: 'painting', 
    label: 'Malerarbeiten', 
    icon: Paintbrush,
    description: 'Innen- und Aussenanstriche für frischen Glanz.'
  },
  { 
    value: 'moving', 
    label: 'Transport & Umzugsarbeiten', 
    icon: Truck,
    description: 'Zuverlässige Umzugs- und Transportdienstleistungen.'
  },
  { 
    value: 'kitchen', 
    label: 'Küchenbau', 
    icon: ChefHat,
    description: 'Massgeschneiderte Küchenplanung und -montage.'
  },
];

const KategorienLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-pastel-blue-50 via-surface to-pastel-grey-50 py-20 pt-32">
        <div className="container mx-auto px-4 max-w-6xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-ink-900 leading-tight">
            Alle Handwerk-Kategorien
          </h1>
          <p className="text-xl text-ink-700 leading-relaxed max-w-3xl mx-auto">
            Wählen Sie die passende Kategorie für Ihr Projekt und erhalten Sie kostenlos mehrere Offerten von qualifizierten Handwerkern.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={category.value} 
                  className="border-border hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/category/${category.value}`)}
                >
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl text-ink-900">{category.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-ink-700 leading-relaxed text-base">
                      {category.description}
                    </CardDescription>
                    <Button
                      variant="outline"
                      className="w-full border-brand-500 text-brand-600 hover:bg-brand-50 group-hover:bg-brand-50"
                    >
                      Mehr erfahren
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default KategorienLanding;
