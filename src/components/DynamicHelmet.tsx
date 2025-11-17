import React, { useEffect } from 'react';

interface DynamicHelmetProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  robotsMeta?: string;
}

export const DynamicHelmet: React.FC<DynamicHelmetProps> = ({
  title,
  description,
  canonical,
  ogImage,
  robotsMeta = 'index,follow',
}) => {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = title;
    }

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

    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description, true);
    }

    if (title) {
      updateMetaTag('og:title', title, true);
    }

    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
    }

    if (robotsMeta) {
      updateMetaTag('robots', robotsMeta);
    }

    // Update canonical link
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]');
      
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      
      linkElement.setAttribute('href', canonical);
    }

    // Cleanup function
    return () => {
      // Reset to default title on unmount
      document.title = 'Büeze.ch - Geprüfte Handwerker in der Schweiz finden';
    };
  }, [title, description, canonical, ogImage, robotsMeta]);

  return null;
};
