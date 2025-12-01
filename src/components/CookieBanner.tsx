import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const CONSENT_KEY = 'bueeze_cookie_consent';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const existingConsent = localStorage.getItem(CONSENT_KEY);
    if (!existingConsent) {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = (consent: Omit<CookieConsent, 'necessary' | 'timestamp'>) => {
    const fullConsent: CookieConsent = {
      necessary: true,
      ...consent,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent));
    setIsVisible(false);
    
    // Trigger a custom event so GlobalScriptManager can reload scripts if needed
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: fullConsent }));
  };

  const handleAcceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
  };

  const handleAcceptNecessary = () => {
    saveConsent({ analytics: false, marketing: false });
  };

  const handleSaveSettings = () => {
    saveConsent({ analytics: analyticsConsent, marketing: marketingConsent });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm" />
      
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] p-4 animate-fade-in">
        <Card className="max-w-4xl mx-auto bg-white shadow-2xl border-2 border-line-200">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Cookie className="h-6 w-6 text-brand-600 flex-shrink-0" />
                <h2 className="text-xl font-bold text-ink-900">Cookie-Einstellungen</h2>
              </div>
              <button
                onClick={handleAcceptNecessary}
                className="text-ink-600 hover:text-ink-900 transition-colors"
                aria-label="Banner schliessen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-ink-700 mb-4 text-sm leading-relaxed">
              Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. 
              Einige Cookies sind für den Betrieb der Website notwendig, während andere uns helfen, 
              die Nutzung zu analysieren und zu verbessern.
            </p>

            {showDetails && (
              <div className="space-y-3 mb-4 p-4 bg-pastel-pink/20 rounded-lg border border-line-200">
                {/* Necessary Cookies */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={true}
                    disabled
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label className="font-semibold text-ink-900 text-sm block">
                      Notwendige Cookies
                    </label>
                    <p className="text-xs text-ink-600 mt-1">
                      Diese Cookies sind für den Betrieb der Website erforderlich und können nicht deaktiviert werden.
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={analyticsConsent}
                    onCheckedChange={(checked) => setAnalyticsConsent(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label className="font-semibold text-ink-900 text-sm block cursor-pointer">
                      Analyse-Cookies
                    </label>
                    <p className="text-xs text-ink-600 mt-1">
                      Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label className="font-semibold text-ink-900 text-sm block cursor-pointer">
                      Marketing-Cookies
                    </label>
                    <p className="text-xs text-ink-600 mt-1">
                      Diese Cookies werden verwendet, um relevante Werbung anzuzeigen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors text-left"
              >
                {showDetails ? 'Details ausblenden' : 'Einstellungen anpassen'}
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptNecessary}
                  className="w-full sm:w-auto"
                >
                  Nur Notwendige
                </Button>
                {showDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveSettings}
                    className="w-full sm:w-auto"
                  >
                    Einstellungen speichern
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto"
                >
                  Alle akzeptieren
                </Button>
              </div>
            </div>

            <p className="text-xs text-ink-600 mt-4">
              Mehr Informationen finden Sie in unserer{' '}
              <Link to="/datenschutz" className="text-brand-600 hover:text-brand-700 underline">
                Datenschutzerklärung
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};