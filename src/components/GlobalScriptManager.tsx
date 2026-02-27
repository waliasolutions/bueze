import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const GlobalScriptManager = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    // Check cookie consent before injecting GTM
    const checkConsent = () => {
      const consentString = localStorage.getItem('bueeze_cookie_consent');
      if (!consentString) return false; // No consent given yet
      
      try {
        const consent = JSON.parse(consentString);
        return consent.analytics === true; // Only inject if analytics is accepted
      } catch {
        return false;
      }
    };

    // Validate GTM container ID format before injecting
    const gtmId = settings.gtm_container_id;
    const isValidGtmId = gtmId && /^GTM-[A-Z0-9]+$/.test(gtmId);

    // Inject GTM only if analytics consent is given and ID is valid
    if (isValidGtmId && checkConsent() && !document.querySelector(`script[data-gtm="${gtmId}"]`)) {
      // GTM script
      const gtmScript = document.createElement('script');
      gtmScript.setAttribute('data-gtm', gtmId);
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(gtmScript);

      // GTM noscript
      const gtmNoscript = document.createElement('noscript');
      const gtmIframe = document.createElement('iframe');
      gtmIframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
      gtmIframe.height = '0';
      gtmIframe.width = '0';
      gtmIframe.style.display = 'none';
      gtmIframe.style.visibility = 'hidden';
      gtmNoscript.appendChild(gtmIframe);
      document.body.insertBefore(gtmNoscript, document.body.firstChild);
    }

    // Listen for consent changes
    const handleConsentUpdate = (event: CustomEvent) => {
      const consent = event.detail;
      // If analytics consent is now given and GTM not loaded, reload page
      if (consent.analytics && isValidGtmId && !document.querySelector(`script[data-gtm="${gtmId}"]`)) {
        window.location.reload();
      }
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, [settings]);

  return null;
};
