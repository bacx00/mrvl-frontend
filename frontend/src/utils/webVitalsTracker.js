/**
 * Core Web Vitals Tracking and Optimization
 * Tournament platform optimized for mobile performance metrics
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

class WebVitalsTracker {
  constructor() {
    this.metrics = {};
    this.thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 600, poor: 1500 }
    };
    
    this.initializeTracking();
  }

  initializeTracking() {
    // Track Largest Contentful Paint (LCP)
    getLCP((metric) => {
      this.handleMetric('LCP', metric);
      this.optimizeLCP(metric);
    });

    // Track First Input Delay (FID)
    getFID((metric) => {
      this.handleMetric('FID', metric);
      this.optimizeFID(metric);
    });

    // Track Cumulative Layout Shift (CLS)
    getCLS((metric) => {
      this.handleMetric('CLS', metric);
      this.optimizeCLS(metric);
    });

    // Track First Contentful Paint (FCP)
    getFCP((metric) => {
      this.handleMetric('FCP', metric);
      this.optimizeFCP(metric);
    });

    // Track Time to First Byte (TTFB)
    getTTFB((metric) => {
      this.handleMetric('TTFB', metric);
    });
  }

  handleMetric(name, metric) {
    this.metrics[name] = metric;
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        event_label: name,
        value: Math.round(name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_map: { 'metric_rating': this.getMetricRating(name, metric.value) }
      });
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${name}: ${metric.value} (${this.getMetricRating(name, metric.value)})`);
    }

    // Trigger optimizations based on poor metrics
    if (this.getMetricRating(name, metric.value) === 'poor') {
      this.triggerPerformanceOptimizations(name, metric);
    }
  }

  getMetricRating(name, value) {
    const threshold = this.thresholds[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // LCP Optimization Strategies
  optimizeLCP(metric) {
    if (metric.value > this.thresholds.LCP.poor) {
      // Preload critical resources
      this.preloadCriticalResources();
      
      // Optimize images
      this.optimizeLCPImage(metric.element);
      
      // Remove unused CSS
      this.deferNonCriticalCSS();
    }
  }

  preloadCriticalResources() {
    const criticalResources = [
      '/static/js/critical.js',
      '/static/css/critical.css',
      '/api/matches?filter=live',
      'https://fonts.bunny.net/css?family=inter:400,500,600,700'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.includes('/api/')) {
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      } else {
        link.as = 'style';
      }
      
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  optimizeLCPImage(element) {
    if (element && element.tagName === 'IMG') {
      // Add loading priority
      element.loading = 'eager';
      element.fetchPriority = 'high';
      
      // Optimize image format
      if (this.supportsWebP() && !element.src.includes('.webp')) {
        const webpSrc = element.src.replace(/\.(jpg|jpeg|png)$/, '.webp');
        const img = new Image();
        img.onload = () => {
          element.src = webpSrc;
        };
        img.src = webpSrc;
      }
    }
  }

  deferNonCriticalCSS() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
    stylesheets.forEach(link => {
      if (!link.href.includes('critical')) {
        link.rel = 'preload';
        link.as = 'style';
        link.onload = function() {
          this.rel = 'stylesheet';
        };
      }
    });
  }

  // FID Optimization Strategies
  optimizeFID(metric) {
    if (metric.value > this.thresholds.FID.poor) {
      // Break up long tasks
      this.breakUpLongTasks();
      
      // Use scheduler.postTask for better scheduling
      this.optimizeTaskScheduling();
      
      // Defer non-critical JavaScript
      this.deferNonCriticalJS();
    }
  }

  breakUpLongTasks() {
    // Utility to break up long-running tasks
    window.yieldToMain = function() {
      return new Promise(resolve => {
        if ('scheduler' in window && 'postTask' in scheduler) {
          scheduler.postTask(resolve, { priority: 'user-blocking' });
        } else {
          setTimeout(resolve, 0);
        }
      });
    };
  }

  optimizeTaskScheduling() {
    if ('scheduler' in window && 'postTask' in scheduler) {
      // Schedule tournament data updates with appropriate priority
      window.scheduleTask = (task, priority = 'user-visible') => {
        return scheduler.postTask(task, { priority });
      };
    }
  }

  deferNonCriticalJS() {
    const scripts = document.querySelectorAll('script[src]:not([data-critical])');
    scripts.forEach(script => {
      if (!script.src.includes('critical') && !script.src.includes('vendor')) {
        script.defer = true;
      }
    });
  }

  // CLS Optimization Strategies
  optimizeCLS(metric) {
    if (metric.value > this.thresholds.CLS.poor) {
      this.stabilizeTournamentLayouts();
      this.preloadWebFonts();
      this.addImageDimensions();
    }
  }

  stabilizeTournamentLayouts() {
    // Add skeleton loaders for dynamic content
    const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');
    dynamicContainers.forEach(container => {
      if (!container.querySelector('.skeleton-loader')) {
        container.style.minHeight = container.offsetHeight + 'px';
      }
    });

    // Reserve space for tournament brackets
    const bracketContainers = document.querySelectorAll('.tournament-bracket');
    bracketContainers.forEach(container => {
      container.style.aspectRatio = '16/9';
    });
  }

  preloadWebFonts() {
    const fontPreloads = [
      'https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap'
    ];

    fontPreloads.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = font;
      document.head.appendChild(link);
    });
  }

  addImageDimensions() {
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      // Set aspect ratio to prevent layout shift
      img.style.aspectRatio = '16/9';
      img.style.objectFit = 'cover';
    });
  }

  // FCP Optimization
  optimizeFCP(metric) {
    if (metric.value > this.thresholds.FCP.poor) {
      this.inlineCriticalCSS();
      this.optimizeCriticalPath();
    }
  }

  inlineCriticalCSS() {
    // This should be done at build time, but we can optimize runtime
    const criticalCSS = `
      body { font-family: system-ui, sans-serif; background: #0f0f23; color: white; }
      .tournament-header { height: 60px; background: #1a1a2e; }
      .loading-skeleton { animation: pulse 2s infinite; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); }
    `;
    
    const style = document.createElement('style');
    style.innerHTML = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  optimizeCriticalPath() {
    // Priority hints for critical resources
    const criticalResources = document.querySelectorAll('link[href*="critical"], script[src*="critical"]');
    criticalResources.forEach(resource => {
      if (resource.tagName === 'LINK') {
        resource.fetchPriority = 'high';
      } else if (resource.tagName === 'SCRIPT') {
        resource.fetchPriority = 'high';
      }
    });
  }

  triggerPerformanceOptimizations(metricName, metric) {
    // Send performance alert to monitoring
    console.warn(`[Performance Alert] ${metricName} is performing poorly: ${metric.value}`);
    
    // Trigger specific optimizations based on the metric
    switch (metricName) {
      case 'LCP':
        this.enableAggressiveCaching();
        break;
      case 'FID':
        this.reduceJavaScriptExecution();
        break;
      case 'CLS':
        this.stabilizeAllLayouts();
        break;
    }
  }

  enableAggressiveCaching() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'ENABLE_AGGRESSIVE_CACHING'
      });
    }
  }

  reduceJavaScriptExecution() {
    // Disable non-essential features temporarily
    window.mrvlPerformanceMode = true;
    
    // Reduce animation complexity
    document.body.classList.add('reduced-motion');
  }

  stabilizeAllLayouts() {
    // Add layout stability classes
    document.body.classList.add('layout-stable');
    
    // Fix heights of dynamic elements
    const dynamicElements = document.querySelectorAll('[data-dynamic]');
    dynamicElements.forEach(el => {
      el.style.minHeight = Math.max(el.offsetHeight, 100) + 'px';
    });
  }

  // Utility methods
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  }

  getMetricsReport() {
    return {
      metrics: this.metrics,
      scores: Object.keys(this.metrics).reduce((acc, key) => {
        acc[key] = this.getMetricRating(key, this.metrics[key].value);
        return acc;
      }, {}),
      timestamp: Date.now()
    };
  }
}

// Initialize tracking
const vitalsTracker = new WebVitalsTracker();

export default vitalsTracker;