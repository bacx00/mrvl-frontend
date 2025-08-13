/**
 * Mobile Viewport Optimizer for Marvel Rivals Tournament Platform
 * CRITICAL: Ensures optimal viewport handling and prevents zoom issues
 */

class MobileViewportOptimizer {
  constructor() {
    this.isInitialized = false;
    this.viewportMeta = null;
  }

  // Initialize viewport optimizations
  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupViewportMeta();
    this.handleOrientationChange();
    this.preventIOSBounce();
    this.optimizeSafeArea();
    this.handleKeyboardResize();
    
    this.isInitialized = true;
    console.log('📱 Mobile Viewport Optimizer initialized');
  }

  // Setup optimal viewport meta tag
  setupViewportMeta() {
    this.viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!this.viewportMeta) {
      this.viewportMeta = document.createElement('meta');
      this.viewportMeta.name = 'viewport';
      document.head.appendChild(this.viewportMeta);
    }

    // Optimal viewport settings for tournament platform
    this.viewportMeta.content = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=5.0', // Allow zoom for accessibility
      'minimum-scale=1.0',
      'user-scalable=yes', // Enable zoom for accessibility
      'viewport-fit=cover' // Support iPhone X+ safe area
    ].join(', ');
  }

  // Handle orientation changes
  handleOrientationChange() {
    const handleChange = () => {
      // Fix iOS viewport height bug on orientation change
      setTimeout(() => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Force scroll to prevent address bar issues
        if (window.scrollY === 0) {
          window.scrollTo(0, 1);
          setTimeout(() => window.scrollTo(0, 0), 0);
        }
      }, 100);
    };

    window.addEventListener('orientationchange', handleChange);
    window.addEventListener('resize', handleChange);
    
    // Initial setup
    handleChange();
  }

  // Prevent iOS bounce/overscroll
  preventIOSBounce() {
    document.body.style.overscrollBehavior = 'none';
    
    // Prevent pull-to-refresh on the main document
    let startY = 0;
    
    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Prevent pull-to-refresh at top of page
      if (scrollTop === 0 && currentY > startY) {
        e.preventDefault();
      }
      
      // Prevent overscroll at bottom
      const isAtBottom = scrollTop + window.innerHeight >= document.documentElement.scrollHeight;
      if (isAtBottom && currentY < startY) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // Optimize safe area handling
  optimizeSafeArea() {
    // CSS custom properties for safe area insets
    const safeAreaVars = {
      '--safe-area-inset-top': 'env(safe-area-inset-top)',
      '--safe-area-inset-right': 'env(safe-area-inset-right)',
      '--safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
      '--safe-area-inset-left': 'env(safe-area-inset-left)'
    };

    Object.entries(safeAreaVars).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }

  // Handle virtual keyboard resize
  handleKeyboardResize() {
    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Virtual keyboard is likely open if height reduced significantly
      const isKeyboardOpen = heightDifference > 150;
      
      document.body.classList.toggle('keyboard-open', isKeyboardOpen);
      
      // Adjust viewport height for keyboard
      if (isKeyboardOpen) {
        document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`);
      } else {
        document.documentElement.style.removeProperty('--keyboard-height');
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }
  }

  // Get current device info
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    return {
      isMobile: /Mobi|Android/i.test(userAgent),
      isTablet: /Tablet|iPad/i.test(userAgent),
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      isChrome: /Chrome/.test(userAgent),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.screen.orientation?.angle || 0
    };
  }

  // Check if device needs performance optimizations
  needsPerformanceOptimizations() {
    const deviceInfo = this.getDeviceInfo();
    
    // Consider low-end devices based on:
    // - Screen size
    // - Memory (if available)
    // - Connection type
    const isLowEndDevice = 
      deviceInfo.viewportWidth < 400 ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
      (navigator.connection && navigator.connection.effectiveType === '2g');
    
    return {
      reduceAnimations: isLowEndDevice,
      lazyLoadImages: true,
      reduceParallax: isLowEndDevice,
      limitConcurrentRequests: isLowEndDevice
    };
  }

  // Add mobile-specific CSS classes
  addMobileClasses() {
    const deviceInfo = this.getDeviceInfo();
    const classList = document.documentElement.classList;
    
    if (deviceInfo.isMobile) classList.add('is-mobile');
    if (deviceInfo.isTablet) classList.add('is-tablet');
    if (deviceInfo.isIOS) classList.add('is-ios');
    if (deviceInfo.isAndroid) classList.add('is-android');
    if (deviceInfo.isSafari) classList.add('is-safari');
    if (deviceInfo.isChrome) classList.add('is-chrome');
    
    // Touch support
    if ('ontouchstart' in window) {
      classList.add('touch-enabled');
    }
    
    // High DPI
    if (deviceInfo.pixelRatio > 1) {
      classList.add('high-dpi');
    }
    
    // Performance optimizations
    const perfOptimizations = this.needsPerformanceOptimizations();
    if (perfOptimizations.reduceAnimations) {
      classList.add('reduce-animations');
    }
  }

  // Force repaint to fix rendering issues
  forceRepaint() {
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
  }
}

// Create singleton instance
const mobileViewportOptimizer = new MobileViewportOptimizer();

// Auto-initialize
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileViewportOptimizer.initialize();
      mobileViewportOptimizer.addMobileClasses();
    });
  } else {
    mobileViewportOptimizer.initialize();
    mobileViewportOptimizer.addMobileClasses();
  }
}

export default mobileViewportOptimizer;