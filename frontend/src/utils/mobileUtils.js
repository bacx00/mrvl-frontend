// Mobile device detection and optimization utilities

/**
 * Detect if device is mobile based on screen size and user agent
 */
export const isMobileDevice = () => {
  // Check screen width
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    if (screenWidth <= 768) return true;
  }
  
  // Check user agent for mobile indicators
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'mobile', 'android', 'iphone', 'ipad', 'ipod', 
      'blackberry', 'windows phone', 'opera mini'
    ];
    
    return mobileKeywords.some(keyword => userAgent.includes(keyword));
  }
  
  return false;
};

/**
 * Detect if device is tablet
 */
export const isTabletDevice = () => {
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    if (screenWidth > 768 && screenWidth <= 1024) return true;
  }
  
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('ipad') || 
           (userAgent.includes('android') && !userAgent.includes('mobile'));
  }
  
  return false;
};

/**
 * Check if device has touch capabilities
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         navigator.msMaxTouchPoints > 0;
};

/**
 * Get optimal image size based on device capabilities
 */
export const getOptimalImageSize = () => {
  if (isMobileDevice()) return 'small';
  if (isTabletDevice()) return 'medium';
  return 'large';
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for scroll/resize events
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Check if device is on slow connection
 */
export const isSlowConnection = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      // Consider 3G and below as slow
      return connection.effectiveType === 'slow-2g' || 
             connection.effectiveType === '2g' || 
             connection.effectiveType === '3g';
    }
  }
  return false;
};

/**
 * Get device performance level
 */
export const getDevicePerformance = () => {
  if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
    const cores = navigator.hardwareConcurrency;
    if (cores >= 8) return 'high';
    if (cores >= 4) return 'medium';
    return 'low';
  }
  
  // Fallback based on device type
  if (isMobileDevice()) return 'low';
  if (isTabletDevice()) return 'medium';
  return 'high';
};

/**
 * Check if device supports modern features
 */
export const supportsModernFeatures = () => {
  return 'IntersectionObserver' in window &&
         'requestAnimationFrame' in window &&
         'Promise' in window &&
         'fetch' in window;
};

/**
 * Optimize touch targets for mobile
 */
export const optimizeTouchTargets = () => {
  if (!isTouchDevice()) return;
  
  // Add minimum touch target size via CSS
  const style = document.createElement('style');
  style.textContent = `
    button, a, input, select, textarea {
      min-height: 44px;
      min-width: 44px;
    }
    
    .touch-target {
      min-height: 44px !important;
      min-width: 44px !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Preload critical resources for mobile
 */
export const preloadCriticalResources = () => {
  const criticalCSS = [
    '/static/css/mobile-critical.css',
    '/static/css/mobile-vlr-enhanced.css'
  ];
  
  criticalCSS.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });
};

/**
 * Setup viewport for optimal mobile experience
 */
export const setupMobileViewport = () => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
    );
  } else {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
    document.head.appendChild(meta);
  }
};

/**
 * Lazy load images with intersection observer
 */
export const setupLazyImages = () => {
  if (!supportsModernFeatures()) return;
  
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

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
};

/**
 * Performance monitoring for mobile
 */
export const monitorMobilePerformance = () => {
  if ('performance' in window && 'mark' in performance) {
    // Mark key mobile performance metrics
    performance.mark('mobile-app-start');
    
    // Monitor Time to Interactive
    setTimeout(() => {
      performance.mark('mobile-interactive');
      const startTime = performance.getEntriesByName('mobile-app-start')[0];
      const interactiveTime = performance.getEntriesByName('mobile-interactive')[0];
      
      if (startTime && interactiveTime) {
        const tti = interactiveTime.startTime - startTime.startTime;
        console.log(`Mobile Time to Interactive: ${tti}ms`);
        
        // Alert if TTI is too slow (>3 seconds on mobile)
        if (tti > 3000) {
          console.warn('Mobile performance warning: Slow Time to Interactive');
        }
      }
    }, 100);
  }
};