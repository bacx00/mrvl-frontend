// Marvel Rivals Mobile Optimization Utilities
// VLR.gg-inspired mobile performance and UX enhancements

/**
 * Mobile Device Detection and Optimization
 */
export const MobileOptimizer = {
  // Device type detection
  getDeviceInfo: () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLandscape = width > height;
    
    // Enhanced device detection
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    
    // Performance metrics
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connectionSpeed = connection?.effectiveType || 'unknown';
    const saveData = connection?.saveData || false;
    
    return {
      isSmallMobile: width < 480,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isTouchDevice,
      isLandscape,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      width,
      height,
      connectionSpeed,
      saveData,
      pixelRatio: window.devicePixelRatio || 1,
      hasNotch: isIOS && (height === 812 || height === 896 || height === 844 || height === 926)
    };
  },

  // Performance optimization based on device capabilities
  optimizeForDevice: () => {
    const device = MobileOptimizer.getDeviceInfo();
    
    // Apply performance optimizations based on device
    if (device.isMobile) {
      // Mobile-specific optimizations
      document.documentElement.style.setProperty('--mobile-optimization', 'true');
      
      // Reduce motion for battery saving
      if (device.saveData) {
        document.documentElement.style.setProperty('--reduced-motion', 'true');
      }
      
      // iOS-specific optimizations
      if (device.isIOS) {
        document.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
        document.body.style.setProperty('-webkit-text-size-adjust', '100%');
      }
      
      // Notch support
      if (device.hasNotch) {
        document.documentElement.classList.add('has-notch');
      }
    }
    
    return device;
  },

  // Image lazy loading optimization
  optimizeImages: () => {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy');
      });
    }
  },

  // VLR.gg-style touch feedback
  addTouchFeedback: (element) => {
    if (!element) return;
    
    element.addEventListener('touchstart', (e) => {
      element.style.transform = 'scale(0.98)';
      element.style.transition = 'transform 0.1s ease';
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });
    
    element.addEventListener('touchend', () => {
      element.style.transform = '';
    });
    
    element.addEventListener('touchcancel', () => {
      element.style.transform = '';
    });
  },

  // Network-aware loading
  isSlowConnection: () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
  },

  // Critical resource loading
  preloadCriticalResources: () => {
    const device = MobileOptimizer.getDeviceInfo();
    
    // Only preload on fast connections
    if (!MobileOptimizer.isSlowConnection()) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = '/fonts/inter-var.woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }
};

/**
 * VLR.gg-style Mobile Performance Monitor
 */
export const MobilePerformanceMonitor = {
  metrics: {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0
  },

  // Initialize performance monitoring
  init: () => {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        MobilePerformanceMonitor.metrics.lcp = entry.startTime;
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        MobilePerformanceMonitor.metrics.fid = entry.processingStart - entry.startTime;
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          MobilePerformanceMonitor.metrics.cls = clsValue;
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });

    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          MobilePerformanceMonitor.metrics.fcp = entry.startTime;
        }
      }
    }).observe({ entryTypes: ['paint'] });
  },

  // Get performance report
  getReport: () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    return {
      ...MobilePerformanceMonitor.metrics,
      ttfb: navigation?.responseStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
      loadComplete: navigation?.loadEventEnd || 0,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: navigator.connection?.effectiveType || 'unknown'
    };
  },

  // Send performance data (if analytics enabled)
  reportMetrics: () => {
    const report = MobilePerformanceMonitor.getReport();
    
    // Only report poor performance to help identify issues
    if (report.lcp > 2500 || report.fid > 100 || report.cls > 0.1) {
      console.warn('Poor mobile performance detected:', report);
      
      // Could send to analytics service here
      // analytics.track('mobile_performance_issue', report);
    }
  }
};

/**
 * VLR.gg-style Mobile Gesture Handler
 */
export class MobileGestureHandler {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      swipeThreshold: 50,
      tapTimeout: 300,
      longPressTimeout: 500,
      ...options
    };
    
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.isLongPress = false;
    
    this.init();
  }
  
  init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }
  
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isLongPress = false;
    
    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      this.onLongPress?.(e);
    }, this.options.longPressTimeout);
  }
  
  handleTouchMove(e) {
    // Cancel long press if user moves
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
  
  handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const deltaTime = Date.now() - this.startTime;
    
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Swipe detection
    if (absDeltaX > this.options.swipeThreshold || absDeltaY > this.options.swipeThreshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.onSwipeRight?.(e);
        } else {
          this.onSwipeLeft?.(e);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.onSwipeDown?.(e);
        } else {
          this.onSwipeUp?.(e);
        }
      }
    } else if (deltaTime < this.options.tapTimeout && !this.isLongPress) {
      // Tap detection
      this.onTap?.(e);
    }
  }
  
  // Event handlers (to be set by user)
  onTap = null;
  onLongPress = null;
  onSwipeLeft = null;
  onSwipeRight = null;
  onSwipeUp = null;
  onSwipeDown = null;
}

/**
 * Mobile-specific utilities
 */
export const MobileUtils = {
  // Prevent zoom on input focus
  preventZoomOnFocus: () => {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.style.fontSize !== '16px') {
        input.style.fontSize = '16px';
      }
    });
  },

  // Safe area support
  updateSafeArea: () => {
    const device = MobileOptimizer.getDeviceInfo();
    if (device.hasNotch) {
      document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
      document.documentElement.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
    }
  },

  // Haptic feedback
  haptic: {
    light: () => navigator.vibrate?.(10),
    medium: () => navigator.vibrate?.(20),
    heavy: () => navigator.vibrate?.([30, 10, 30]),
    success: () => navigator.vibrate?.([10, 10, 10]),
    error: () => navigator.vibrate?.([50, 20, 50, 20, 50])
  },

  // Network status monitoring
  monitorConnection: (callback) => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        callback({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      });
    }
  },

  // Visibility change handling
  onVisibilityChange: (callback) => {
    document.addEventListener('visibilitychange', () => {
      callback(document.hidden);
    });
  }
};

// Initialize mobile optimizations
export const initMobileOptimizations = () => {
  // Device optimization
  MobileOptimizer.optimizeForDevice();
  
  // Performance monitoring
  if ('PerformanceObserver' in window) {
    MobilePerformanceMonitor.init();
  }
  
  // Image optimization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MobileOptimizer.optimizeImages);
  } else {
    MobileOptimizer.optimizeImages();
  }
  
  // Safe area support
  MobileUtils.updateSafeArea();
  
  // Prevent zoom on inputs
  MobileUtils.preventZoomOnFocus();
  
  // Preload critical resources
  MobileOptimizer.preloadCriticalResources();
  
  console.log('MRVL Mobile optimizations initialized');
};

export default {
  MobileOptimizer,
  MobilePerformanceMonitor,
  MobileGestureHandler,
  MobileUtils,
  initMobileOptimizations
};