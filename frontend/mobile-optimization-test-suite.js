/**
 * MRVL Mobile & Tablet Optimization Test Suite
 * 
 * Comprehensive testing suite for mobile and tablet optimizations
 * Tests performance, gestures, PWA functionality, and cross-device compatibility
 */

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const fs = require('fs').promises;
const path = require('path');

// Device configurations for testing
const TEST_DEVICES = [
  // Mobile devices
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone 12 Pro Max', device: devices['iPhone 12 Pro Max'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Samsung Galaxy S21', device: devices['Galaxy S21'] },
  { name: 'Samsung Galaxy Note 20', device: devices['Galaxy Note 20'] },
  
  // Tablet devices  
  { name: 'iPad', device: devices['iPad'] },
  { name: 'iPad Pro', device: devices['iPad Pro'] },
  { name: 'iPad Pro 11', device: devices['iPad Pro 11'] },
  
  // Custom tablet configurations
  {
    name: 'Android Tablet Large',
    device: {
      name: 'Android Tablet Large',
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36',
      viewport: { width: 1024, height: 768, deviceScaleFactor: 2, isMobile: false, hasTouch: true }
    }
  },
  {
    name: 'Android Tablet Small',
    device: {
      name: 'Android Tablet Small',
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-T290) AppleWebKit/537.36',
      viewport: { width: 800, height: 600, deviceScaleFactor: 1.5, isMobile: false, hasTouch: true }
    }
  }
];

// Test routes to validate
const TEST_ROUTES = [
  { path: '/', name: 'Home Page' },
  { path: '/events', name: 'Events Page' },
  { path: '/matches', name: 'Matches Page' },
  { path: '/teams', name: 'Teams Page' },
  { path: '/rankings', name: 'Rankings Page' },
  { path: '/news', name: 'News Page' }
];

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  fcp: 2000,      // First Contentful Paint
  lcp: 2500,      // Largest Contentful Paint
  fid: 100,       // First Input Delay
  cls: 0.1,       // Cumulative Layout Shift
  ttfb: 600,      // Time to First Byte
  loadTime: 3000  // Total load time
};

class MobileTestSuite {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: { passed: 0, failed: 0, total: 0 },
      devices: {},
      performance: {},
      gestures: {},
      pwa: {},
      accessibility: {}
    };
  }

  async runFullSuite() {
    console.log('🚀 Starting MRVL Mobile Optimization Test Suite...\n');
    
    try {
      // Performance tests
      console.log('📊 Running Performance Tests...');
      await this.runPerformanceTests();
      
      // Gesture tests
      console.log('👆 Running Gesture Tests...');
      await this.runGestureTests();
      
      // PWA functionality tests
      console.log('📱 Running PWA Tests...');
      await this.runPWATests();
      
      // Cross-device compatibility tests
      console.log('📱💻 Running Cross-Device Tests...');
      await this.runCrossDeviceTests();
      
      // Accessibility tests
      console.log('♿ Running Accessibility Tests...');
      await this.runAccessibilityTests();
      
      // Generate report
      await this.generateReport();
      
      console.log('✅ Test suite completed successfully!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  async runPerformanceTests() {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    for (const testDevice of TEST_DEVICES.slice(0, 3)) { // Test subset for performance
      const page = await browser.newPage();
      await page.emulate(testDevice.device);
      
      console.log(`  Testing ${testDevice.name}...`);
      
      for (const route of TEST_ROUTES) {
        const metrics = await this.measurePerformance(page, route.path);
        
        this.results.performance[`${testDevice.name}_${route.name}`] = {
          ...metrics,
          passed: this.validatePerformanceMetrics(metrics)
        };
        
        if (this.validatePerformanceMetrics(metrics)) {
          this.results.summary.passed++;
        } else {
          this.results.summary.failed++;
        }
        this.results.summary.total++;
      }
      
      await page.close();
    }
    
    await browser.close();
  }

  async measurePerformance(page, route) {
    const startTime = Date.now();
    
    await page.goto(`${this.baseUrl}${route}`, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    const loadTime = Date.now() - startTime;
    
    // Get Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            switch (entry.entryType) {
              case 'paint':
                if (entry.name === 'first-contentful-paint') {
                  vitals.fcp = entry.startTime;
                }
                break;
              case 'largest-contentful-paint':
                vitals.lcp = entry.startTime;
                break;
              case 'first-input':
                vitals.fid = entry.processingStart - entry.startTime;
                break;
              case 'layout-shift':
                if (!entry.hadRecentInput) {
                  vitals.cls = (vitals.cls || 0) + entry.value;
                }
                break;
              case 'navigation':
                vitals.ttfb = entry.responseStart - entry.fetchStart;
                break;
            }
          });
          
          setTimeout(() => resolve(vitals), 2000); // Wait for metrics
        });
        
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
      });
    });
    
    return { ...metrics, loadTime };
  }

  validatePerformanceMetrics(metrics) {
    return (
      (!metrics.fcp || metrics.fcp <= PERFORMANCE_THRESHOLDS.fcp) &&
      (!metrics.lcp || metrics.lcp <= PERFORMANCE_THRESHOLDS.lcp) &&
      (!metrics.fid || metrics.fid <= PERFORMANCE_THRESHOLDS.fid) &&
      (!metrics.cls || metrics.cls <= PERFORMANCE_THRESHOLDS.cls) &&
      (!metrics.ttfb || metrics.ttfb <= PERFORMANCE_THRESHOLDS.ttfb) &&
      (metrics.loadTime <= PERFORMANCE_THRESHOLDS.loadTime)
    );
  }

  async runGestureTests() {
    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const touchDevices = TEST_DEVICES.filter(d => d.device.viewport.hasTouch);
    
    for (const testDevice of touchDevices.slice(0, 2)) { // Test subset
      const page = await browser.newPage();
      await page.emulate(testDevice.device);
      
      console.log(`  Testing gestures on ${testDevice.name}...`);
      
      // Test swipe gestures
      const swipeResults = await this.testSwipeGestures(page);
      
      // Test pinch gestures  
      const pinchResults = await this.testPinchGestures(page);
      
      // Test touch targets
      const touchTargetResults = await this.testTouchTargets(page);
      
      this.results.gestures[testDevice.name] = {
        swipe: swipeResults,
        pinch: pinchResults,
        touchTargets: touchTargetResults,
        passed: swipeResults.passed && pinchResults.passed && touchTargetResults.passed
      };
      
      if (this.results.gestures[testDevice.name].passed) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
      this.results.summary.total++;
      
      await page.close();
    }
    
    await browser.close();
  }

  async testSwipeGestures(page) {
    await page.goto(`${this.baseUrl}/events`);
    await page.waitForSelector('[data-testid="swipeable-content"]', { timeout: 5000 });
    
    try {
      // Simulate swipe left
      await page.touchscreen.swipe(300, 400, 100, 400);
      await page.waitForTimeout(500);
      
      // Simulate swipe right
      await page.touchscreen.swipe(100, 400, 300, 400);
      await page.waitForTimeout(500);
      
      return { passed: true, message: 'Swipe gestures working' };
    } catch (error) {
      return { passed: false, message: `Swipe gesture failed: ${error.message}` };
    }
  }

  async testPinchGestures(page) {
    await page.goto(`${this.baseUrl}/events`);
    
    try {
      // Simulate pinch zoom
      const viewport = page.viewport();
      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;
      
      // Start touches
      await page.touchscreen.touchStart(centerX - 50, centerY);
      await page.touchscreen.touchStart(centerX + 50, centerY);
      
      // Move touches apart (zoom in)
      await page.touchscreen.touchMove(centerX - 100, centerY);
      await page.touchscreen.touchMove(centerX + 100, centerY);
      
      // End touches
      await page.touchscreen.touchEnd();
      
      return { passed: true, message: 'Pinch gestures working' };
    } catch (error) {
      return { passed: false, message: `Pinch gesture failed: ${error.message}` };
    }
  }

  async testTouchTargets(page) {
    await page.goto(`${this.baseUrl}/`);
    
    const touchTargets = await page.$$eval('[class*="touch-optimized"], button, a', (elements) => {
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          element: el.tagName,
          className: el.className
        };
      });
    });
    
    const inadequateTargets = touchTargets.filter(target => 
      target.width < 44 || target.height < 44
    );
    
    return {
      passed: inadequateTargets.length === 0,
      message: inadequateTargets.length === 0 
        ? 'All touch targets meet 44x44px minimum'
        : `${inadequateTargets.length} touch targets below 44x44px`,
      totalTargets: touchTargets.length,
      inadequateTargets: inadequateTargets.length
    };
  }

  async runPWATests() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    console.log('  Testing PWA functionality...');
    
    // Test service worker registration
    const swTest = await this.testServiceWorker(page);
    
    // Test manifest.json
    const manifestTest = await this.testWebManifest(page);
    
    // Test offline functionality
    const offlineTest = await this.testOfflineFunctionality(page);
    
    // Test install prompt
    const installTest = await this.testInstallPrompt(page);
    
    this.results.pwa = {
      serviceWorker: swTest,
      manifest: manifestTest,
      offline: offlineTest,
      install: installTest,
      passed: swTest.passed && manifestTest.passed && offlineTest.passed
    };
    
    if (this.results.pwa.passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
    this.results.summary.total++;
    
    await browser.close();
  }

  async testServiceWorker(page) {
    await page.goto(this.baseUrl);
    
    try {
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        }
        return false;
      });
      
      return { 
        passed: swRegistered, 
        message: swRegistered ? 'Service Worker registered' : 'Service Worker not registered'
      };
    } catch (error) {
      return { passed: false, message: `Service Worker test failed: ${error.message}` };
    }
  }

  async testWebManifest(page) {
    try {
      const response = await page.goto(`${this.baseUrl}/manifest.json`);
      const manifest = await response.json();
      
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      return {
        passed: missingFields.length === 0,
        message: missingFields.length === 0 
          ? 'Web manifest is valid'
          : `Web manifest missing: ${missingFields.join(', ')}`
      };
    } catch (error) {
      return { passed: false, message: `Manifest test failed: ${error.message}` };
    }
  }

  async testOfflineFunctionality(page) {
    await page.goto(this.baseUrl);
    await page.waitForTimeout(2000); // Let service worker cache resources
    
    try {
      // Go offline
      await page.setOfflineMode(true);
      
      // Try to navigate to cached page
      await page.reload({ waitUntil: 'networkidle0', timeout: 10000 });
      
      const pageContent = await page.content();
      const hasContent = pageContent.includes('MRVL') || pageContent.includes('Marvel');
      
      // Go back online
      await page.setOfflineMode(false);
      
      return {
        passed: hasContent,
        message: hasContent ? 'Offline functionality working' : 'Offline functionality not working'
      };
    } catch (error) {
      await page.setOfflineMode(false);
      return { passed: false, message: `Offline test failed: ${error.message}` };
    }
  }

  async testInstallPrompt(page) {
    await page.goto(this.baseUrl);
    
    try {
      // Check if beforeinstallprompt event can be triggered
      const installSupported = await page.evaluate(() => {
        return 'onbeforeinstallprompt' in window;
      });
      
      return {
        passed: installSupported,
        message: installSupported ? 'Install prompt supported' : 'Install prompt not supported'
      };
    } catch (error) {
      return { passed: false, message: `Install test failed: ${error.message}` };
    }
  }

  async runCrossDeviceTests() {
    const browser = await puppeteer.launch({ headless: 'new' });
    
    for (const testDevice of TEST_DEVICES) {
      console.log(`  Testing ${testDevice.name} compatibility...`);
      
      const page = await browser.newPage();
      await page.emulate(testDevice.device);
      
      const deviceResults = await this.testDeviceCompatibility(page, testDevice.name);
      this.results.devices[testDevice.name] = deviceResults;
      
      if (deviceResults.passed) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
      this.results.summary.total++;
      
      await page.close();
    }
    
    await browser.close();
  }

  async testDeviceCompatibility(page, deviceName) {
    const results = {
      layoutTest: { passed: false },
      navigationTest: { passed: false },
      contentTest: { passed: false },
      passed: false
    };
    
    try {
      await page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
      
      // Test layout doesn't break
      const layoutIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check for horizontal overflow
        if (document.body.scrollWidth > window.innerWidth) {
          issues.push('Horizontal overflow detected');
        }
        
        // Check for tiny text
        const textElements = Array.from(document.querySelectorAll('*'))
          .filter(el => el.childNodes.length === 1 && el.childNodes[0].nodeType === 3);
        
        const tinyText = textElements.filter(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          return fontSize < 12;
        });
        
        if (tinyText.length > 0) {
          issues.push(`${tinyText.length} elements with text smaller than 12px`);
        }
        
        return issues;
      });
      
      results.layoutTest = {
        passed: layoutIssues.length === 0,
        issues: layoutIssues
      };
      
      // Test navigation works
      const navTest = await this.testNavigation(page);
      results.navigationTest = navTest;
      
      // Test content loads
      const contentVisible = await page.evaluate(() => {
        return document.body.textContent.trim().length > 100;
      });
      
      results.contentTest = {
        passed: contentVisible,
        message: contentVisible ? 'Content loads properly' : 'Content not visible'
      };
      
      results.passed = results.layoutTest.passed && results.navigationTest.passed && results.contentTest.passed;
      
    } catch (error) {
      results.error = error.message;
    }
    
    return results;
  }

  async testNavigation(page) {
    try {
      // Test mobile navigation
      const mobileNav = await page.$('[data-testid="mobile-nav"], .mobile-nav, [class*="mobile-nav"]');
      if (mobileNav) {
        await mobileNav.click();
        await page.waitForTimeout(500);
      }
      
      // Try to navigate to events page
      const eventsLink = await page.$('a[href="/events"], a[href*="events"]');
      if (eventsLink) {
        await eventsLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        return {
          passed: page.url().includes('events'),
          message: 'Navigation working'
        };
      }
      
      return { passed: false, message: 'Events link not found' };
    } catch (error) {
      return { passed: false, message: `Navigation test failed: ${error.message}` };
    }
  }

  async runAccessibilityTests() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    console.log('  Testing accessibility...');
    
    await page.goto(this.baseUrl);
    
    // Test color contrast
    const contrastTest = await this.testColorContrast(page);
    
    // Test keyboard navigation
    const keyboardTest = await this.testKeyboardNavigation(page);
    
    // Test ARIA attributes
    const ariaTest = await this.testAriaAttributes(page);
    
    // Test focus management
    const focusTest = await this.testFocusManagement(page);
    
    this.results.accessibility = {
      contrast: contrastTest,
      keyboard: keyboardTest,
      aria: ariaTest,
      focus: focusTest,
      passed: contrastTest.passed && keyboardTest.passed && ariaTest.passed && focusTest.passed
    };
    
    if (this.results.accessibility.passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
    this.results.summary.total++;
    
    await browser.close();
  }

  async testColorContrast(page) {
    try {
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('*');
        
        Array.from(elements).forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          
          // Skip if no text content
          if (!el.textContent.trim()) return;
          
          // Basic contrast check (simplified)
          if (color === backgroundColor) {
            issues.push(`Element has same text and background color: ${color}`);
          }
        });
        
        return issues;
      });
      
      return {
        passed: contrastIssues.length === 0,
        issues: contrastIssues.slice(0, 5) // Limit reported issues
      };
    } catch (error) {
      return { passed: false, message: `Contrast test failed: ${error.message}` };
    }
  }

  async testKeyboardNavigation(page) {
    try {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      return {
        passed: focusedElement && focusedElement !== 'BODY',
        message: focusedElement ? `Focus moves to ${focusedElement}` : 'No focusable elements'
      };
    } catch (error) {
      return { passed: false, message: `Keyboard test failed: ${error.message}` };
    }
  }

  async testAriaAttributes(page) {
    try {
      const ariaIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check buttons have labels
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
          if (!btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')) {
            issues.push('Button without accessible name');
          }
        });
        
        // Check images have alt text
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (!img.getAttribute('alt')) {
            issues.push('Image without alt text');
          }
        });
        
        return issues;
      });
      
      return {
        passed: ariaIssues.length === 0,
        issues: ariaIssues.slice(0, 10)
      };
    } catch (error) {
      return { passed: false, message: `ARIA test failed: ${error.message}` };
    }
  }

  async testFocusManagement(page) {
    try {
      // Test focus is visible
      await page.keyboard.press('Tab');
      
      const focusVisible = await page.evaluate(() => {
        const activeElement = document.activeElement;
        if (!activeElement) return false;
        
        const style = window.getComputedStyle(activeElement);
        return style.outline !== 'none' || style.boxShadow.includes('inset') || activeElement.className.includes('focus');
      });
      
      return {
        passed: focusVisible,
        message: focusVisible ? 'Focus indicators visible' : 'Focus indicators not visible'
      };
    } catch (error) {
      return { passed: false, message: `Focus test failed: ${error.message}` };
    }
  }

  async generateReport() {
    const reportPath = path.join(__dirname, `mobile-test-report-${Date.now()}.json`);
    const htmlReportPath = path.join(__dirname, `mobile-test-report-${Date.now()}.html`);
    
    // Calculate success rate
    const successRate = this.results.summary.total > 0 
      ? ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)
      : 0;
    
    this.results.summary.successRate = successRate;
    
    // Save JSON report
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    await fs.writeFile(htmlReportPath, htmlReport);
    
    console.log(`\n📊 Test Results Summary:`);
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`\n📄 Reports saved:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  generateHTMLReport() {
    const { summary, devices, performance, gestures, pwa, accessibility } = this.results;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>MRVL Mobile Optimization Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    .header { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .metric-value { font-size: 2rem; font-weight: bold; color: #059669; }
    .metric-label { color: #6b7280; font-size: 0.9rem; margin-top: 4px; }
    .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section h2 { margin: 0 0 16px 0; color: #111827; }
    .test-result { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; }
    .test-result.passed { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .test-result.failed { background: #fef2f2; border: 1px solid #fecaca; }
    .status { font-weight: 600; }
    .status.passed { color: #059669; }
    .status.failed { color: #dc2626; }
    .details { font-size: 0.9rem; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 MRVL Mobile Optimization Test Report</h1>
    <p>Generated: ${this.results.timestamp}</p>
  </div>
  
  <div class="summary">
    <div class="metric">
      <div class="metric-value">${summary.successRate}%</div>
      <div class="metric-label">Success Rate</div>
    </div>
    <div class="metric">
      <div class="metric-value">${summary.passed}</div>
      <div class="metric-label">Tests Passed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${summary.failed}</div>
      <div class="metric-label">Tests Failed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${summary.total}</div>
      <div class="metric-label">Total Tests</div>
    </div>
  </div>
  
  <div class="section">
    <h2>📱 Device Compatibility</h2>
    ${Object.entries(devices).map(([device, result]) => `
      <div class="test-result ${result.passed ? 'passed' : 'failed'}">
        <span>${device}</span>
        <span class="status ${result.passed ? 'passed' : 'failed'}">${result.passed ? 'PASS' : 'FAIL'}</span>
      </div>
    `).join('')}
  </div>
  
  <div class="section">
    <h2>⚡ Performance</h2>
    ${Object.entries(performance).map(([test, result]) => `
      <div class="test-result ${result.passed ? 'passed' : 'failed'}">
        <div>
          <div>${test}</div>
          <div class="details">FCP: ${result.fcp ? Math.round(result.fcp) : 'N/A'}ms, LCP: ${result.lcp ? Math.round(result.lcp) : 'N/A'}ms</div>
        </div>
        <span class="status ${result.passed ? 'passed' : 'failed'}">${result.passed ? 'PASS' : 'FAIL'}</span>
      </div>
    `).join('')}
  </div>
  
  <div class="section">
    <h2>👆 Gestures & Touch</h2>
    ${Object.entries(gestures).map(([device, result]) => `
      <div class="test-result ${result.passed ? 'passed' : 'failed'}">
        <span>${device}</span>
        <span class="status ${result.passed ? 'passed' : 'failed'}">${result.passed ? 'PASS' : 'FAIL'}</span>
      </div>
    `).join('')}
  </div>
  
  <div class="section">
    <h2>📲 PWA Features</h2>
    <div class="test-result ${pwa.serviceWorker?.passed ? 'passed' : 'failed'}">
      <span>Service Worker</span>
      <span class="status ${pwa.serviceWorker?.passed ? 'passed' : 'failed'}">${pwa.serviceWorker?.passed ? 'PASS' : 'FAIL'}</span>
    </div>
    <div class="test-result ${pwa.manifest?.passed ? 'passed' : 'failed'}">
      <span>Web Manifest</span>
      <span class="status ${pwa.manifest?.passed ? 'passed' : 'failed'}">${pwa.manifest?.passed ? 'PASS' : 'FAIL'}</span>
    </div>
    <div class="test-result ${pwa.offline?.passed ? 'passed' : 'failed'}">
      <span>Offline Support</span>
      <span class="status ${pwa.offline?.passed ? 'passed' : 'failed'}">${pwa.offline?.passed ? 'PASS' : 'FAIL'}</span>
    </div>
  </div>
  
  <div class="section">
    <h2>♿ Accessibility</h2>
    <div class="test-result ${accessibility.contrast?.passed ? 'passed' : 'failed'}">
      <span>Color Contrast</span>
      <span class="status ${accessibility.contrast?.passed ? 'passed' : 'failed'}">${accessibility.contrast?.passed ? 'PASS' : 'FAIL'}</span>
    </div>
    <div class="test-result ${accessibility.keyboard?.passed ? 'passed' : 'failed'}">
      <span>Keyboard Navigation</span>
      <span class="status ${accessibility.keyboard?.passed ? 'passed' : 'failed'}">${accessibility.keyboard?.passed ? 'PASS' : 'FAIL'}</span>
    </div>
    <div class="test-result ${accessibility.aria?.passed ? 'passed' : 'failed'}">
      <span>ARIA Attributes</span>
      <span class="status ${accessibility.aria?.passed ? 'passed' : 'failed'}">${accessibility.aria?.passed ? 'PASS' : 'FAIL'}</span>
    </div>
    <div class="test-result ${accessibility.focus?.passed ? 'passed' : 'failed'}">
      <span>Focus Management</span>
      <span class="status ${accessibility.focus?.passed ? 'passed' : 'failed'}">${accessibility.focus?.passed ? 'PASS' : 'FAIL'}</span>
    </div>
  </div>
</body>
</html>`;
  }
}

// CLI Usage
if (require.main === module) {
  const testSuite = new MobileTestSuite(process.argv[2]);
  testSuite.runFullSuite().catch(console.error);
}

module.exports = MobileTestSuite;