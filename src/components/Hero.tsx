import React from 'react';
import { Button } from './ui/button';
import heroCraftsman from '@/assets/hero-craftsman.jpg';

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-pastel-blue-50 via-surface to-pastel-green-50">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroCraftsman} 
          alt="Schweizer Handwerker bei der Arbeit"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-pastel-blue-50/80 to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-900 leading-tight">
                  Geprüfte{' '}
                  <span className="text-brand-600">Handwerker</span>{' '}
                  in der Schweiz
                </h1>
                <p className="text-xl text-ink-700 leading-relaxed max-w-xl">
                  Schnell, vertrauenswürdig und transparent. Finden Sie den richtigen Experten für Ihr Projekt.
                </p>
                <div className="flex gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => window.location.href = '/submit-lead'}
                    variant="hero"
                  >
                    Auftrag erstellen
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Für Handwerker
                  </Button>
                </div>
              </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap gap-6 text-sm text-ink-500">
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

          {/* Right Column - Value Proposition */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-surface/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-md">
              <h3 className="text-2xl font-bold text-ink-900 mb-4">
                Warum HandwerkerLeads?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-ink-800">Kostenlos für Sie</h4>
                    <p className="text-sm text-ink-600">Auftrag erstellen ist völlig kostenfrei</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-ink-800">Qualifizierte Angebote</h4>
                    <p className="text-sm text-ink-600">Nur geprüfte Handwerker können Ihnen Offerten senden</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-brand-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-ink-800">Schnelle Antworten</h4>
                    <p className="text-sm text-ink-600">Erhalten Sie Angebote innerhalb von 24 Stunden</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};