/**
 * Performance Monitoring Utilities for Marvel Rivals Tournament Platform
 * CRITICAL: Mobile performance tracking and optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     (window.location.hostname === 'staging.mrvl.net');
  }

  // Track component render times
  trackComponentRender(componentName, startTime) {
    if (!this.isEnabled) return;

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, {
        renderCount: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const metrics = this.metrics.get(componentName);
    metrics.renderCount += 1;
    metrics.totalTime += renderTime;
    metrics.avgTime = metrics.totalTime / metrics.renderCount;
    metrics.maxTime = Math.max(metrics.maxTime, renderTime);
    metrics.minTime = Math.min(metrics.minTime, renderTime);

    // Log slow renders
    if (renderTime > 100) {
      console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    // Log performance summary every 10 renders
    if (metrics.renderCount % 10 === 0) {
      console.log(`📊 ${componentName} Performance:`, {
        renders: metrics.renderCount,
        avgTime: `${metrics.avgTime.toFixed(2)}ms`,
        maxTime: `${metrics.maxTime.toFixed(2)}ms`
      });
    }
  }

  // Monitor Core Web Vitals
  measureWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('📏 LCP (Largest Contentful Paint):', lastEntry.startTime.toFixed(2) + 'ms');
      
      if (lastEntry.startTime > 2500) {
        console.warn('⚠️ LCP is slow (>2.5s) - optimize above-the-fold content');
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      console.log('📏 CLS (Cumulative Layout Shift):', clsValue.toFixed(4));
      
      if (clsValue > 0.1) {
        console.warn('⚠️ CLS is high (>0.1) - fix layout shifts');
      }
    }).observe({ entryTypes: ['layout-shift'] });

    // First Input Delay (FID) - approximated with event timing
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const inputDelay = entry.processingStart - entry.startTime;
        console.log('📏 Input Delay:', inputDelay.toFixed(2) + 'ms');
        
        if (inputDelay > 100) {
          console.warn('⚠️ Input delay is high (>100ms) - optimize main thread');
        }
      }
    }).observe({ entryTypes: ['event'] });
  }

  // Monitor long tasks that block the main thread
  monitorLongTasks() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.warn(`🚨 Long Task detected: ${entry.duration.toFixed(2)}ms`);
        console.log('Task details:', entry);
      }
    }).observe({ entryTypes: ['longtask'] });
  }

  // Monitor memory usage (Chrome only)
  monitorMemoryUsage() {
    if (!this.isEnabled || typeof window === 'undefined' || !performance.memory) return;

    const logMemory = () => {
      const memory = performance.memory;
      console.log('💾 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        allocated: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });

      // Warn if memory usage is high
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
        console.warn('⚠️ High memory usage detected - check for memory leaks');
      }
    };

    // Log memory usage every 30 seconds
    setInterval(logMemory, 30000);
    logMemory(); // Initial measurement
  }

  // Track API response times
  trackApiResponse(endpoint, startTime, success = true) {
    if (!this.isEnabled) return;

    const responseTime = performance.now() - startTime;
    const key = `API_${endpoint}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        callCount: 0,
        totalTime: 0,
        avgTime: 0,
        successCount: 0,
        errorCount: 0
      });
    }

    const metrics = this.metrics.get(key);
    metrics.callCount += 1;
    metrics.totalTime += responseTime;
    metrics.avgTime = metrics.totalTime / metrics.callCount;
    
    if (success) {
      metrics.successCount += 1;
    } else {
      metrics.errorCount += 1;
    }

    // Log slow API calls
    if (responseTime > 1000) {
      console.warn(`🐌 Slow API call to ${endpoint}: ${responseTime.toFixed(2)}ms`);
    }

    console.log(`🌐 API ${endpoint}:`, {
      time: `${responseTime.toFixed(2)}ms`,
      avgTime: `${metrics.avgTime.toFixed(2)}ms`,
      success: success ? '✅' : '❌'
    });
  }

  // Monitor image loading performance
  trackImageLoad(imageUrl, startTime) {
    if (!this.isEnabled) return;

    const loadTime = performance.now() - startTime;
    console.log(`🖼️ Image loaded: ${imageUrl.substring(imageUrl.lastIndexOf('/') + 1)} - ${loadTime.toFixed(2)}ms`);

    if (loadTime > 2000) {
      console.warn(`🐌 Slow image load: ${imageUrl} - ${loadTime.toFixed(2)}ms`);
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    if (!this.isEnabled) return null;

    const summary = {};
    for (const [key, metrics] of this.metrics.entries()) {
      summary[key] = { ...metrics };
    }
    return summary;
  }

  // Initialize all monitoring
  initialize() {
    if (!this.isEnabled) return;

    console.log('🚀 Performance Monitor initialized for Marvel Rivals Tournament Platform');
    
    this.measureWebVitals();
    this.monitorLongTasks();
    this.monitorMemoryUsage();

    // Log performance summary on page unload
    window.addEventListener('beforeunload', () => {
      console.log('📊 Final Performance Summary:', this.getPerformanceSummary());
    });
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => performanceMonitor.initialize());
  } else {
    performanceMonitor.initialize();
  }
}

export default performanceMonitor;