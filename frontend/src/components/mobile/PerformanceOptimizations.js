import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';

// Lazy Loading Image Component with blur-to-sharp transition
export const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder, 
  blurhash,
  sizes,
  onLoad,
  priority = false 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px'
  });

  useEffect(() => {
    if (priority) {
      // High priority images load immediately
      loadImage();
    } else if (inView) {
      // Load when in viewport
      loadImage();
    }
  }, [inView, priority, src]);

  const loadImage = useCallback(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      setImageLoaded(true);
    };
    
    img.src = src;
    if (sizes) img.sizes = sizes;
  }, [src, sizes, onLoad]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${
          imageLoaded ? 'opacity-100 filter-none' : 'opacity-60 filter blur-sm'
        }`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Virtual Scrolling for Large Lists
export const VirtualList = ({ 
  items, 
  itemHeight = 80, 
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const visibleItems = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );

    return {
      start: Math.max(0, visibleStart - overscan),
      end: visibleEnd,
      items: items.slice(
        Math.max(0, visibleStart - overscan),
        visibleEnd
      )
    };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleItems.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.items.map((item, index) =>
            renderItem(item, visibleItems.start + index)
          )}
        </div>
      </div>
    </div>
  );
};

// Lazy Component Loading with Suspense
export const LazyComponent = ({ 
  loader, 
  fallback = <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-32" />,
  errorFallback = <div className="text-red-500 p-4">Failed to load component</div>
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (inView && !Component && !loading && !error) {
      setLoading(true);
      loader()
        .then(module => {
          setComponent(() => module.default || module);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
          console.error('Failed to load lazy component:', err);
        });
    }
  }, [inView, Component, loading, error, loader]);

  return (
    <div ref={ref}>
      {error ? errorFallback : (
        loading || !Component ? fallback : <Component />
      )}
    </div>
  );
};

// Resource Preloader Hook
export const usePreloader = () => {
  const preloadedResources = useRef(new Set());

  const preloadImage = useCallback((src) => {
    if (preloadedResources.current.has(src)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (srcs) => {
    const promises = srcs.map(src => preloadImage(src));
    return Promise.allSettled(promises);
  }, [preloadImage]);

  const preloadRoute = useCallback(async (routePath) => {
    try {
      // Dynamic import for route preloading
      await import(`../pages${routePath}`);
      console.log(`Preloaded route: ${routePath}`);
    } catch (error) {
      console.warn(`Failed to preload route ${routePath}:`, error);
    }
  }, []);

  return {
    preloadImage,
    preloadImages,
    preloadRoute,
    isPreloaded: (src) => preloadedResources.current.has(src)
  };
};

// Connection-aware loading
export const useConnectionAwareLoading = () => {
  const [connection, setConnection] = useState({
    effectiveType: '4g',
    downlink: 10,
    saveData: false
  });

  useEffect(() => {
    if ('connection' in navigator) {
      const updateConnection = () => {
        setConnection({
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          saveData: navigator.connection.saveData
        });
      };

      updateConnection();
      navigator.connection.addEventListener('change', updateConnection);

      return () => {
        navigator.connection.removeEventListener('change', updateConnection);
      };
    }
  }, []);

  const shouldLoadHighQuality = useMemo(() => {
    if (connection.saveData) return false;
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') return false;
    return connection.downlink > 1.5;
  }, [connection]);

  const shouldPreload = useMemo(() => {
    return !connection.saveData && connection.effectiveType === '4g' && connection.downlink > 5;
  }, [connection]);

  return {
    connection,
    shouldLoadHighQuality,
    shouldPreload,
    isFastConnection: connection.effectiveType === '4g' && connection.downlink > 2
  };
};

// Critical CSS Injection
export const injectCriticalCSS = () => {
  const criticalCSS = `
    /* Above-the-fold critical styles */
    .mobile-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; }
    .mobile-header { position: fixed; top: 0; left: 0; right: 0; z-index: 50; }
    .touch-optimized { min-height: 44px; min-width: 44px; }
    .loading-skeleton { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = criticalCSS;
  document.head.appendChild(styleElement);
};

// Performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null
  });

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    // First Contentful Paint & Largest Contentful Paint
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
      });
    });
    paintObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let cls = 0;
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      setMetrics(prev => ({ ...prev, cls }));
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Time to First Byte
    const navigationObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        setMetrics(prev => ({ ...prev, ttfb: entry.responseStart - entry.fetchStart }));
      });
    });
    navigationObserver.observe({ entryTypes: ['navigation'] });

    return () => {
      paintObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      navigationObserver.disconnect();
    };
  }, []);

  const logMetrics = useCallback(() => {
    console.table(metrics);
    
    // Send to analytics if available
    if (window.gtag) {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== null) {
          window.gtag('event', 'performance_metric', {
            event_category: 'Performance',
            event_label: key.toUpperCase(),
            value: Math.round(value)
          });
        }
      });
    }
  }, [metrics]);

  return { metrics, logMetrics };
};

// Bundle splitting utility
export const loadChunk = async (chunkName) => {
  try {
    const module = await import(
      /* webpackChunkName: "[request]" */
      `../pages/${chunkName}`
    );
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load chunk: ${chunkName}`, error);
    throw error;
  }
};

// Memory optimization utilities
export const useMemoryOptimization = () => {
  const cleanupFunctions = useRef([]);

  const addCleanup = useCallback((cleanup) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const runCleanup = useCallback(() => {
    cleanupFunctions.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    cleanupFunctions.current = [];
  }, []);

  useEffect(() => {
    return runCleanup;
  }, [runCleanup]);

  const optimizeImages = useCallback(() => {
    // Remove unused images from cache
    const images = document.querySelectorAll('img[data-optimized]');
    images.forEach(img => {
      if (!img.closest('.in-viewport')) {
        img.src = img.dataset.placeholder || '';
      }
    });
  }, []);

  const clearUnusedCache = useCallback(() => {
    // Clear unused cache entries
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('old-') || name.includes('temp-')) {
            caches.delete(name);
          }
        });
      });
    }
  }, []);

  return {
    addCleanup,
    runCleanup,
    optimizeImages,
    clearUnusedCache
  };
};

export default {
  LazyImage,
  VirtualList,
  LazyComponent,
  usePreloader,
  useConnectionAwareLoading,
  injectCriticalCSS,
  usePerformanceMonitor,
  loadChunk,
  useMemoryOptimization
};