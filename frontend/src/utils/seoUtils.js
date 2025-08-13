/**
 * SEO and Social Sharing Utilities for News Distribution
 * Production-ready SEO optimization for news articles and content
 */

import { getNewsFeaturedImageUrl } from './imageUtils';

/**
 * Generate SEO-optimized meta tags for news articles
 */
export const generateNewsMetaTags = (article) => {
  if (!article) return {};

  const title = article.title || 'Latest News - MRVL';
  const description = article.excerpt || article.content?.substring(0, 160) || 'Stay updated with the latest Marvel Rivals news and updates.';
  const imageUrl = getNewsFeaturedImageUrl(article) || '/images/news-placeholder.svg';
  const url = `${window.location.origin}/news/${article.id}`;
  const publishedTime = article.published_at || article.created_at;
  const modifiedTime = article.updated_at;

  return {
    // Basic Meta Tags
    title: `${title} | MRVL`,
    description,
    keywords: [
      'Marvel Rivals',
      'MRVL',
      'esports',
      'gaming news',
      'competitive gaming',
      ...(article.tags || [])
    ].join(', '),

    // Open Graph Tags for Facebook/LinkedIn
    'og:title': title,
    'og:description': description,
    'og:image': imageUrl,
    'og:url': url,
    'og:type': 'article',
    'og:site_name': 'MRVL - Marvel Rivals Platform',
    'og:locale': 'en_US',

    // Article-specific Open Graph Tags
    'article:published_time': publishedTime,
    'article:modified_time': modifiedTime,
    'article:author': article.author?.name || 'MRVL Team',
    'article:section': article.category?.name || 'News',
    'article:tag': (article.tags || []).join(','),

    // Twitter Card Tags
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': imageUrl,
    'twitter:site': '@MRVLPlatform', // Update with actual Twitter handle
    'twitter:creator': article.author?.twitter || '@MRVLPlatform',

    // Additional SEO Tags
    'news_keywords': (article.tags || []).join(','),
    'robots': 'index,follow',
    'canonical': url
  };
};

/**
 * Generate structured data for news articles (JSON-LD)
 */
export const generateNewsStructuredData = (article) => {
  if (!article) return null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || article.content?.substring(0, 300),
    image: getNewsFeaturedImageUrl(article),
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.published_at || article.created_at,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'MRVL Team',
      url: article.author?.profile_url || `${window.location.origin}/author/${article.author?.id || 'mrvl-team'}`
    },
    publisher: {
      '@type': 'Organization',
      name: 'MRVL',
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/logo.svg`,
        width: 240,
        height: 240
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${window.location.origin}/news/${article.id}`
    },
    articleSection: article.category?.name || 'News',
    keywords: (article.tags || []).join(','),
    wordCount: article.content?.split(' ').length || 0,
    url: `${window.location.origin}/news/${article.id}`
  };

  // Add video if present
  if (article.videos && article.videos.length > 0) {
    structuredData.video = article.videos.map(video => ({
      '@type': 'VideoObject',
      name: video.title || article.title,
      description: video.description || article.excerpt,
      thumbnailUrl: video.thumbnail || getNewsFeaturedImageUrl(article),
      uploadDate: video.created_at || article.created_at,
      contentUrl: video.url
    }));
  }

  return structuredData;
};

/**
 * Update document meta tags dynamically
 */
export const updateMetaTags = (metaTags) => {
  Object.entries(metaTags).forEach(([key, value]) => {
    if (!value) return;

    let selector;
    let attribute;

    // Handle different types of meta tags
    if (key === 'title') {
      // Keep title constant - don't change it
      // document.title = value;
      return;
    } else if (key.startsWith('og:')) {
      selector = `meta[property="${key}"]`;
      attribute = 'content';
    } else if (key.startsWith('twitter:')) {
      selector = `meta[name="${key}"]`;
      attribute = 'content';
    } else if (key.startsWith('article:')) {
      selector = `meta[property="${key}"]`;
      attribute = 'content';
    } else if (key === 'canonical') {
      // Handle canonical URL
      let linkElement = document.querySelector('link[rel="canonical"]');
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.rel = 'canonical';
        document.head.appendChild(linkElement);
      }
      linkElement.href = value;
      return;
    } else {
      // Standard meta tags
      selector = `meta[name="${key}"]`;
      attribute = 'content';
    }

    let metaElement = document.querySelector(selector);
    if (!metaElement) {
      metaElement = document.createElement('meta');
      if (key.startsWith('og:') || key.startsWith('article:')) {
        metaElement.setAttribute('property', key);
      } else {
        metaElement.setAttribute('name', key);
      }
      document.head.appendChild(metaElement);
    }
    metaElement.setAttribute(attribute, value);
  });
};

/**
 * Add structured data to document
 */
export const addStructuredData = (structuredData) => {
  if (!structuredData) return;

  // Remove existing structured data for news articles
  const existingScript = document.querySelector('script[type="application/ld+json"][data-schema="NewsArticle"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-schema', 'NewsArticle');
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
};

/**
 * Generate social sharing URLs
 */
export const generateSocialSharingUrls = (article) => {
  if (!article) return {};

  const url = encodeURIComponent(`${window.location.origin}/news/${article.id}`);
  const title = encodeURIComponent(article.title || 'Check out this news on MRVL');
  const description = encodeURIComponent(article.excerpt || 'Latest Marvel Rivals news');

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}&via=MRVLPlatform`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    reddit: `https://reddit.com/submit?url=${url}&title=${title}`,
    discord: `https://discord.com/channels/@me`, // Note: Discord doesn't have direct sharing URL
    whatsapp: `https://api.whatsapp.com/send?text=${title} ${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${title}`,
    email: `mailto:?subject=${title}&body=${description}%0A%0A${url}`
  };
};

/**
 * Track social sharing events for analytics
 */
export const trackSocialShare = (platform, article) => {
  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'share', {
      method: platform,
      content_type: 'news_article',
      item_id: article.id,
      content_id: article.id,
      custom_parameters: {
        article_title: article.title,
        article_category: article.category?.name || 'News',
        author: article.author?.name || 'MRVL Team'
      }
    });
  }

  // Custom analytics
  if (window.analytics && typeof window.analytics.track === 'function') {
    window.analytics.track('News Article Shared', {
      platform,
      articleId: article.id,
      articleTitle: article.title,
      category: article.category?.name || 'News',
      author: article.author?.name || 'MRVL Team',
      url: `${window.location.origin}/news/${article.id}`
    });
  }

  console.log(`📤 News article shared on ${platform}:`, article.title);
};

/**
 * Generate URL-friendly slugs from titles
 */
export const generateSlug = (title) => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
};

/**
 * Optimize news URLs for SEO
 */
export const generateSEOFriendlyURL = (article) => {
  if (!article) return '/news';

  const slug = generateSlug(article.title);
  const date = new Date(article.published_at || article.created_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Format: /news/2024/01/15/article-title-slug
  return `/news/${year}/${month}/${day}/${slug}`;
};

/**
 * Check and optimize page loading performance
 */
export const optimizePagePerformance = () => {
  // Lazy load images that are not in viewport
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));

  // Preload critical resources
  const criticalImages = document.querySelectorAll('img[data-critical]');
  criticalImages.forEach(img => {
    if (img.dataset.src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.dataset.src;
      document.head.appendChild(link);
    }
  });
};

/**
 * Generate reading time estimate
 */
export const calculateReadingTime = (content) => {
  if (!content) return 0;
  
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  return readingTime;
};

/**
 * Generate news article preview for link sharing
 */
export const generateLinkPreview = (article) => {
  if (!article) return null;

  return {
    title: article.title,
    description: article.excerpt || article.content?.substring(0, 200),
    image: getNewsFeaturedImageUrl(article),
    url: `${window.location.origin}/news/${article.id}`,
    siteName: 'MRVL - Marvel Rivals Platform',
    author: article.author?.name || 'MRVL Team',
    publishedTime: article.published_at || article.created_at,
    readingTime: calculateReadingTime(article.content)
  };
};

export default {
  generateNewsMetaTags,
  generateNewsStructuredData,
  updateMetaTags,
  addStructuredData,
  generateSocialSharingUrls,
  trackSocialShare,
  generateSlug,
  generateSEOFriendlyURL,
  optimizePagePerformance,
  calculateReadingTime,
  generateLinkPreview
};