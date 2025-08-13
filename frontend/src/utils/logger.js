// Production-safe logging utility

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEBUG = process.env.REACT_APP_DEBUG === 'true';

// Create safe logging functions that don't execute in production
export const logger = {
  log: (...args) => {
    if (!IS_PRODUCTION || IS_DEBUG) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (!IS_PRODUCTION || IS_DEBUG) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  info: (...args) => {
    if (!IS_PRODUCTION || IS_DEBUG) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (IS_DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  performance: (label, fn) => {
    if (!IS_PRODUCTION || IS_DEBUG) {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return fn();
  },
  
  trace: (...args) => {
    if (!IS_PRODUCTION) {
      console.trace(...args);
    }
  }
};

// Performance monitoring for mobile
export const perfLogger = {
  mark: (name) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  },
  
  measure: (name, start, end) => {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, start, end);
        const measure = performance.getEntriesByName(name)[0];
        if (measure && (!IS_PRODUCTION || IS_DEBUG)) {
          logger.log(`[PERF] ${name}: ${measure.duration.toFixed(2)}ms`);
        }
        return measure;
      } catch (e) {
        logger.error('Performance measurement failed:', e);
      }
    }
  },
  
  logPageLoad: () => {
    if ('performance' in window && 'navigation' in performance) {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          logger.performance('Page Load Metrics', () => {
            logger.log('DNS Lookup:', navigation.domainLookupEnd - navigation.domainLookupStart);
            logger.log('TCP Connection:', navigation.connectEnd - navigation.connectStart);
            logger.log('Request/Response:', navigation.responseEnd - navigation.requestStart);
            logger.log('DOM Processing:', navigation.domContentLoadedEventEnd - navigation.responseEnd);
            logger.log('Total Load Time:', navigation.loadEventEnd - navigation.navigationStart);
          });
        }
      }, 0);
    }
  }
};

// Mobile-specific performance logging
export const mobileLogger = {
  logInteractionDelay: (eventType, target, startTime) => {
    const endTime = performance.now();
    const delay = endTime - startTime;
    
    if (delay > 100) { // Log if interaction takes more than 100ms
      logger.warn(`[MOBILE] Slow ${eventType} on ${target}: ${delay.toFixed(2)}ms`);
    }
  },
  
  logScrollPerformance: (scrollHandler) => {
    let lastScrollTime = 0;
    
    return (...args) => {
      const now = performance.now();
      const timeSinceLastScroll = now - lastScrollTime;
      
      if (timeSinceLastScroll < 16) { // Less than 60fps
        logger.warn('[MOBILE] Scroll performance issue detected');
      }
      
      lastScrollTime = now;
      return scrollHandler(...args);
    };
  },
  
  logMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = performance.memory;
      logger.debug('[MOBILE] Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
      });
    }
  }
};

export default logger;