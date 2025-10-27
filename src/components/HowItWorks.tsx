import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, UserCheck, MessageSquare, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Projekt beschreiben',
    description: 'Teilen Sie uns mit, wobei Sie Hilfe brauchen.',
    highlight: 'Kostenlos & unverbindlich.',
    step: '01'
  },
  {
    icon: UserCheck,
    title: 'Handwerker erhalten',
    description: 'Wir finden passende, geprüfte Handwerker in Ihrer Region.',
    step: '02'
  },
  {
    icon: MessageSquare,
    title: 'Direkt vergleichen',
    description: 'Erhalten Sie Offerten und wählen Sie den besten Anbieter.',
    step: '03'
  }
];

export const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
            So einfach funktioniert es
          </h2>
          <p className="text-xl text-ink-700 max-w-2xl mx-auto">
            In drei simplen Schritten zum perfekten Handwerker
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card key={index} className="relative p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-surface">
                {/* Step Number */}
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {step.step}
                  </div>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <IconComponent className="h-8 w-8 text-brand-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-ink-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-ink-700 leading-relaxed">
                  {step.description}
                </p>
                {step.highlight && (
                  <p className="text-brand-600 font-bold mt-2">
                    {step.highlight}
                  </p>
                )}

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-brand-200"></div>
                )}
              </Card>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate('/submit-lead')}
            className="px-8 py-6 text-lg bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Jetzt Anfrage erstellen
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};