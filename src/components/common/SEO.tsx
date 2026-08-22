import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  schema?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = 'كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية | الموقع الرسمي';
const DEFAULT_DESC = 'الموقع الرسمي لكنيسة السيدة العذراء مريم بمحرم بك، الإسكندرية. مواعيد القداسات الإلهية، عظات الآباء الكهنة، البث المباشر، تاريخ الكنيسة العريق منذ عام 1934، وخدمات التربية الكنسية.';
const DEFAULT_IMAGE = '/church.jpeg';
const SITE_NAME = 'كنيسة السيدة العذراء مريم - محرم بك';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESC,
  keywords = [],
  canonicalUrl,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  schema,
}) => {
  useEffect(() => {
    // 1. Page Title
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to update or create meta tags
    const updateMeta = (nameOrProperty: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameOrProperty}="${attrValue}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameOrProperty, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Meta Description & Keywords
    updateMeta('name', 'description', description);
    
    const defaultKeywords = [
      'كنيسة العذراء محرم بك',
      'كنيسة السيدة العذراء مريم بمحرم بك',
      'كنيسة العذراء اسكندرية',
      'قداسات كنيسة العذراء محرم بك',
      'تاريخ كنيسة العذراء محرم بك',
      'كهنة كنيسة العذراء محرم بك',
      'بث مباشر كنيسة العذراء محرم بك',
      'St Mary Moharam Bek',
      'St Mary Church Alexandria',
      'كنيسة قبطية ارثوذكسية محرم بك'
    ];
    const allKeywords = Array.from(new Set([...keywords, ...defaultKeywords])).join(', ');
    updateMeta('name', 'keywords', allKeywords);

    // 3. Open Graph Tags
    updateMeta('property', 'og:title', fullTitle);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:type', ogType);
    updateMeta('property', 'og:site_name', SITE_NAME);
    updateMeta('property', 'og:locale', 'ar_EG');
    updateMeta('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`);
    updateMeta('property', 'og:url', canonicalUrl || window.location.href);

    // 4. Twitter Card
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:title', fullTitle);
    updateMeta('name', 'twitter:description', description);
    updateMeta('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`);

    // 5. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl || window.location.href);

    // 6. Schema.org JSON-LD Structured Data
    const existingDynamicScript = document.getElementById('dynamic-page-schema');
    if (existingDynamicScript) {
      existingDynamicScript.remove();
    }

    if (schema) {
      const script = document.createElement('script');
      script.id = 'dynamic-page-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      const scriptToRemove = document.getElementById('dynamic-page-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, schema]);

  return null;
};
