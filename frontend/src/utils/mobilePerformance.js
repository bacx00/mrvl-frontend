// Mobile Performance Optimization Utilities
// Comprehensive set of utilities for optimizing Marvel Rivals platform on mobile devices

// 1. Connection Quality Detection
export const getConnectionQuality = () => {
  if (!navigator.connection) {
    return 'unknown';
  }

  const connection = navigator.connection;
  const effectiveType = connection.effectiveType;
  const downlink = connection.downlink;

  // Classify connection quality
  if (effectiveType === '4g' && downlink > 10) {
    return 'high';
  } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1.5)) {
    return 'medium';
  } else {
    return 'low';
  }
};

// 2. Adaptive Image Quality
export const getOptimalImageQuality = () => {
  const connectionQuality = getConnectionQuality();
  const isRetina = window.devicePixelRatio > 1.5;
  
  switch (connectionQuality) {
    case 'high':
      return isRetina ? 90 : 85;
    case 'medium':
      return isRetina ? 75 : 70;
    case 'low':
      return 60;
    default:
      return 75;
  }
};

// 3. Memory Usage Monitor
export const getMemoryInfo = () => {
  if (!performance.memory) {
    return null;
  }

  const memory = performance.memory;
  return {
    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
    limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // %
  };
};

// 4. Device Performance Classification
export const getDevicePerformance = () => {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = getMemoryInfo();
  const isLowEnd = cores <= 2 || (memory && memory.limit < 2048);
  
  if (isLowEnd) {
    return 'low';
  } else if (cores >= 6 && memory && memory.limit > 4096) {
    return 'high';
  } else {
    return 'medium';
  }
};

// 5. Adaptive Loading Strategies
export const getLoadingStrategy = () => {
  const connectionQuality = getConnectionQuality();
  const devicePerformance = getDevicePerformance();
  
  return {
    // How many items to load initially
    initialBatchSize: connectionQuality === 'low' ? 5 : devicePerformance === 'low' ? 8 : 12,
    
    // How many items to load per subsequent batch
    batchSize: connectionQuality === 'low' ? 3 : devicePerformance === 'low' ? 5 : 8,
    
    // Whether to preload next batch
    shouldPreload: connectionQuality === 'high' && devicePerformance !== 'low',
    
    // Image loading strategy
    imageStrategy: {
      quality: getOptimalImageQuality(),
      lazy: connectionQuality !== 'high',
      placeholder: connectionQuality === 'low'
    },
    
    // Animation preferences
    animations: devicePerformance === 'low' ? 'reduced' : 'full'
  };
};

// 6. Resource Prefetch Manager
export class ResourcePrefetcher {
  constructor() {
    this.prefetchedUrls = new Set();
    this.strategy = getLoadingStrategy();
  }

  prefetchImage(url, priority = 'low') {
    if (this.prefetchedUrls.has(url) || !this.strategy.shouldPreload) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'image';
    
    if (priority === 'high') {
      link.rel = 'preload';
    }

    document.head.appendChild(link);
    this.prefetchedUrls.add(url);

    // Clean up after 30 seconds
    setTimeout(() => {
      document.head.removeChild(link);
    }, 30000);
  }

  prefetchRoute(route) {
    if (!this.strategy.shouldPreload) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }
}

// 7. Viewport Optimization
export const getOptimalViewport = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let viewport = 'width=device-width, initial-scale=1';
  
  if (isIOS) {
    // Prevent zoom on iOS
    viewport += ', maximum-scale=1, user-scalable=no, viewport-fit=cover';
  } else if (isAndroid) {
    // Allow slight zoom on Android for accessibility
    viewport += ', maximum-scale=2, user-scalable=yes';
  }
  
  return viewport;
};

// 8. Touch Optimization
export const optimizeTouchEvents = () => {
  // Add passive event listeners for better scroll performance
  const addPassiveListener = (element, event, handler) => {
    element.addEventListener(event, handler, { passive: true });
  };

  // Debounced scroll handler
  const createScrollHandler = (callback, delay = 16) => {
    let ticking = false;
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback();
          ticking = false;
        });
        ticking = true;
      }
    };
  };

  return { addPassiveListener, createScrollHandler };
};

// 9. Battery Status Adaptation
export const getBatteryStatus = async () => {
  if (!navigator.getBattery) {
    return null;
  }

  try {
    const battery = await navigator.getBattery();
    return {
      level: Math.round(battery.level * 100),
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
      // Battery conservation mode
      conserveMode: battery.level < 0.2 && !battery.charging
    };
  } catch (error) {
    console.warn('Battery API not available:', error);
    return null;
  }
};

// 10. Performance Budget Monitor
export class PerformanceBudget {
  constructor() {
    this.budgets = {
      // Time to Interactive (ms)
      tti: 3000,
      // First Contentful Paint (ms)
      fcp: 1500,
      // Largest Contentful Paint (ms)
      lcp: 2500,
      // Cumulative Layout Shift
      cls: 0.1,
      // First Input Delay (ms)
      fid: 100
    };
    
    this.metrics = {};
    this.observer = null;
  }

  startMonitoring() {
    // Monitor Web Vitals
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.value);
        }
      });

      try {
        this.observer.observe({ entryTypes: ['navigation', 'paint', 'layout-shift', 'first-input'] });
      } catch (error) {
        console.warn('Performance observation not supported:', error);
      }
    }
  }

  recordMetric(name, value) {
    this.metrics[name] = value;
    
    // Check if we're exceeding budget
    const budget = this.budgets[name];
    if (budget && value > budget) {
      console.warn(`Performance budget exceeded for ${name}: ${value}ms (budget: ${budget}ms)`);
      
      // Emit custom event for monitoring
      window.dispatchEvent(new CustomEvent('performance-budget-exceeded', {
        detail: { metric: name, value, budget }
      }));
    }
  }

  getReport() {
    return {
      metrics: this.metrics,
      budgets: this.budgets,
      violations: Object.keys(this.metrics).filter(key => 
        this.budgets[key] && this.metrics[key] > this.budgets[key]
      )
    };
  }

  stopMonitoring() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// 11. Critical CSS Extractor
export const extractCriticalCSS = () => {
  const criticalRules = [];
  const viewportHeight = window.innerHeight;
  
  // Get all elements above the fold
  const aboveFoldElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.top < viewportHeight && rect.bottom > 0;
  });

  // Extract CSS rules for above-fold elements
  aboveFoldElements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    const tagName = el.tagName.toLowerCase();
    const classes = Array.from(el.classList);
    
    // Build selectors
    const selectors = [tagName];
    if (classes.length > 0) {
      selectors.push(...classes.map(cls => `.${cls}`));
    }
    
    // Add important CSS properties
    const importantProps = [
      'display', 'position', 'top', 'left', 'width', 'height',
      'margin', 'padding', 'background', 'color', 'font-size',
      'font-family', 'font-weight', 'line-height', 'text-align'
    ];
    
    importantProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'initial' && value !== 'normal') {
        criticalRules.push(`${selectors[0]} { ${prop}: ${value}; }`);
      }
    });
  });

  return criticalRules.join('\n');
};

// 12. Mobile Performance Recommendations
export const getPerformanceRecommendations = () => {
  const connectionQuality = getConnectionQuality();
  const devicePerformance = getDevicePerformance();
  const memoryInfo = getMemoryInfo();
  
  const recommendations = [];

  if (connectionQuality === 'low') {
    recommendations.push({
      type: 'network',
      priority: 'high',
      message: 'Slow connection detected. Reducing image quality and batch sizes.',
      action: 'Enable data saver mode'
    });
  }

  if (devicePerformance === 'low') {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'Low-end device detected. Reducing animations and visual effects.',
      action: 'Enable performance mode'
    });
  }

  if (memoryInfo && memoryInfo.usage > 80) {
    recommendations.push({
      type: 'memory',
      priority: 'critical',
      message: 'High memory usage detected. Consider clearing cache.',
      action: 'Optimize memory usage'
    });
  }

  return recommendations;
};

// 13. Service Worker Registration for Mobile
export const registerMobileServiceWorker = () => {
  if ('serviceWorker' in navigator && 'caches' in window) {
    const strategy = getLoadingStrategy();
    
    navigator.serviceWorker.register('/mobile-sw.js', {
      scope: '/',
      updateViaCache: 'none'
    }).then(registration => {
      console.log('Mobile service worker registered:', registration);
      
      // Send performance strategy to service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'UPDATE_STRATEGY',
          strategy
        });
      }
    }).catch(error => {
      console.error('Service worker registration failed:', error);
    });
  }
};

// Global performance optimization initialization
export const initializeMobileOptimizations = () => {
  // Start performance monitoring
  const performanceBudget = new PerformanceBudget();
  performanceBudget.startMonitoring();
  
  // Initialize resource prefetcher
  const prefetcher = new ResourcePrefetcher();
  
  // Optimize touch events
  const { addPassiveListener, createScrollHandler } = optimizeTouchEvents();
  
  // Register service worker
  registerMobileServiceWorker();
  
  // Apply performance recommendations
  const recommendations = getPerformanceRecommendations();
  console.log('Mobile Performance Recommendations:', recommendations);
  
  return {
    performanceBudget,
    prefetcher,
    addPassiveListener,
    createScrollHandler,
    recommendations
  };
};

// Export all utilities
export default {
  getConnectionQuality,
  getOptimalImageQuality,
  getMemoryInfo,
  getDevicePerformance,
  getLoadingStrategy,
  ResourcePrefetcher,
  getOptimalViewport,
  optimizeTouchEvents,
  getBatteryStatus,
  PerformanceBudget,
  extractCriticalCSS,
  getPerformanceRecommendations,
  registerMobileServiceWorker,
  initializeMobileOptimizations
};