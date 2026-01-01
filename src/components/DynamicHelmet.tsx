import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const CANONICAL_DOMAIN = 'https://bueeze.ch';

interface DynamicHelmetProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  robotsMeta?: string;
  schemaMarkup?: string;
}

export const DynamicHelmet: React.FC<DynamicHelmetProps> = ({
  title,
  description,
  canonical,
  ogImage,
  robotsMeta = 'index,follow',
  schemaMarkup,
}) => {
  const { settings } = useSiteSettings();
  const location = useLocation();
  
  useEffect(() => {
    // Update title with fallback to default
    const finalTitle = title || settings?.default_meta_title || 'Büeze.ch - Geprüfte Handwerker in der Schweiz finden';
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Use provided values or fallback to defaults from settings
    const finalDescription = description || settings?.default_meta_description || '';
    const finalOgImage = ogImage || settings?.default_og_image || '';
    const siteName = settings?.site_name || 'Büeze.ch';

    if (finalDescription) {
      updateMetaTag('description', finalDescription);
      updateMetaTag('og:description', finalDescription, true);
    }

    if (finalTitle) {
      updateMetaTag('og:title', finalTitle, true);
    }

    if (finalOgImage) {
      updateMetaTag('og:image', finalOgImage, true);
    }

    // Add site name
    updateMetaTag('og:site_name', siteName, true);
    updateMetaTag('og:type', 'website', true);

    if (robotsMeta) {
      updateMetaTag('robots', robotsMeta);
    }

    // Auto-generate canonical URL if not provided
    const currentPath = location.pathname;
    const cleanPath = currentPath.endsWith('/') && currentPath !== '/' 
      ? currentPath.slice(0, -1) 
      : currentPath;
    const finalCanonical = canonical || `${CANONICAL_DOMAIN}${cleanPath}`;

    // Always set canonical link
    let linkElement = document.querySelector('link[rel="canonical"]');
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.setAttribute('rel', 'canonical');
      document.head.appendChild(linkElement);
    }
    linkElement.setAttribute('href', finalCanonical);

    // Also set og:url for social sharing
    updateMetaTag('og:url', finalCanonical, true);

    // Inject schema markup if provided
    if (schemaMarkup) {
      let scriptTag = document.querySelector('script[type="application/ld+json"][data-dynamic-helmet]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('data-dynamic-helmet', 'true');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = schemaMarkup;
    }

    // Cleanup function
    return () => {
      // Reset to default title on unmount
      const defaultTitle = settings?.default_meta_title || 'Büeze.ch - Geprüfte Handwerker in der Schweiz finden';
      document.title = defaultTitle;
    };
  }, [title, description, canonical, ogImage, robotsMeta, schemaMarkup, settings, location.pathname]);

  return null;
};
