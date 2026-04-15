import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const GlobalScriptManager = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    // Check cookie consent before injecting scripts
    const getConsent = () => {
      const consentString = localStorage.getItem('bueeze_cookie_consent');
      if (!consentString) return null;
      
      try {
        return JSON.parse(consentString) as { analytics?: boolean; marketing?: boolean };
      } catch {
        return null;
      }
    };

    const consent = getConsent();

    // Validate GTM container ID format before injecting
    const gtmId = settings.gtm_container_id;
    const isValidGtmId = gtmId && /^GTM-[A-Z0-9]+$/.test(gtmId);

    // Inject GTM only if analytics consent is given and ID is valid
    if (isValidGtmId && consent?.analytics && !document.querySelector(`script[data-gtm="${gtmId}"]`)) {
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

    // Inject Google Ads gtag.js only if marketing consent is given
    const GOOGLE_ADS_ID = 'AW-18090737196';
    if (consent?.marketing && !document.querySelector('script[data-gtag-ads]')) {
      // Loader script
      const gtagLoader = document.createElement('script');
      gtagLoader.async = true;
      gtagLoader.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
      gtagLoader.setAttribute('data-gtag-ads', GOOGLE_ADS_ID);
      document.head.appendChild(gtagLoader);

      // Config script
      const gtagConfig = document.createElement('script');
      gtagConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GOOGLE_ADS_ID}');
      `;
      document.head.appendChild(gtagConfig);
    }

    // Listen for consent changes
    const handleConsentUpdate = (event: CustomEvent) => {
      const newConsent = event.detail;
      const needsReload =
        (newConsent.analytics && isValidGtmId && !document.querySelector(`script[data-gtm="${gtmId}"]`)) ||
        (newConsent.marketing && !document.querySelector('script[data-gtag-ads]'));
      if (needsReload) {
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
