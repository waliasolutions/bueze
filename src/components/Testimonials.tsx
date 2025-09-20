import React from 'react';
import { Card } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Schneider',
    location: 'Zürich',
    rating: 5,
    text: 'Dank HandwerkerLeads habe ich innerhalb von 2 Stunden drei Offerten erhalten. Die Qualität der Handwerker war ausgezeichnet.',
    project: 'Badumbau'
  },
  {
    name: 'Thomas Weber',
    location: 'Basel',
    rating: 5,
    text: 'Sehr professionell und transparent. Der gefundene Elektriker hat pünktlich und sauber gearbeitet. Gerne wieder!',
    project: 'Elektroinstallation'
  },
  {
    name: 'Anna Müller',
    location: 'Bern',
    rating: 5,
    text: 'Endlich eine Plattform, die hält was sie verspricht. Faire Preise und kompetente Handwerker aus der Region.',
    project: 'Küchenmontage'
  }
];

export const Testimonials = () => {
  return (
    <section className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
            Das sagen unsere Kunden
          </h2>
          <p className="text-xl text-ink-700 max-w-2xl mx-auto">
            Über 25'000 zufriedene Kunden vertrauen auf HandwerkerLeads
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-surface relative">
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
                  <Quote className="h-4 w-4 text-ink-900" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-brand-500 text-brand-500" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-ink-700 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author Info */}
              <div className="space-y-1">
                <div className="font-semibold text-ink-900">
                  {testimonial.name}
                </div>
                <div className="text-sm text-ink-500">
                  {testimonial.location} • {testimonial.project}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trust Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-600 mb-2">25'000+</div>
            <div className="text-ink-700">Zufriedene Kunden</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-600 mb-2">5'000+</div>
            <div className="text-ink-700">Geprüfte Betriebe</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-600 mb-2">4.8</div>
            <div className="text-ink-700">Durchschnittsbewertung</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-600 mb-2">2h</div>
            <div className="text-ink-700">Ø Antwortzeit</div>
          </div>
        </div>
      </div>
    </section>
  );
};