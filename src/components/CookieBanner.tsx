import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
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

  useEffect(() => {
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
    
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: fullConsent }));
  };

  const handleAccept = () => {
    saveConsent({ analytics: true, marketing: true });
  };

  const handleClose = () => {
    saveConsent({ analytics: false, marketing: false });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-fade-in">
      <Card className="max-w-2xl mx-auto bg-white shadow-lg border border-line-200">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-ink-700 text-sm leading-relaxed">
                Wir verwenden Cookies zur Verbesserung Ihrer Erfahrung.
                <span className="hidden sm:inline"> Einige sind für den Betrieb notwendig, andere helfen uns, die Nutzung zu analysieren.</span>
                {' '}
                <Link to="/datenschutz" className="text-brand-600 hover:text-brand-700 underline">
                  Datenschutz
                </Link>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-ink-600 hover:text-ink-900 transition-colors flex-shrink-0"
              aria-label="Banner schliessen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button
              size="lg"
              onClick={handleAccept}
              className="shadow-md px-8"
            >
              Akzeptieren
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};