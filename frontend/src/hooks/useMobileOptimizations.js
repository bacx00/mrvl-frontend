import { useState, useEffect, useCallback } from 'react';

/**
 * VLR.gg Inspired Mobile Optimization Hook
 * Handles device detection, performance optimizations, and mobile-specific behaviors
 */
function useMobileOptimizations() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'portrait',
    viewportWidth: 0,
    viewportHeight: 0,
    touchSupport: false,
    connectionType: 'unknown'
  });

  const [performance, setPerformance] = useState({
    reducedMotion: false,
    dataSaver: false,
    slowConnection: false
  });

  // VLR.gg style device detection
  const detectDevice = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // VLR.gg breakpoints
    const isMobile = width <= 640;
    const isTablet = width > 640 && width <= 1024;
    const isDesktop = width > 1024;
    
    // Touch detection
    const touchSupport = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 || 
                        navigator.msMaxTouchPoints > 0;

    // Connection detection (like VLR.gg's performance optimization)
    let connectionType = 'unknown';
    let slowConnection = false;
    
    if ('connection' in navigator) {
      const conn = navigator.connection;
      connectionType = conn.effectiveType || 'unknown';
      slowConnection = ['slow-2g', '2g'].includes(conn.effectiveType);
    }

    setDeviceInfo({
      isMobile,
      isTablet,
      isDesktop,
      orientation: width > height ? 'landscape' : 'portrait',
      viewportWidth: width,
      viewportHeight: height,
      touchSupport,
      connectionType
    });

    // Performance preferences
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dataSaver = 'connection' in navigator && navigator.connection.saveData;

    setPerformance({
      reducedMotion,
      dataSaver: dataSaver || false,
      slowConnection
    });
  }, []);

  // VLR.gg style responsive updates
  useEffect(() => {
    detectDevice();
    
    const handleResize = () => detectDevice();
    const handleOrientationChange = () => {
      setTimeout(detectDevice, 100); // Delay for orientation change
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Listen for connection changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', detectDevice);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', detectDevice);
      }
    };
  }, [detectDevice]);

  // VLR.gg style touch optimization
  const optimizeForTouch = useCallback((element) => {
    if (!element || !deviceInfo.touchSupport) return;

    // Add touch-friendly classes
    element.classList.add('touch-optimized');
    
    // Prevent zoom on double-tap for specific elements
    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    return () => {
      element.classList.remove('touch-optimized');
    };
  }, [deviceInfo.touchSupport]);

  // VLR.gg style performance optimization
  const shouldReduceMotion = performance.reducedMotion || performance.slowConnection;
  const shouldOptimizeImages = performance.dataSaver || performance.slowConnection;
  
  // Mobile-specific utilities
  const getOptimalImageSize = useCallback((baseWidth) => {
    if (performance.dataSaver) return Math.min(baseWidth * 0.5, 400);
    if (deviceInfo.isMobile) return Math.min(baseWidth * 0.75, 600);
    if (deviceInfo.isTablet) return Math.min(baseWidth * 0.85, 800);
    return baseWidth;
  }, [deviceInfo, performance]);

  const getOptimalThumbnailSize = useCallback(() => {
    if (performance.dataSaver) return 100;
    if (deviceInfo.isMobile) return 150;
    if (deviceInfo.isTablet) return 200;
    return 250;
  }, [deviceInfo, performance]);

  // VLR.gg style adaptive loading
  const shouldLazyLoad = deviceInfo.isMobile || performance.slowConnection;
  const shouldPreloadImages = !performance.dataSaver && !performance.slowConnection;

  // Touch gesture helpers
  const addSwipeGesture = useCallback((element, onSwipeLeft, onSwipeRight) => {
    if (!element || !deviceInfo.touchSupport) return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // VLR.gg style swipe detection
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          onSwipeRight && onSwipeRight();
        } else {
          onSwipeLeft && onSwipeLeft();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [deviceInfo.touchSupport]);

  return {
    // Device information
    ...deviceInfo,
    
    // Performance settings
    shouldReduceMotion,
    shouldOptimizeImages,
    shouldLazyLoad,
    shouldPreloadImages,
    
    // Optimization utilities
    optimizeForTouch,
    getOptimalImageSize,
    getOptimalThumbnailSize,
    addSwipeGesture,
    
    // Performance state
    performance,
    
    // Responsive helpers
    isMobileOrTablet: deviceInfo.isMobile || deviceInfo.isTablet,
    isLandscape: deviceInfo.orientation === 'landscape',
    isPortrait: deviceInfo.orientation === 'portrait'
  };
}

export default useMobileOptimizations;