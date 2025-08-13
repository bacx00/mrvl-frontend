/**
 * Analytics and Tracking Utilities for News Distribution
 * Production-ready analytics tracking for news engagement
 */

/**
 * Track news article views with detailed metrics
 */
export const trackNewsView = (article, viewSource = 'organic') => {
  if (!article) return;

  const eventData = {
    event_category: 'News',
    event_label: article.title,
    article_id: article.id,
    article_title: article.title,
    article_category: article.category?.name || 'Uncategorized',
    author: article.author?.name || 'MRVL Team',
    view_source: viewSource, // organic, social, direct, search, etc.
    reading_time_estimate: calculateReadingTime(article.content),
    article_age_days: calculateArticleAge(article.published_at || article.created_at),
    user_agent: navigator.userAgent,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timestamp: new Date().toISOString()
  };

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      item_category: 'news_article',
      item_id: article.id,
      item_name: article.title,
      content_type: 'news',
      custom_parameters: eventData
    });

    // Also track as page view
    window.gtag('event', 'page_view', {
      page_title: `${article.title} | MRVL`,
      page_location: window.location.href,
      content_group1: 'News',
      content_group2: article.category?.name || 'Uncategorized',
      custom_parameters: {
        article_id: article.id,
        author: article.author?.name || 'MRVL Team'
      }
    });
  }

  // Custom analytics
  if (window.analytics && typeof window.analytics.track === 'function') {
    window.analytics.track('News Article Viewed', eventData);
  }

  // Send to backend for internal analytics
  sendToBackendAnalytics('news_view', eventData);
};

/**
 * Track news engagement events (likes, comments, shares, etc.)
 */
export const trackNewsEngagement = (article, engagementType, additionalData = {}) => {
  if (!article) return;

  const eventData = {
    event_category: 'News Engagement',
    event_label: `${engagementType} - ${article.title}`,
    article_id: article.id,
    article_title: article.title,
    article_category: article.category?.name || 'Uncategorized',
    engagement_type: engagementType, // like, unlike, comment, share, bookmark
    author: article.author?.name || 'MRVL Team',
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', engagementType, {
      content_type: 'news_article',
      item_id: article.id,
      custom_parameters: eventData
    });
  }

  // Custom analytics
  if (window.analytics && typeof window.analytics.track === 'function') {
    window.analytics.track('News Engagement', eventData);
  }

  // Send to backend
  sendToBackendAnalytics('news_engagement', eventData);
};

/**
 * Track reading behavior and scroll depth
 */
export const trackReadingBehavior = (article, scrollPercentage, timeOnPage) => {
  if (!article) return;

  const eventData = {
    article_id: article.id,
    article_title: article.title,
    scroll_percentage: Math.round(scrollPercentage),
    time_on_page_seconds: Math.round(timeOnPage / 1000),
    estimated_reading_progress: calculateReadingProgress(scrollPercentage, timeOnPage, article.content),
    device_type: getDeviceType(),
    timestamp: new Date().toISOString()
  };

  // Only track significant scroll milestones
  const milestones = [25, 50, 75, 90, 100];
  if (milestones.includes(Math.round(scrollPercentage))) {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', 'scroll', {
        content_type: 'news_article',
        item_id: article.id,
        scroll_percentage: Math.round(scrollPercentage),
        custom_parameters: eventData
      });
    }

    // Custom analytics
    if (window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track('Reading Progress', eventData);
    }
  }

  // Send continuous reading data to backend (throttled)
  if (Math.round(scrollPercentage) % 10 === 0) { // Every 10%
    sendToBackendAnalytics('reading_behavior', eventData);
  }
};

/**
 * Track news search and filtering behavior
 */
export const trackNewsSearch = (searchQuery, filters, resultCount) => {
  const eventData = {
    event_category: 'News Search',
    search_term: searchQuery,
    filters_applied: filters,
    result_count: resultCount,
    timestamp: new Date().toISOString()
  };

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchQuery,
      content_type: 'news',
      custom_parameters: eventData
    });
  }

  // Custom analytics
  if (window.analytics && typeof window.analytics.track === 'function') {
    window.analytics.track('News Search', eventData);
  }

  sendToBackendAnalytics('news_search', eventData);
};

/**
 * Track trending articles and popularity metrics
 */
export const trackTrendingNews = (articles, timeframe = '24h') => {
  const eventData = {
    trending_articles: articles.map(article => ({
      id: article.id,
      title: article.title,
      category: article.category?.name,
      views: article.view_count || 0,
      engagement_score: calculateEngagementScore(article)
    })),
    timeframe,
    total_trending_articles: articles.length,
    timestamp: new Date().toISOString()
  };

  // Send to backend for trending analysis
  sendToBackendAnalytics('trending_news', eventData);
};

/**
 * Track performance metrics (Core Web Vitals, etc.)
 */
export const trackPerformanceMetrics = (pageName = 'news') => {
  if (!window.performance) return;

  // Wait for page to fully load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const performanceData = {
        page_name: pageName,
        dom_content_loaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        load_time: navigation?.loadEventEnd - navigation?.loadEventStart,
        first_contentful_paint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
        largest_contentful_paint: null, // Will be updated by observer
        cumulative_layout_shift: null, // Will be updated by observer
        first_input_delay: null, // Will be updated by observer
        connection_type: navigator.connection?.effectiveType || 'unknown',
        device_memory: navigator.deviceMemory || 'unknown',
        timestamp: new Date().toISOString()
      };

      // Core Web Vitals observer
      if ('PerformanceObserver' in window) {
        // LCP Observer
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          performanceData.largest_contentful_paint = lastEntry.startTime;
          sendPerformanceData(performanceData);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // CLS Observer
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          performanceData.cumulative_layout_shift = clsValue;
          sendPerformanceData(performanceData);
        }).observe({ entryTypes: ['layout-shift'] });

        // FID Observer
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            performanceData.first_input_delay = entry.processingStart - entry.startTime;
            sendPerformanceData(performanceData);
          }
        }).observe({ entryTypes: ['first-input'] });
      }

      // Send initial performance data
      sendPerformanceData(performanceData);
    }, 0);
  });
};

/**
 * Helper Functions
 */

const calculateReadingTime = (content) => {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

const calculateArticleAge = (publishedDate) => {
  if (!publishedDate) return 0;
  const now = new Date();
  const published = new Date(publishedDate);
  const diffTime = Math.abs(now - published);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
};

const calculateReadingProgress = (scrollPercentage, timeOnPage, content) => {
  if (!content) return 0;
  
  const estimatedReadingTime = calculateReadingTime(content) * 60 * 1000; // ms
  const timeProgress = Math.min((timeOnPage / estimatedReadingTime) * 100, 100);
  const scrollProgress = scrollPercentage;
  
  // Weighted average: 60% scroll, 40% time
  return Math.round((scrollProgress * 0.6) + (timeProgress * 0.4));
};

const calculateEngagementScore = (article) => {
  const views = article.view_count || 0;
  const likes = article.upvotes || 0;
  const comments = article.comments_count || 0;
  const shares = article.share_count || 0;
  
  // Weighted engagement score
  return (views * 1) + (likes * 5) + (comments * 10) + (shares * 15);
};

const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const sendToBackendAnalytics = async (eventType, data) => {
  // Disabled to improve performance - analytics endpoint not implemented
  return;
  
  // Original code commented out
  /*
  try {
    // Only send to backend if we have an API endpoint
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
    
    await fetch(`${backendUrl}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        event_type: eventType,
        event_data: data,
        page_url: window.location.href,
        user_id: getUserId(),
        session_id: getSessionId(),
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.debug('Analytics backend not available:', error.message);
  }
  */
};

const sendPerformanceData = (data) => {
  // Google Analytics 4 - Core Web Vitals
  if (window.gtag) {
    if (data.largest_contentful_paint) {
      window.gtag('event', 'web_vital', {
        name: 'LCP',
        value: Math.round(data.largest_contentful_paint),
        event_category: 'Performance'
      });
    }
    
    if (data.cumulative_layout_shift !== null) {
      window.gtag('event', 'web_vital', {
        name: 'CLS',
        value: Math.round(data.cumulative_layout_shift * 1000),
        event_category: 'Performance'
      });
    }
    
    if (data.first_input_delay !== null) {
      window.gtag('event', 'web_vital', {
        name: 'FID',
        value: Math.round(data.first_input_delay),
        event_category: 'Performance'
      });
    }
  }
  
  sendToBackendAnalytics('performance_metrics', data);
};

const getUserId = () => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.sub || 'anonymous';
    }
  } catch (e) {
    // Token parsing failed
  }
  return 'anonymous';
};

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('mrvl_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('mrvl_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Initialize analytics tracking for news pages
 */
export const initializeNewsAnalytics = () => {
  // Track performance metrics
  trackPerformanceMetrics('news');
  
  // Set up scroll tracking
  let scrollTimeout;
  let maxScroll = 0;
  let startTime = Date.now();
  
  const handleScroll = () => {
    clearTimeout(scrollTimeout);
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const scrollPercentage = Math.min((scrollTop + windowHeight) / documentHeight * 100, 100);
    maxScroll = Math.max(maxScroll, scrollPercentage);
    
    scrollTimeout = setTimeout(() => {
      const currentArticle = getCurrentArticle();
      if (currentArticle) {
        trackReadingBehavior(currentArticle, maxScroll, Date.now() - startTime);
      }
    }, 100);
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const currentArticle = getCurrentArticle();
      if (currentArticle) {
        trackReadingBehavior(currentArticle, maxScroll, Date.now() - startTime);
      }
    } else {
      startTime = Date.now();
    }
  });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};

const getCurrentArticle = () => {
  // Try to get current article from various sources
  if (window.__CURRENT_ARTICLE__) {
    return window.__CURRENT_ARTICLE__;
  }
  
  // Extract from URL
  const pathMatch = window.location.pathname.match(/\/news\/(\d+)/);
  if (pathMatch) {
    return { id: pathMatch[1] };
  }
  
  return null;
};

export default {
  trackNewsView,
  trackNewsEngagement,
  trackReadingBehavior,
  trackNewsSearch,
  trackTrendingNews,
  trackPerformanceMetrics,
  initializeNewsAnalytics
};