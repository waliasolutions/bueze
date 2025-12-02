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
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-fade-in">
      <Card className="max-w-4xl mx-auto bg-white shadow-lg border border-line-200">
        <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Cookie className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600 flex-shrink-0 hidden sm:block" />
                <h2 className="text-lg sm:text-xl font-bold text-ink-900">Cookie-Einstellungen</h2>
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
              Wir verwenden Cookies zur Verbesserung Ihrer Erfahrung.
              <span className="hidden sm:inline"> Einige Cookies sind für den Betrieb der Website notwendig, während andere uns helfen, die Nutzung zu analysieren und zu verbessern.</span>
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

            <div className="space-y-3">
              <div className="flex flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptNecessary}
                  className="flex-1"
                >
                  Nur Notwendige
                </Button>
                {showDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveSettings}
                    className="flex-1"
                  >
                    Speichern
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-[1.5] shadow-md"
                >
                  Alle akzeptieren
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  {showDetails ? 'Details ausblenden' : 'Einstellungen anpassen'}
                </button>
                <Link to="/datenschutz" className="text-ink-600 hover:text-brand-700 underline">
                  Datenschutz
                </Link>
              </div>
            </div>
        </div>
      </Card>
    </div>
  );
};