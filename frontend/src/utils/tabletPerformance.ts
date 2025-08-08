// src/utils/tabletPerformance.ts
'use client';

// Performance optimization utilities for tablet devices
export class TabletPerformanceOptimizer {
  private static instance: TabletPerformanceOptimizer;
  private observers: Map<string, IntersectionObserver | ResizeObserver> = new Map();
  private performanceMetrics: Map<string, number> = new Map();
  private isTablet: boolean = false;
  private deviceCapabilities: {
    supportsPassiveEvents: boolean;
    supportsIntersectionObserver: boolean;
    supportsResizeObserver: boolean;
    supportsWebGL: boolean;
    maxTouchPoints: number;
    deviceMemory?: number;
    hardwareConcurrency: number;
  };

  private constructor() {
    this.detectTabletDevice();
    this.detectDeviceCapabilities();
    this.setupPerformanceMonitoring();
  }

  public static getInstance(): TabletPerformanceOptimizer {
    if (!TabletPerformanceOptimizer.instance) {
      TabletPerformanceOptimizer.instance = new TabletPerformanceOptimizer();
    }
    return TabletPerformanceOptimizer.instance;
  }

  private detectTabletDevice(): void {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Tablet detection heuristics
    this.isTablet = hasTouch && 
                    ((width >= 768 && width <= 1024) || (height >= 768 && height <= 1024)) &&
                    devicePixelRatio >= 1.5;
  }

  private detectDeviceCapabilities(): void {
    this.deviceCapabilities = {
      supportsPassiveEvents: this.checkPassiveEventSupport(),
      supportsIntersectionObserver: 'IntersectionObserver' in window,
      supportsResizeObserver: 'ResizeObserver' in window,
      supportsWebGL: this.checkWebGLSupport(),
      maxTouchPoints: navigator.maxTouchPoints || 0,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
    };
  }

  private checkPassiveEventSupport(): boolean {
    let supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => {
          supportsPassive = true;
          return true;
        }
      });
      window.addEventListener('testPassive', () => {}, opts);
      window.removeEventListener('testPassive', () => {}, opts);
    } catch (e) {}
    return supportsPassive;
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor FPS
    this.monitorFrameRate();
    
    // Monitor memory usage
    if ((performance as any).memory) {
      this.monitorMemoryUsage();
    }

    // Monitor network conditions
    if ('connection' in navigator) {
      this.monitorNetworkConditions();
    }
  }

  private monitorFrameRate(): void {
    let lastTime = 0;
    let frameCount = 0;
    const fpsValues: number[] = [];

    const measureFPS = (timestamp: number) => {
      frameCount++;
      
      if (timestamp - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (timestamp - lastTime));
        fpsValues.push(fps);
        
        // Keep only last 10 measurements
        if (fpsValues.length > 10) {
          fpsValues.shift();
        }
        
        const avgFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
        this.performanceMetrics.set('avgFPS', avgFPS);
        
        frameCount = 0;
        lastTime = timestamp;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private monitorMemoryUsage(): void {
    const checkMemory = () => {
      const memInfo = (performance as any).memory;
      if (memInfo) {
        const usedMemory = memInfo.usedJSHeapSize / (1024 * 1024); // MB
        const totalMemory = memInfo.totalJSHeapSize / (1024 * 1024); // MB
        const memoryUsage = (usedMemory / totalMemory) * 100;
        
        this.performanceMetrics.set('memoryUsage', memoryUsage);
        this.performanceMetrics.set('usedMemory', usedMemory);
      }
    };
    
    setInterval(checkMemory, 5000); // Check every 5 seconds
    checkMemory();
  }

  private monitorNetworkConditions(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      const updateNetworkInfo = () => {
        this.performanceMetrics.set('networkSpeed', connection.downlink || 0);
        this.performanceMetrics.set('networkRTT', connection.rtt || 0);
      };
      
      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }
  }

  // Public methods for optimization

  public optimizeForTablet(): {
    shouldUseVirtualization: boolean;
    shouldReduceAnimations: boolean;
    shouldLimitConcurrentRequests: boolean;
    recommendedTouchTargetSize: number;
    optimizedImageSizes: { small: number; medium: number; large: number };
  } {
    const avgFPS = this.performanceMetrics.get('avgFPS') || 60;
    const memoryUsage = this.performanceMetrics.get('memoryUsage') || 50;
    const isLowEnd = this.deviceCapabilities.hardwareConcurrency <= 2 ||
                     (this.deviceCapabilities.deviceMemory && this.deviceCapabilities.deviceMemory <= 2);

    return {
      shouldUseVirtualization: memoryUsage > 70 || avgFPS < 30,
      shouldReduceAnimations: avgFPS < 30 || isLowEnd,
      shouldLimitConcurrentRequests: isLowEnd || memoryUsage > 80,
      recommendedTouchTargetSize: this.isTablet ? 48 : 44,
      optimizedImageSizes: {
        small: isLowEnd ? 150 : 200,
        medium: isLowEnd ? 300 : 400,
        large: isLowEnd ? 600 : 800,
      },
    };
  }

  public createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver | null {
    if (!this.deviceCapabilities.supportsIntersectionObserver) {
      return null;
    }

    const observer = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });

    const observerId = `intersection_${Date.now()}_${Math.random()}`;
    this.observers.set(observerId, observer);

    return observer;
  }

  public optimizeScrolling(element: HTMLElement): () => void {
    const passiveOption = this.deviceCapabilities.supportsPassiveEvents 
      ? { passive: true } 
      : false;

    let ticking = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const delta = Math.abs(scrollY - lastScrollY);
          
          // Optimize based on scroll speed
          if (delta > 50) {
            // Fast scrolling - reduce complexity
            element.style.willChange = 'transform';
          } else {
            // Slow scrolling - allow full complexity
            element.style.willChange = 'auto';
          }
          
          lastScrollY = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    element.addEventListener('scroll', handleScroll, passiveOption);
    
    return () => {
      element.removeEventListener('scroll', handleScroll, passiveOption as any);
      element.style.willChange = 'auto';
    };
  }

  public createVirtualList<T>(
    items: T[],
    renderItem: (item: T, index: number) => HTMLElement,
    options: {
      itemHeight: number;
      containerHeight: number;
      overscan?: number;
    }
  ): {
    getVisibleItems: () => { item: T; index: number; element: HTMLElement }[];
    updateScroll: (scrollTop: number) => void;
    cleanup: () => void;
  } {
    const { itemHeight, containerHeight, overscan = 3 } = options;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    let scrollTop = 0;
    let renderedItems: Map<number, HTMLElement> = new Map();

    const getVisibleRange = () => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
      return { startIndex, endIndex };
    };

    const getVisibleItems = () => {
      const { startIndex, endIndex } = getVisibleRange();
      const visible: { item: T; index: number; element: HTMLElement }[] = [];

      for (let i = startIndex; i <= endIndex; i++) {
        if (!renderedItems.has(i)) {
          renderedItems.set(i, renderItem(items[i], i));
        }
        
        const element = renderedItems.get(i)!;
        element.style.transform = `translateY(${i * itemHeight}px)`;
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.right = '0';
        element.style.height = `${itemHeight}px`;
        
        visible.push({ item: items[i], index: i, element });
      }

      return visible;
    };

    const updateScroll = (newScrollTop: number) => {
      scrollTop = newScrollTop;
      
      // Cleanup items outside visible range
      const { startIndex, endIndex } = getVisibleRange();
      const toRemove: number[] = [];
      
      renderedItems.forEach((element, index) => {
        if (index < startIndex - overscan || index > endIndex + overscan) {
          toRemove.push(index);
        }
      });
      
      toRemove.forEach(index => {
        const element = renderedItems.get(index);
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
        renderedItems.delete(index);
      });
    };

    const cleanup = () => {
      renderedItems.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      renderedItems.clear();
    };

    return { getVisibleItems, updateScroll, cleanup };
  }

  public optimizeImages(
    img: HTMLImageElement,
    options: {
      quality?: 'low' | 'medium' | 'high';
      lazy?: boolean;
      placeholder?: string;
    } = {}
  ): void {
    const { quality = 'medium', lazy = true, placeholder } = options;
    const optimization = this.optimizeForTablet();
    
    // Set appropriate size based on device capabilities
    const sizes = optimization.optimizedImageSizes;
    const targetSize = quality === 'low' ? sizes.small : 
                      quality === 'medium' ? sizes.medium : sizes.large;

    // Add loading optimization
    if (lazy && 'loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    }

    // Add decoding optimization
    img.decoding = 'async';

    // Set placeholder
    if (placeholder && !img.src) {
      img.src = placeholder;
    }

    // Optimize based on network conditions
    const networkSpeed = this.performanceMetrics.get('networkSpeed');
    if (networkSpeed && networkSpeed < 2) { // Less than 2 Mbps
      img.style.filter = 'blur(1px)'; // Slight blur for low quality
    }
  }

  public getPerformanceMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.performanceMetrics.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const tabletPerformance = TabletPerformanceOptimizer.getInstance();

// Performance monitoring hook
export function useTabletPerformance() {
  const optimizer = TabletPerformanceOptimizer.getInstance();
  
  return {
    optimizer,
    metrics: optimizer.getPerformanceMetrics(),
    recommendations: optimizer.optimizeForTablet(),
  };
}