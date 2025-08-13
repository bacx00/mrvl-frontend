// Touch interaction optimizer for mobile tournament platform

import { logger, mobileLogger } from './logger';
import { isTouchDevice, throttle, debounce } from './mobileUtils';

class TouchOptimizer {
  constructor() {
    this.touchStartTime = 0;
    this.touchMoveDistance = 0;
    this.lastTouchEnd = 0;
    this.touchHandlers = new Map();
    this.preventNextClick = false;
    
    this.init();
  }

  init() {
    if (!isTouchDevice()) return;
    
    // Optimize touch events globally
    this.addGlobalTouchOptimizations();
    
    // Add touch feedback system
    this.addTouchFeedback();
    
    // Optimize scroll performance
    this.optimizeScrolling();
    
    logger.debug('TouchOptimizer initialized');
  }

  addGlobalTouchOptimizations() {
    // Prevent double-tap zoom on buttons and interactive elements
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - this.lastTouchEnd <= 300) {
        e.preventDefault();
        this.preventNextClick = true;
        setTimeout(() => {
          this.preventNextClick = false;
        }, 100);
      }
      this.lastTouchEnd = now;
    }, { passive: false });

    // Handle click events after touch
    document.addEventListener('click', (e) => {
      if (this.preventNextClick) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Optimize touch target sizing
    this.optimizeTouchTargets();
  }

  optimizeTouchTargets() {
    // Add touch target class to interactive elements
    const selectors = [
      'button',
      'a[href]',
      '[onclick]',
      '[role="button"]',
      '.match-card',
      '.news-card',
      '.discussion-item'
    ];

    const style = document.createElement('style');
    style.textContent = `
      ${selectors.join(', ')} {
        min-height: 44px;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-tap-highlight-color: rgba(220, 38, 38, 0.1);
        touch-action: manipulation;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  addTouchFeedback() {
    // Add visual touch feedback
    document.addEventListener('touchstart', (e) => {
      this.touchStartTime = performance.now();
      this.addRippleEffect(e);
      
      // Add active state
      const target = e.target.closest('.touch-target, button, a, [role="button"]');
      if (target) {
        target.classList.add('touch-active');
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchDuration = performance.now() - this.touchStartTime;
      
      // Log slow interactions
      if (touchDuration > 100) {
        mobileLogger.logInteractionDelay('touch', e.target.tagName, this.touchStartTime);
      }
      
      // Remove active state
      const target = e.target.closest('.touch-target, button, a, [role="button"]');
      if (target) {
        setTimeout(() => {
          target.classList.remove('touch-active');
        }, 150);
      }
    }, { passive: true });
  }

  addRippleEffect(e) {
    const target = e.target.closest('.touch-target, button, .mobile-card');
    if (!target) return;

    // Create ripple element
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    
    const rect = target.getBoundingClientRect();
    const touch = e.touches[0];
    const size = Math.max(rect.width, rect.height);
    const x = touch.clientX - rect.left - size / 2;
    const y = touch.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1000;
    `;

    // Ensure target has relative positioning
    const originalPosition = target.style.position;
    if (!originalPosition || originalPosition === 'static') {
      target.style.position = 'relative';
    }

    target.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  optimizeScrolling() {
    // Throttled scroll handler for performance
    const scrollHandler = throttle((e) => {
      // Track scroll performance
      const scrollTop = e.target.scrollTop;
      this.trackScrollPerformance(scrollTop);
    }, 16); // 60fps

    // Add optimized scroll listeners to scroll containers
    const scrollContainers = document.querySelectorAll('.scroll-container, .mobile-scroll-view');
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', scrollHandler, { passive: true });
      
      // Add momentum scrolling for iOS
      container.style.webkitOverflowScrolling = 'touch';
    });
  }

  trackScrollPerformance(scrollTop) {
    // Monitor for scroll jank
    const now = performance.now();
    if (this.lastScrollTime) {
      const frameDuration = now - this.lastScrollTime;
      if (frameDuration > 20) { // More than 50fps
        logger.warn(`Scroll jank detected: ${frameDuration.toFixed(2)}ms`);
      }
    }
    this.lastScrollTime = now;
  }

  // Enhanced touch handler for match cards
  optimizeMatchCards() {
    const matchCards = document.querySelectorAll('.match-card, .mobile-match-card');
    
    matchCards.forEach(card => {
      this.addOptimizedTouchHandler(card, (e) => {
        const matchId = card.dataset.matchId;
        if (matchId) {
          // Optimized navigation with haptic feedback
          this.triggerHapticFeedback();
          
          // Dispatch custom event with touch optimization
          const event = new CustomEvent('match-select', {
            detail: { matchId, touchOptimized: true }
          });
          document.dispatchEvent(event);
        }
      });
    });
  }

  addOptimizedTouchHandler(element, handler) {
    let touchStartY = 0;
    let touchStartX = 0;
    let moved = false;

    element.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
      moved = false;
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const deltaY = Math.abs(touch.clientY - touchStartY);
      const deltaX = Math.abs(touch.clientX - touchStartX);
      
      // Detect if this is a scroll or a tap
      if (deltaY > 10 || deltaX > 10) {
        moved = true;
      }
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      if (!moved) {
        // Only trigger handler if it's a tap, not a scroll
        handler(e);
      }
    }, { passive: true });
  }

  triggerHapticFeedback() {
    // Trigger haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Very short vibration
    }
  }

  // Method to optimize existing components
  optimizeComponent(component) {
    const element = component.current || component;
    if (!element) return;

    // Add touch optimizations to the component
    element.classList.add('touch-optimized');
    
    // Add performance monitoring
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 16) {
          logger.warn(`Component performance issue: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => {
      observer.disconnect();
    };
  }

  // Add CSS animations for touch feedback
  addTouchStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        from {
          transform: scale(0);
          opacity: 0.8;
        }
        to {
          transform: scale(1);
          opacity: 0;
        }
      }
      
      .touch-active {
        transform: scale(0.95);
        transition: transform 0.1s ease-out;
      }
      
      .touch-optimized {
        -webkit-tap-highlight-color: rgba(220, 38, 38, 0.1);
        -webkit-user-select: none;
        user-select: none;
        touch-action: manipulation;
      }
      
      /* Fast button animations */
      .mobile-button:active {
        transform: scale(0.95);
        transition: transform 0.05s ease-out;
      }
      
      /* Enhanced scroll containers */
      .optimized-scroll {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(style);
  }

  // Performance monitoring for touch interactions
  measureTouchPerformance(name, touchHandler) {
    return (...args) => {
      const start = performance.now();
      const result = touchHandler(...args);
      const end = performance.now();
      
      const duration = end - start;
      if (duration > 16) { // Slower than 60fps
        logger.warn(`Slow touch handler "${name}": ${duration.toFixed(2)}ms`);
      }
      
      return result;
    };
  }
}

// Create global instance
const touchOptimizer = new TouchOptimizer();

// Add styles on initialization
document.addEventListener('DOMContentLoaded', () => {
  touchOptimizer.addTouchStyles();
  touchOptimizer.optimizeMatchCards();
});

export default touchOptimizer;
export { TouchOptimizer };