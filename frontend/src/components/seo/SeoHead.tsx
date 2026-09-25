import React, { useEffect } from 'react';

export interface SeoHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: 'website' | 'profile' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'Artifix — The Verified Artisan Trust Network';
const DEFAULT_DESC =
  'Artifix bridges fiat and Web3 smart contract escrow for verified artisans in Nigeria, guaranteeing zero-dispute deliverable settlements.';
const DEFAULT_IMAGE = '/brand/logo.png';
const DEFAULT_TWITTER_HANDLE = '@ArtifixEscrow';

function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  ogImageAlt = 'Artifix Verified Artisan Network',
  twitterCard = 'summary_large_image',
  jsonLd,
}) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // 2. Standard Meta
    setMetaTag('name', 'description', description);

    // 3. OpenGraph Tags
    const fullCanonical = canonical || (typeof window !== 'undefined' ? window.location.href : 'https://artifixhq.xyz');
    const fullOgImage = ogImage.startsWith('http')
      ? ogImage
      : (typeof window !== 'undefined' ? `${window.location.origin}${ogImage}` : `https://artifixhq.xyz${ogImage}`);

    setCanonical(fullCanonical);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', fullCanonical);
    setMetaTag('property', 'og:image', fullOgImage);
    setMetaTag('property', 'og:image:alt', ogImageAlt);
    setMetaTag('property', 'og:site_name', 'Artifix');

    // 4. Twitter Card
    setMetaTag('name', 'twitter:card', twitterCard);
    setMetaTag('name', 'twitter:site', DEFAULT_TWITTER_HANDLE);
    setMetaTag('name', 'twitter:creator', DEFAULT_TWITTER_HANDLE);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', fullOgImage);

    // 5. Structured Data JSON-LD
    let scriptTag: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptTag = document.querySelector('script[data-seo-jsonld="true"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.setAttribute('data-seo-jsonld', 'true');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      // Cleanup custom JSON-LD on unmount
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [title, description, canonical, ogType, ogImage, ogImageAlt, twitterCard, jsonLd]);

  // React 19 native tags support
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical || (typeof window !== 'undefined' ? window.location.href : 'https://artifixhq.xyz')} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
};

export default SeoHead;
