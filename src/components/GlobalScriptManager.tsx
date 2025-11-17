import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const GlobalScriptManager = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    // Inject GTM
    if (settings.gtm_container_id && !document.querySelector(`script[data-gtm="${settings.gtm_container_id}"]`)) {
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

    // Inject Google Search Console verification
    if (settings.google_search_console_verification) {
      let metaTag = document.querySelector('meta[name="google-site-verification"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'google-site-verification');
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', settings.google_search_console_verification);
    }
  }, [settings]);

  return null;
};
