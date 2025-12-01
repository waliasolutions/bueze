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

    // Inject GTM only if analytics consent is given
    if (settings.gtm_container_id && checkConsent() && !document.querySelector(`script[data-gtm="${settings.gtm_container_id}"]`)) {
      // GTM script
      const gtmScript = document.createElement('script');
      gtmScript.setAttribute('data-gtm', settings.gtm_container_id);
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${settings.gtm_container_id}');
      `;
      document.head.appendChild(gtmScript);

      // GTM noscript
      const gtmNoscript = document.createElement('noscript');
      const gtmIframe = document.createElement('iframe');
      gtmIframe.src = `https://www.googletagmanager.com/ns.html?id=${settings.gtm_container_id}`;
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
      if (consent.analytics && !document.querySelector(`script[data-gtm="${settings.gtm_container_id}"]`)) {
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
