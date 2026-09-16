import React, { useEffect } from 'react';

export interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  keywords,
  ogImage = 'https://turismotunkychasky.com.pe/og-image.png',
  noIndex = false,
}) => {
  useEffect(() => {
    // 1. Update document title
    const formattedTitle = title.includes('Tunky Chasky')
      ? title
      : `${title} | Tunky Chasky`;
    document.title = formattedTitle;

    // Helper to create or update meta tags
    const setMetaTag = (attr: 'name' | 'property', key: string, value: string | undefined) => {
      if (!value) return;
      let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    // 2. Meta Description
    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
      setMetaTag('name', 'twitter:description', description);
    }

    // 3. Keywords
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 4. Canonical Link
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonical);
      setMetaTag('property', 'og:url', canonical);
    }

    // 5. OpenGraph & Twitter Title
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('name', 'twitter:title', formattedTitle);

    // 6. Image
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('name', 'twitter:image', ogImage);

    // 7. Robots (noIndex for private/admin/transaction pages)
    setMetaTag(
      'name',
      'robots',
      noIndex
        ? 'noindex, nofollow'
        : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );
  }, [title, description, canonical, keywords, ogImage, noIndex]);

  return null;
};
