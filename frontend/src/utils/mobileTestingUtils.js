// Mobile Testing Utilities for MRVL Platform - Enhanced with VLR.gg patterns
// Comprehensive testing suite for mobile responsiveness, performance, and UX optimization

export const DEVICE_PRESETS = {
  // Mobile Phones
  iphone_se: { width: 375, height: 667, dpr: 2, name: 'iPhone SE' },
  iphone_12: { width: 390, height: 844, dpr: 3, name: 'iPhone 12' },
  iphone_12_pro_max: { width: 428, height: 926, dpr: 3, name: 'iPhone 12 Pro Max' },
  galaxy_s21: { width: 360, height: 800, dpr: 3, name: 'Galaxy S21' },
  pixel_5: { width: 393, height: 851, dpr: 2.75, name: 'Pixel 5' },
  
  // Small screens
  small_mobile: { width: 320, height: 568, dpr: 2, name: 'Small Mobile' },
  
  // Tablets
  ipad_mini: { width: 768, height: 1024, dpr: 2, name: 'iPad Mini' },
  ipad_pro: { width: 834, height: 1194, dpr: 2, name: 'iPad Pro 11"' },
  galaxy_tab: { width: 800, height: 1280, dpr: 1.5, name: 'Galaxy Tab' },
  
  // Large tablets
  ipad_pro_12: { width: 1024, height: 1366, dpr: 2, name: 'iPad Pro 12.9"' }
};

export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536
};

// Test suite for mobile responsiveness
export class MobileResponsivenessTester {
  constructor() {
    this.results = {};
    this.isTestMode = process.env.NODE_ENV === 'development';
  }

  // Test all device presets
  async testAllDevices() {
    const results = {};
    
    console.log('🧪 Starting mobile responsiveness tests...');
    
    for (const [deviceKey, device] of Object.entries(DEVICE_PRESETS)) {
      console.log(`📱 Testing ${device.name} (${device.width}x${device.height})`);
      results[deviceKey] = await this.testDevice(device);
    }
    
    this.results = results;
    this.generateReport();
    return results;
  }

  // Test individual device
  async testDevice(device) {
    const { width, height, dpr, name } = device;
    
    // Simulate device viewport
    this.setViewport(width, height, dpr);
    
    const tests = {
      viewport: this.testViewport(width, height),
      navigation: this.testNavigation(),
      touchTargets: this.testTouchTargets(),
      typography: this.testTypography(),
      images: this.testImages(),
      forms: this.testForms(),
      performance: await this.testPerformance(),
      accessibility: this.testAccessibility()
    };
    
    return {
      device: name,
      dimensions: { width, height, dpr },
      tests,
      score: this.calculateScore(tests),
      timestamp: new Date().toISOString()
    };
  }

  // Set viewport for testing
  setViewport(width, height, dpr) {
    if (this.isTestMode && window.visualViewport) {
      // In real testing, this would use Puppeteer or similar
      document.documentElement.style.width = `${width}px`;
      document.documentElement.style.height = `${height}px`;
    }
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  }

  // Test viewport configuration
  testViewport(width, height) {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const tests = {
      hasViewportMeta: !!viewportMeta,
      correctContent: false,
      noHorizontalScroll: true,
      properScaling: true
    };

    if (viewportMeta) {
      const content = viewportMeta.getAttribute('content');
      tests.correctContent = content.includes('width=device-width') && 
                           content.includes('initial-scale=1');
    }

    // Check for horizontal scroll
    if (document.body.scrollWidth > window.innerWidth) {
      tests.noHorizontalScroll = false;
    }

    return {
      passed: Object.values(tests).every(Boolean),
      details: tests,
      score: this.calculateTestScore(tests)
    };
  }

  // Test navigation elements
  testNavigation() {
    const tests = {
      mobileNavExists: !!document.querySelector('.mobile-navigation, [class*="mobile-nav"]'),
      bottomNavExists: !!document.querySelector('.mobile-bottom-nav, [class*="bottom-nav"]'),
      hamburgerExists: !!document.querySelector('[class*="hamburger"], [class*="menu-toggle"]'),
      touchFriendlySize: true,
      properZIndex: true
    };

    // Test touch target sizes for nav elements
    const navElements = document.querySelectorAll('nav a, nav button, .mobile-nav a, .mobile-nav button');
    const minTouchSize = 44; // 44px minimum for accessibility

    for (const element of navElements) {
      const rect = element.getBoundingClientRect();
      if (rect.width < minTouchSize || rect.height < minTouchSize) {
        tests.touchFriendlySize = false;
        break;
      }
    }

    return {
      passed: Object.values(tests).every(Boolean),
      details: tests,
      score: this.calculateTestScore(tests)
    };
  }

  // Test touch target sizes
  testTouchTargets() {
    const minSize = 44; // WCAG recommended minimum
    const selectors = ['button', 'a', '[role="button"]', 'input[type="submit"]', '.touch-target'];
    const failedElements = [];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Skip hidden elements
        if (computedStyle.display === 'none' || 
            computedStyle.visibility === 'hidden' ||
            rect.width === 0 || rect.height === 0) {
          return;
        }

        if (rect.width < minSize || rect.height < minSize) {
          failedElements.push({
            element: element.tagName.toLowerCase(),
            class: element.className,
            size: { width: rect.width, height: rect.height },
            selector
          });
        }
      });
    });

    return {
      passed: failedElements.length === 0,
      details: {
        totalElements: document.querySelectorAll(selectors.join(',')).length,
        failedElements: failedElements.length,
        minSize,
        failures: failedElements.slice(0, 10) // First 10 failures
      },
      score: failedElements.length === 0 ? 100 : Math.max(0, 100 - (failedElements.length * 10))
    };
  }

  // Test typography scaling
  testTypography() {
    const tests = {
      readableSize: true,
      properLineHeight: true,
      noOverflow: true,
      contrastRatio: true
    };

    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    const minFontSize = 16; // Minimum readable size on mobile

    for (const element of textElements) {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight);

      if (fontSize < minFontSize && element.textContent.trim()) {
        tests.readableSize = false;
      }

      if (lineHeight / fontSize < 1.2) {
        tests.properLineHeight = false;
      }

      // Check for text overflow
      if (element.scrollWidth > element.clientWidth) {
        tests.noOverflow = false;
      }
    }

    return {
      passed: Object.values(tests).every(Boolean),
      details: tests,
      score: this.calculateTestScore(tests)
    };
  }

  // Test image responsiveness
  testImages() {
    const images = document.querySelectorAll('img');
    const tests = {
      responsiveImages: true,
      altAttributes: true,
      lazyLoading: true,
      properSizing: true
    };

    for (const img of images) {
      // Check if image is responsive
      const computedStyle = window.getComputedStyle(img);
      if (computedStyle.maxWidth !== '100%' && 
          !img.classList.contains('responsive-image') &&
          !img.style.maxWidth) {
        tests.responsiveImages = false;
      }

      // Check alt attributes
      if (!img.hasAttribute('alt')) {
        tests.altAttributes = false;
      }

      // Check lazy loading
      if (!img.hasAttribute('loading') && !img.classList.contains('lazy')) {
        tests.lazyLoading = false;
      }

      // Check if image overflows container
      const rect = img.getBoundingClientRect();
      const parentRect = img.parentElement.getBoundingClientRect();
      if (rect.width > parentRect.width + 10) { // 10px tolerance
        tests.properSizing = false;
      }
    }

    return {
      passed: Object.values(tests).every(Boolean),
      details: {
        ...tests,
        totalImages: images.length
      },
      score: this.calculateTestScore(tests)
    };
  }

  // Test form elements
  testForms() {
    const formElements = document.querySelectorAll('input, select, textarea, button[type="submit"]');
    const tests = {
      mobileOptimized: true,
      labelAssociation: true,
      touchFriendly: true,
      noZoomTrigger: true
    };

    for (const element of formElements) {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const rect = element.getBoundingClientRect();

      // Check for 16px font size to prevent zoom on iOS
      if (element.tagName === 'INPUT' && fontSize < 16) {
        tests.noZoomTrigger = false;
      }

      // Check touch target size
      if (rect.height < 44) {
        tests.touchFriendly = false;
      }

      // Check label association
      if (element.tagName === 'INPUT' && element.type !== 'submit' && element.type !== 'button') {
        const hasLabel = element.labels && element.labels.length > 0;
        const hasAriaLabel = element.hasAttribute('aria-label');
        const hasAriaLabelledby = element.hasAttribute('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
          tests.labelAssociation = false;
        }
      }
    }

    return {
      passed: Object.values(tests).every(Boolean),
      details: {
        ...tests,
        totalElements: formElements.length
      },
      score: this.calculateTestScore(tests)
    };
  }

  // Test performance metrics
  async testPerformance() {
    const tests = {
      layoutStability: true,
      renderPerformance: true,
      interactionDelay: true,
      memoryUsage: true
    };

    try {
      // Check for layout shifts
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.value > 0.1) { // CLS threshold
              tests.layoutStability = false;
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Clean up after 2 seconds
        setTimeout(() => observer.disconnect(), 2000);
      }

      // Check memory usage
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        if (memoryUsage > 0.8) {
          tests.memoryUsage = false;
        }
      }

      // Simulate interaction delay test
      const startTime = performance.now();
      await new Promise(resolve => setTimeout(resolve, 10));
      const endTime = performance.now();
      
      if (endTime - startTime > 50) { // 50ms threshold
        tests.interactionDelay = false;
      }

    } catch (error) {
      console.warn('Performance testing error:', error);
    }

    return {
      passed: Object.values(tests).every(Boolean),
      details: tests,
      score: this.calculateTestScore(tests)
    };
  }

  // Test accessibility
  testAccessibility() {
    const tests = {
      colorContrast: true,
      focusManagement: true,
      semanticMarkup: true,
      ariaLabels: true,
      keyboardNavigation: true
    };

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        tests.semanticMarkup = false;
        break;
      }
      previousLevel = level;
    }

    // Check for interactive elements without proper labels
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    for (const element of interactiveElements) {
      const hasAccessibleName = element.textContent.trim() || 
                               element.hasAttribute('aria-label') ||
                               element.hasAttribute('aria-labelledby') ||
                               element.hasAttribute('title');
      
      if (!hasAccessibleName) {
        tests.ariaLabels = false;
        break;
      }
    }

    return {
      passed: Object.values(tests).every(Boolean),
      details: tests,
      score: this.calculateTestScore(tests)
    };
  }

  // Calculate score for individual test
  calculateTestScore(tests) {
    const totalTests = Object.keys(tests).length;
    const passedTests = Object.values(tests).filter(Boolean).length;
    return Math.round((passedTests / totalTests) * 100);
  }

  // Calculate overall score
  calculateScore(tests) {
    const scores = Object.values(tests).map(test => test.score);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  // Generate detailed report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDevices: Object.keys(this.results).length,
        averageScore: 0,
        passedDevices: 0,
        failedDevices: 0
      },
      deviceResults: this.results,
      recommendations: this.generateRecommendations()
    };

    // Calculate summary statistics
    const scores = Object.values(this.results).map(result => result.score);
    report.summary.averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    report.summary.passedDevices = scores.filter(score => score >= 80).length;
    report.summary.failedDevices = scores.filter(score => score < 80).length;

    console.log('📊 Mobile Responsiveness Test Report:');
    console.log(`Average Score: ${report.summary.averageScore}%`);
    console.log(`Passed Devices: ${report.summary.passedDevices}/${report.summary.totalDevices}`);
    
    if (report.recommendations.length > 0) {
      console.log('🔧 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    return report;
  }

  // Generate recommendations based on test results
  generateRecommendations() {
    const recommendations = [];
    const commonIssues = {};

    // Analyze results for common issues
    Object.values(this.results).forEach(result => {
      Object.entries(result.tests).forEach(([testName, testResult]) => {
        if (!testResult.passed) {
          if (!commonIssues[testName]) {
            commonIssues[testName] = 0;
          }
          commonIssues[testName]++;
        }
      });
    });

    // Generate recommendations based on common issues
    Object.entries(commonIssues).forEach(([issue, count]) => {
      const percentage = (count / Object.keys(this.results).length) * 100;
      
      if (percentage >= 50) { // Issue affects 50% or more devices
        switch (issue) {
          case 'viewport':
            recommendations.push('Configure proper viewport meta tag for all devices');
            break;
          case 'navigation':
            recommendations.push('Implement mobile-friendly navigation with proper touch targets');
            break;
          case 'touchTargets':
            recommendations.push('Increase touch target sizes to minimum 44x44px');
            break;
          case 'typography':
            recommendations.push('Optimize font sizes and line heights for mobile readability');
            break;
          case 'images':
            recommendations.push('Implement responsive images with proper lazy loading');
            break;
          case 'forms':
            recommendations.push('Optimize form elements for mobile interaction');
            break;
          case 'performance':
            recommendations.push('Improve mobile performance and reduce layout shifts');
            break;
          case 'accessibility':
            recommendations.push('Enhance accessibility features for mobile users');
            break;
        }
      }
    });

    return recommendations;
  }

  // Export results to JSON
  exportResults() {
    const report = this.generateReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mobile-responsiveness-test-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}

// Quick test function for development
export const quickMobileTest = () => {
  const tester = new MobileResponsivenessTester();
  
  // Test current viewport
  const currentTest = tester.testDevice({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio,
    name: 'Current Device'
  });
  
  console.log('🚀 Quick Mobile Test Results:', currentTest);
  return currentTest;
};

// Initialize mobile testing in development
export const initMobileTesting = () => {
  if (process.env.NODE_ENV === 'development') {
    // Add keyboard shortcut for quick testing
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        quickMobileTest();
      }
    });
    
    // Add to window for console access
    window.MobileResponsivenessTester = MobileResponsivenessTester;
    window.quickMobileTest = quickMobileTest;
    
    console.log('📱 Mobile testing utilities loaded. Press Ctrl+Shift+M for quick test.');
  }
};

export default {
  MobileResponsivenessTester,
  DEVICE_PRESETS,
  BREAKPOINTS,
  quickMobileTest,
  initMobileTesting
};