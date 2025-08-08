import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  useConnectionAwareLoading, 
  usePerformanceMonitor, 
  useMemoryOptimization,
  injectCriticalCSS 
} from '../components/mobile/PerformanceOptimizations';
import { useIntelligentPrefetch } from '../components/mobile/MobileRouteLoader';

// Main mobile optimization hook
export const useMobileOptimization = (options = {}) => {
  const {
    enablePerformanceMonitoring = true,
    enableIntelligentPrefetch = true,
    enableMemoryOptimization = true,
    performanceThresholds = {
      fcp: 2000, // First Contentful Paint target: 2s
      lcp: 2500, // Largest Contentful Paint target: 2.5s
      fid: 100,  // First Input Delay target: 100ms
      cls: 0.1   // Cumulative Layout Shift target: 0.1
    }
  } = options;

  const [optimizationStatus, setOptimizationStatus] = useState({
    initialized: false,
    criticalCSSLoaded: false,
    performanceGrade: null,
    connectionQuality: null,
    memoryUsage: null
  });

  const { connection, shouldLoadHighQuality, shouldPreload } = useConnectionAwareLoading();
  const { metrics, logMetrics } = enablePerformanceMonitoring ? usePerformanceMonitor() : { metrics: {}, logMetrics: () => {} };
  const { optimizeImages, clearUnusedCache } = enableMemoryOptimization ? useMemoryOptimization() : { optimizeImages: () => {}, clearUnusedCache: () => {} };

  // Initialize intelligent prefetch
  if (enableIntelligentPrefetch && shouldPreload) {
    useIntelligentPrefetch();
  }

  // Calculate performance grade
  const calculatePerformanceGrade = useCallback(() => {
    const { fcp, lcp, fid, cls } = metrics;
    if (!fcp || !lcp) return null;

    let score = 100;
    
    // FCP scoring
    if (fcp > performanceThresholds.fcp * 2) score -= 30;
    else if (fcp > performanceThresholds.fcp) score -= 15;
    
    // LCP scoring
    if (lcp > performanceThresholds.lcp * 2) score -= 30;
    else if (lcp > performanceThresholds.lcp) score -= 15;
    
    // FID scoring
    if (fid && fid > performanceThresholds.fid * 3) score -= 20;
    else if (fid && fid > performanceThresholds.fid) score -= 10;
    
    // CLS scoring
    if (cls && cls > performanceThresholds.cls * 2) score -= 20;
    else if (cls && cls > performanceThresholds.cls) score -= 10;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }, [metrics, performanceThresholds]);

  // Memory monitoring
  const monitorMemoryUsage = useCallback(() => {
    if (!('performance' in window) || !performance.memory) return null;

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    
    return {
      used: Math.round(usedJSHeapSize / 1048576), // MB
      total: Math.round(totalJSHeapSize / 1048576), // MB
      limit: Math.round(jsHeapSizeLimit / 1048576), // MB
      usagePercent: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100)
    };
  }, []);

  // Initialize optimizations
  useEffect(() => {
    const initializeOptimizations = async () => {
      try {
        // Inject critical CSS immediately
        injectCriticalCSS();
        
        setOptimizationStatus(prev => ({
          ...prev,
          criticalCSSLoaded: true
        }));

        // Performance monitoring setup
        if (enablePerformanceMonitoring) {
          // Log metrics after page is fully loaded
          setTimeout(logMetrics, 5000);
        }

        // Memory optimization setup
        if (enableMemoryOptimization) {
          // Run memory cleanup every 5 minutes
          const memoryInterval = setInterval(() => {
            optimizeImages();
            clearUnusedCache();
          }, 300000);

          // Cleanup on unmount
          return () => clearInterval(memoryInterval);
        }

        setOptimizationStatus(prev => ({
          ...prev,
          initialized: true
        }));

      } catch (error) {
        console.error('Mobile optimization initialization error:', error);
      }
    };

    initializeOptimizations();
  }, [enablePerformanceMonitoring, enableMemoryOptimization, logMetrics, optimizeImages, clearUnusedCache]);

  // Update status based on metrics and connection
  useEffect(() => {
    const performanceGrade = calculatePerformanceGrade();
    const memoryUsage = monitorMemoryUsage();
    
    setOptimizationStatus(prev => ({
      ...prev,
      performanceGrade,
      connectionQuality: connection.effectiveType,
      memoryUsage
    }));
  }, [metrics, connection, calculatePerformanceGrade, monitorMemoryUsage]);

  // Performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations = [];
    const { fcp, lcp, fid, cls } = metrics;

    if (fcp && fcp > performanceThresholds.fcp) {
      recommendations.push({
        type: 'warning',
        metric: 'FCP',
        message: 'First Contentful Paint is slow',
        suggestion: 'Optimize critical resources and reduce render-blocking scripts'
      });
    }

    if (lcp && lcp > performanceThresholds.lcp) {
      recommendations.push({
        type: 'warning',
        metric: 'LCP',
        message: 'Largest Contentful Paint is slow',
        suggestion: 'Optimize largest page element loading'
      });
    }

    if (fid && fid > performanceThresholds.fid) {
      recommendations.push({
        type: 'warning',
        metric: 'FID',
        message: 'First Input Delay is high',
        suggestion: 'Reduce JavaScript execution time'
      });
    }

    if (cls && cls > performanceThresholds.cls) {
      recommendations.push({
        type: 'error',
        metric: 'CLS',
        message: 'Cumulative Layout Shift is too high',
        suggestion: 'Ensure size attributes on images and avoid content shifts'
      });
    }

    if (connection.saveData) {
      recommendations.push({
        type: 'info',
        metric: 'DATA_SAVER',
        message: 'User has data saver enabled',
        suggestion: 'Serving optimized content for reduced data usage'
      });
    }

    if (optimizationStatus.memoryUsage?.usagePercent > 80) {
      recommendations.push({
        type: 'warning',
        metric: 'MEMORY',
        message: 'High memory usage detected',
        suggestion: 'Consider clearing unused resources'
      });
    }

    return recommendations;
  }, [metrics, performanceThresholds, connection, optimizationStatus.memoryUsage]);

  // Force optimization cleanup
  const forceOptimization = useCallback(async () => {
    try {
      await optimizeImages();
      await clearUnusedCache();
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }

      return true;
    } catch (error) {
      console.error('Force optimization error:', error);
      return false;
    }
  }, [optimizeImages, clearUnusedCache]);

  // Get loading strategy based on connection
  const getLoadingStrategy = useCallback(() => {
    const strategy = {
      imageQuality: shouldLoadHighQuality ? 'high' : 'medium',
      enableLazyLoading: true,
      enablePrefetch: shouldPreload,
      chunkSize: connection.effectiveType === '4g' ? 'large' : 'small',
      enableVirtualScrolling: connection.effectiveType !== '4g' || connection.saveData
    };

    if (connection.saveData) {
      strategy.imageQuality = 'low';
      strategy.enablePrefetch = false;
      strategy.enableVirtualScrolling = true;
    }

    return strategy;
  }, [shouldLoadHighQuality, shouldPreload, connection]);

  return {
    // Status
    optimizationStatus,
    
    // Metrics
    performanceMetrics: metrics,
    connectionInfo: connection,
    memoryInfo: optimizationStatus.memoryUsage,
    
    // Recommendations
    performanceGrade: optimizationStatus.performanceGrade,
    recommendations: getPerformanceRecommendations(),
    
    // Loading strategy
    loadingStrategy: getLoadingStrategy(),
    
    // Actions
    forceOptimization,
    logMetrics
  };
};

// Device capability detection hook
export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    isHighEnd: false,
    supportsPWA: false,
    supportsWebP: false,
    supportsHaptics: false,
    deviceMemory: null,
    hardwareConcurrency: null,
    maxTouchPoints: 0
  });

  useEffect(() => {
    const detectCapabilities = async () => {
      const caps = {
        // Device memory (GB)
        deviceMemory: navigator.deviceMemory || null,
        
        // CPU cores
        hardwareConcurrency: navigator.hardwareConcurrency || null,
        
        // Touch capability
        maxTouchPoints: navigator.maxTouchPoints || 0,
        
        // PWA support
        supportsPWA: 'serviceWorker' in navigator && 'PushManager' in window,
        
        // Haptics support
        supportsHaptics: 'vibrate' in navigator,
        
        // WebP support
        supportsWebP: false
      };

      // Test WebP support
      try {
        const webpSupport = await new Promise((resolve) => {
          const webP = new Image();
          webP.onload = webP.onerror = () => resolve(webP.height === 2);
          webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
        caps.supportsWebP = webpSupport;
      } catch (error) {
        console.warn('WebP detection failed:', error);
      }

      // Determine if device is high-end
      caps.isHighEnd = (
        (caps.deviceMemory && caps.deviceMemory >= 4) ||
        (caps.hardwareConcurrency && caps.hardwareConcurrency >= 4)
      );

      setCapabilities(caps);
    };

    detectCapabilities();
  }, []);

  return capabilities;
};

// Adaptive loading hook
export const useAdaptiveLoading = () => {
  const { loadingStrategy, connectionInfo } = useMobileOptimization();
  const deviceCapabilities = useDeviceCapabilities();
  
  const getImageSrc = useCallback((baseSrc, options = {}) => {
    const { width, height, quality = loadingStrategy.imageQuality } = options;
    
    if (!baseSrc) return '';

    let finalSrc = baseSrc;
    
    // Add responsive sizing if supported
    if (width || height) {
      finalSrc += `?w=${width || ''}&h=${height || ''}`;
    }
    
    // Optimize format based on support
    if (deviceCapabilities.supportsWebP && !finalSrc.includes('.svg')) {
      finalSrc += '&f=webp';
    }
    
    // Adjust quality based on connection
    const qualityMap = { low: 40, medium: 70, high: 90 };
    finalSrc += `&q=${qualityMap[quality] || 70}`;
    
    return finalSrc;
  }, [loadingStrategy.imageQuality, deviceCapabilities.supportsWebP]);

  const shouldUseVirtualScrolling = useCallback((itemCount) => {
    return loadingStrategy.enableVirtualScrolling || itemCount > 100;
  }, [loadingStrategy.enableVirtualScrolling]);

  const getChunkSize = useCallback(() => {
    if (connectionInfo.saveData) return 10;
    if (connectionInfo.effectiveType === '4g') return 50;
    return 25;
  }, [connectionInfo]);

  return {
    getImageSrc,
    shouldUseVirtualScrolling,
    getChunkSize,
    loadingStrategy,
    deviceCapabilities
  };
};

export default {
  useMobileOptimization,
  useDeviceCapabilities,
  useAdaptiveLoading
};