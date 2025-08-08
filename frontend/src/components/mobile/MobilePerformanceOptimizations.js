import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Wifi, WifiOff, Battery, Zap, Eye, EyeOff } from 'lucide-react';

// Skeleton Screen Components for Loading States
export const SkeletonMatchCard = ({ compactMode = false }) => (
  <div className="mobile-card skeleton-loading animate-pulse">
    <div className="p-4 space-y-3">
      {/* Match header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-16 skeleton-loading rounded"></div>
        <div className="h-4 w-20 skeleton-loading rounded"></div>
      </div>
      
      {/* Team 1 skeleton */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 skeleton-loading rounded-full"></div>
        <div className="flex-1 space-y-1">
          <div className="h-4 w-24 skeleton-loading rounded"></div>
          {!compactMode && <div className="h-3 w-16 skeleton-loading rounded"></div>}
        </div>
        <div className="h-6 w-8 skeleton-loading rounded"></div>
      </div>
      
      {/* Team 2 skeleton */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 skeleton-loading rounded-full"></div>
        <div className="flex-1 space-y-1">
          <div className="h-4 w-20 skeleton-loading rounded"></div>
          {!compactMode && <div className="h-3 w-14 skeleton-loading rounded"></div>}
        </div>
        <div className="h-6 w-8 skeleton-loading rounded"></div>
      </div>
    </div>
  </div>
);

export const SkeletonBracketRound = () => (
  <div className="p-4 space-y-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <SkeletonMatchCard key={index} />
    ))}
  </div>
);

export const SkeletonGrid = ({ columns = 2, rows = 3 }) => (
  <div className={`grid grid-cols-${columns} gap-4 p-4`}>
    {Array.from({ length: columns * rows }).map((_, index) => (
      <SkeletonMatchCard key={index} compactMode={true} />
    ))}
  </div>
);

// Progressive Image Loading Component
export const ProgressiveImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholderColor = '#f3f4f6',
  blurDataURL,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(blurDataURL || null);
  const imgRef = useRef(null);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
  }, []);

  useEffect(() => {
    if (src) {
      // Preload the high-quality image
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setTimeout(() => setIsLoaded(true), 100);
      };
      img.onerror = handleError;
      img.src = src;
    }
  }, [src, handleError]);

  return (
    <div className={`mobile-image-progressive relative overflow-hidden ${className}`} {...props}>
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 skeleton-loading"
          style={{ backgroundColor: placeholderColor }}
        />
      )}
      
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`mobile-image-optimized transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <EyeOff className="w-6 h-6 text-gray-400" />
        </div>
      )}
    </div>
  );
};

// Virtual Scrolling Hook for Large Lists
export const useVirtualScrolling = (items, itemHeight = 100, containerHeight = 600) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const bufferCount = Math.min(5, Math.floor(visibleCount / 2));

  useEffect(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length,
      startIndex + visibleCount + bufferCount
    );

    setVisibleRange({
      start: Math.max(0, startIndex - bufferCount),
      end: endIndex
    });
  }, [scrollTop, itemHeight, items.length, visibleCount, bufferCount]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return {
    visibleItems,
    totalHeight,
    offsetY: visibleRange.start * itemHeight,
    onScroll: handleScroll,
    visibleRange
  };
};

// Network-Aware Loading Component
export const NetworkAwareLoader = ({ children, fallback = null }) => {
  const [connection, setConnection] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateConnection = () => {
      setConnection(navigator.connection || navigator.mozConnection || navigator.webkitConnection);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateConnection();
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Determine if we should show reduced content based on connection
  const shouldReduceContent = useMemo(() => {
    if (!isOnline) return true;
    
    if (connection) {
      // Slow connections: 2G, slow-2g
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        return true;
      }
      
      // Save data mode enabled
      if (connection.saveData) {
        return true;
      }
    }
    
    return false;
  }, [isOnline, connection]);

  if (!isOnline) {
    return (
      <div className="mobile-error flex items-center justify-center p-6 text-center">
        <div>
          <WifiOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Offline</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check your connection and try again
          </p>
        </div>
      </div>
    );
  }

  if (shouldReduceContent && fallback) {
    return (
      <div className="mobile-reduced-content">
        <div className="flex items-center justify-center p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
          <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
          <span className="text-xs text-yellow-800 dark:text-yellow-200">
            Reduced content for slow connection
          </span>
        </div>
        {fallback}
      </div>
    );
  }

  return children;
};

// Battery-Aware Performance Hook
export const useBatteryOptimization = () => {
  const [battery, setBattery] = useState(null);
  const [shouldOptimize, setShouldOptimize] = useState(false);

  useEffect(() => {
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const batteryInfo = await navigator.getBattery();
          setBattery(batteryInfo);

          const updateBatteryInfo = () => {
            setShouldOptimize(
              !batteryInfo.charging && batteryInfo.level < 0.2
            );
          };

          batteryInfo.addEventListener('chargingchange', updateBatteryInfo);
          batteryInfo.addEventListener('levelchange', updateBatteryInfo);
          updateBatteryInfo();

          return () => {
            batteryInfo.removeEventListener('chargingchange', updateBatteryInfo);
            batteryInfo.removeEventListener('levelchange', updateBatteryInfo);
          };
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    getBatteryInfo();
  }, []);

  return {
    battery,
    shouldOptimize,
    batteryLevel: battery?.level || 1,
    isCharging: battery?.charging || false
  };
};

// Intersection Observer Hook for Lazy Loading
export const useIntersectionObserver = (callback, options = {}) => {
  const [entries, setEntries] = useState([]);
  const [observer, setObserver] = useState(null);

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };

  useEffect(() => {
    const obs = new IntersectionObserver((observedEntries) => {
      setEntries(observedEntries);
      observedEntries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    }, defaultOptions);

    setObserver(obs);

    return () => obs.disconnect();
  }, [callback, defaultOptions]);

  const observe = useCallback((element) => {
    if (observer && element) {
      observer.observe(element);
    }
  }, [observer]);

  const unobserve = useCallback((element) => {
    if (observer && element) {
      observer.unobserve(element);
    }
  }, [observer]);

  return { entries, observe, unobserve };
};

// Lazy Loading Component
export const LazyLoadComponent = ({ 
  children, 
  fallback = <SkeletonMatchCard />, 
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef(null);

  const handleIntersect = useCallback((entry) => {
    if (entry.isIntersecting && !hasLoaded) {
      setIsVisible(true);
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  const { observe } = useIntersectionObserver(handleIntersect, {
    threshold,
    rootMargin
  });

  useEffect(() => {
    if (elementRef.current) {
      observe(elementRef.current);
    }
  }, [observe]);

  return (
    <div ref={elementRef} className="mobile-lazy-component">
      {isVisible ? children : fallback}
    </div>
  );
};

// Performance Monitor Component
export const PerformanceMonitor = ({ children }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    timing: null
  });
  const [showMetrics, setShowMetrics] = useState(false);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    if (!showMetrics) return;

    const updateMetrics = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime.current + 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memory: (performance.memory?.usedJSHeapSize / 1048576) || 0,
          timing: performance.timing ? {
            domComplete: performance.timing.domComplete - performance.timing.navigationStart,
            loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
          } : null
        }));
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      requestAnimationFrame(updateMetrics);
    };

    const animationId = requestAnimationFrame(updateMetrics);
    
    return () => cancelAnimationFrame(animationId);
  }, [showMetrics]);

  return (
    <>
      {children}
      
      {/* Performance Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-[9999]">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="bg-black/80 text-white p-2 rounded-lg text-xs"
          >
            <Zap className="w-4 h-4" />
          </button>
          
          {showMetrics && (
            <div className="mt-2 bg-black/90 text-white p-3 rounded-lg text-xs font-mono min-w-48">
              <div className="space-y-1">
                <div>FPS: {metrics.fps}</div>
                <div>Memory: {metrics.memory.toFixed(1)}MB</div>
                {metrics.timing && (
                  <>
                    <div>DOM: {metrics.timing.domComplete}ms</div>
                    <div>Load: {metrics.timing.loadComplete}ms</div>
                  </>
                )}
                <div className="flex items-center space-x-1">
                  <Wifi className="w-3 h-3" />
                  <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Critical Resource Preloader
export const useResourcePreloader = (resources = []) => {
  const [preloadedResources, setPreloadedResources] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const preloadResource = useCallback(async (resource) => {
    if (preloadedResources.has(resource)) return;

    try {
      if (resource.endsWith('.js')) {
        // Preload JavaScript
        const script = document.createElement('script');
        script.src = resource;
        script.async = true;
        document.head.appendChild(script);
      } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
        // Preload images
        const img = new Image();
        img.src = resource;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } else if (resource.endsWith('.css')) {
        // Preload CSS
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = resource;
        document.head.appendChild(link);
      }

      setPreloadedResources(prev => new Set([...prev, resource]));
    } catch (error) {
      console.warn('Failed to preload resource:', resource, error);
    }
  }, [preloadedResources]);

  useEffect(() => {
    if (resources.length === 0) return;

    setIsLoading(true);
    
    const preloadAll = async () => {
      await Promise.allSettled(
        resources.map(resource => preloadResource(resource))
      );
      setIsLoading(false);
    };

    preloadAll();
  }, [resources, preloadResource]);

  return { preloadedResources, isLoading };
};

export default {
  SkeletonMatchCard,
  SkeletonBracketRound,
  SkeletonGrid,
  ProgressiveImage,
  NetworkAwareLoader,
  LazyLoadComponent,
  PerformanceMonitor,
  useVirtualScrolling,
  useBatteryOptimization,
  useIntersectionObserver,
  useResourcePreloader
};