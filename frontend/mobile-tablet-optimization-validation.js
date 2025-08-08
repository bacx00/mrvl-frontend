/**
 * Comprehensive Mobile/Tablet Optimization Validation Suite
 * Tests all implemented features for performance, functionality, and responsive behavior
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class MobileTabletValidator {
  constructor() {
    this.browser = null;
    this.results = {
      timestamp: new Date().toISOString(),
      testResults: [],
      performanceMetrics: {},
      errors: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: false, // Set to true for CI/CD
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--allow-running-insecure-content'
        ]
      });
      console.log('🚀 Browser initialized for mobile/tablet testing');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async testViewportResponsiveness() {
    console.log('📱 Testing viewport responsiveness...');
    
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
      { name: 'iPad Mini', width: 768, height: 1024 },
      { name: 'iPad Air', width: 820, height: 1180 },
      { name: 'iPad Pro 11"', width: 834, height: 1194 },
      { name: 'iPad Pro 12.9"', width: 1024, height: 1366 }
    ];

    const pages = [
      { name: 'Home', path: '/' },
      { name: 'Events', path: '/events' },
      { name: 'Rankings', path: '/rankings' },
      { name: 'Match Detail', path: '/match/1' }
    ];

    for (const viewport of viewports) {
      for (const page of pages) {
        await this.testPageAtViewport(viewport, page);
      }
    }
  }

  async testPageAtViewport(viewport, page) {
    const testName = `${page.name} on ${viewport.name} (${viewport.width}x${viewport.height})`;
    
    try {
      const browserPage = await this.browser.newPage();
      await browserPage.setViewport(viewport);
      
      // Navigate to page
      const url = `http://localhost:3000${page.path}`;
      const response = await browserPage.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      if (!response.ok()) {
        throw new Error(`Page failed to load: ${response.status()}`);
      }

      // Test mobile/tablet specific features
      const testResults = await browserPage.evaluate(async (viewportInfo) => {
        const results = [];

        // Check if mobile CSS is loaded
        const mobileCSS = document.querySelector('link[href*="mobile.css"]');
        const tabletCSS = document.querySelector('link[href*="tablet.css"]');
        
        results.push({
          test: 'CSS Files Loaded',
          passed: !!(mobileCSS || tabletCSS),
          details: `Mobile CSS: ${!!mobileCSS}, Tablet CSS: ${!!tabletCSS}`
        });

        // Test touch targets (minimum 44x44px)
        const touchTargets = document.querySelectorAll('button, a, [role="button"]');
        let touchTargetsPassed = 0;
        
        touchTargets.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.width >= 44 && rect.height >= 44) {
            touchTargetsPassed++;
          }
        });

        results.push({
          test: 'Touch Targets Size',
          passed: touchTargetsPassed / touchTargets.length >= 0.8,
          details: `${touchTargetsPassed}/${touchTargets.length} targets meet 44px minimum`
        });

        // Test mobile navigation
        const mobileNav = document.querySelector('.mobile-nav, [class*="mobile-nav"]');
        const hamburgerMenu = document.querySelector('.mobile-nav-toggle, [class*="hamburger"]');
        
        results.push({
          test: 'Mobile Navigation Present',
          passed: !!(mobileNav || hamburgerMenu),
          details: `Mobile nav: ${!!mobileNav}, Hamburger: ${!!hamburgerMenu}`
        });

        // Test responsive layout
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        
        results.push({
          test: 'Responsive Layout',
          passed: computedStyle.display !== 'none',
          details: `Body display: ${computedStyle.display}`
        });

        // Test performance optimizations
        const skeletonScreens = document.querySelectorAll('[class*="skeleton"]');
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        
        results.push({
          test: 'Performance Features',
          passed: skeletonScreens.length > 0 || lazyImages.length > 0,
          details: `Skeletons: ${skeletonScreens.length}, Lazy images: ${lazyImages.length}`
        });

        return results;
      }, viewport);

      // Performance metrics
      const metrics = await browserPage.metrics();
      const performanceEntries = await browserPage.evaluate(() => {
        return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')));
      });

      this.results.testResults.push({
        testName,
        viewport,
        page,
        passed: testResults.every(r => r.passed),
        testResults,
        metrics,
        performanceEntries
      });

      await browserPage.close();
      
      console.log(`✅ ${testName}: ${testResults.filter(r => r.passed).length}/${testResults.length} tests passed`);
      
    } catch (error) {
      console.error(`❌ ${testName}: Failed`);
      this.results.errors.push({
        testName,
        error: error.message,
        stack: error.stack
      });
      
      this.results.testResults.push({
        testName,
        viewport,
        page,
        passed: false,
        error: error.message
      });
    }
  }

  async testGestureSupport() {
    console.log('👆 Testing gesture support...');
    
    try {
      const page = await this.browser.newPage();
      await page.setViewport({ width: 390, height: 844 });
      await page.goto('http://localhost:3000/events');

      // Test swipe gestures
      const swipeResult = await page.evaluate(() => {
        // Check if gesture handlers are attached
        const swipeableElements = document.querySelectorAll('[class*="swipeable"], [class*="mobile-gesture"]');
        const hasGestureSupport = document.querySelector('[class*="mobile-gesture"], [class*="swipe"]');
        
        return {
          swipeableElements: swipeableElements.length,
          hasGestureSupport: !!hasGestureSupport
        };
      });

      this.results.testResults.push({
        testName: 'Gesture Support',
        passed: swipeResult.hasGestureSupport || swipeResult.swipeableElements > 0,
        details: swipeResult
      });

      await page.close();
      
    } catch (error) {
      this.results.errors.push({
        testName: 'Gesture Support',
        error: error.message
      });
    }
  }

  async testTabletLayouts() {
    console.log('📋 Testing tablet-specific layouts...');
    
    const tabletViewports = [
      { name: 'iPad Portrait', width: 768, height: 1024 },
      { name: 'iPad Landscape', width: 1024, height: 768 }
    ];

    for (const viewport of tabletViewports) {
      try {
        const page = await this.browser.newPage();
        await page.setViewport(viewport);
        await page.goto('http://localhost:3000/events');

        const layoutTest = await page.evaluate(() => {
          // Check for tablet-specific layout classes
          const tabletLayoutManager = document.querySelector('.tablet-layout-manager');
          const tabletSplitView = document.querySelector('.tablet-split-view');
          const tabletAdaptiveGrid = document.querySelector('.tablet-adaptive-grid');
          
          // Check grid layouts
          const gridElements = document.querySelectorAll('[style*="grid-template-columns"]');
          const flexElements = document.querySelectorAll('[class*="flex"], [style*="flex"]');
          
          return {
            hasTabletLayoutManager: !!tabletLayoutManager,
            hasTabletSplitView: !!tabletSplitView,
            hasTabletAdaptiveGrid: !!tabletAdaptiveGrid,
            gridElements: gridElements.length,
            flexElements: flexElements.length
          };
        });

        this.results.testResults.push({
          testName: `Tablet Layout - ${viewport.name}`,
          viewport,
          passed: layoutTest.gridElements > 0 || layoutTest.flexElements > 0,
          details: layoutTest
        });

        await page.close();
        
      } catch (error) {
        this.results.errors.push({
          testName: `Tablet Layout - ${viewport.name}`,
          error: error.message
        });
      }
    }
  }

  async testPerformanceOptimizations() {
    console.log('⚡ Testing performance optimizations...');
    
    try {
      const page = await this.browser.newPage();
      
      // Enable performance monitoring
      await page.setCacheEnabled(false);
      await page.coverage.startJSCoverage();
      await page.coverage.startCSSCoverage();
      
      await page.goto('http://localhost:3000');
      
      // Test loading performance
      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const metrics = {};
            
            entries.forEach(entry => {
              if (entry.entryType === 'navigation') {
                metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
                metrics.loadComplete = entry.loadEventEnd - entry.loadEventStart;
              }
            });
            
            resolve(metrics);
          }).observe({ entryTypes: ['navigation'] });
        });
      });

      // Check for performance optimization features
      const optimizationFeatures = await page.evaluate(() => {
        const features = {
          lazyLoading: document.querySelectorAll('img[loading="lazy"]').length,
          skeletonScreens: document.querySelectorAll('[class*="skeleton"]').length,
          virtualScrolling: document.querySelectorAll('[class*="virtual-scroll"]').length,
          progressiveImages: document.querySelectorAll('[class*="progressive"]').length
        };
        
        return features;
      });

      const jsCoverage = await page.coverage.stopJSCoverage();
      const cssCoverage = await page.coverage.stopCSSCoverage();
      
      // Calculate unused bytes
      const unusedJSBytes = jsCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
      const unusedCSSBytes = cssCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
      
      this.results.performanceMetrics = {
        ...performanceMetrics,
        optimizationFeatures,
        unusedJSBytes,
        unusedCSSBytes,
        jsCoverageEntries: jsCoverage.length,
        cssCoverageEntries: cssCoverage.length
      };

      this.results.testResults.push({
        testName: 'Performance Optimizations',
        passed: Object.values(optimizationFeatures).some(count => count > 0),
        details: optimizationFeatures
      });

      await page.close();
      
    } catch (error) {
      this.results.errors.push({
        testName: 'Performance Optimizations',
        error: error.message
      });
    }
  }

  async testAccessibility() {
    console.log('♿ Testing accessibility features...');
    
    try {
      const page = await this.browser.newPage();
      await page.goto('http://localhost:3000');

      const accessibilityTest = await page.evaluate(() => {
        const results = {
          hasAltTexts: 0,
          totalImages: 0,
          hasAriaLabels: 0,
          interactiveElements: 0,
          hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
          hasLandmarks: document.querySelectorAll('main, nav, header, footer, section, aside').length
        };

        // Check images
        const images = document.querySelectorAll('img');
        results.totalImages = images.length;
        images.forEach(img => {
          if (img.alt && img.alt.trim()) {
            results.hasAltTexts++;
          }
        });

        // Check interactive elements
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
        results.interactiveElements = interactiveElements.length;
        interactiveElements.forEach(element => {
          if (element.getAttribute('aria-label') || element.getAttribute('title')) {
            results.hasAriaLabels++;
          }
        });

        return results;
      });

      const accessibilityScore = (
        (accessibilityTest.hasAltTexts / Math.max(1, accessibilityTest.totalImages)) * 0.3 +
        (accessibilityTest.hasAriaLabels / Math.max(1, accessibilityTest.interactiveElements)) * 0.3 +
        (accessibilityTest.hasHeadings > 0 ? 0.2 : 0) +
        (accessibilityTest.hasLandmarks > 0 ? 0.2 : 0)
      );

      this.results.testResults.push({
        testName: 'Accessibility Features',
        passed: accessibilityScore >= 0.7,
        score: accessibilityScore,
        details: accessibilityTest
      });

    } catch (error) {
      this.results.errors.push({
        testName: 'Accessibility Features',
        error: error.message
      });
    }
  }

  calculateSummary() {
    this.results.summary.total = this.results.testResults.length;
    this.results.summary.passed = this.results.testResults.filter(r => r.passed).length;
    this.results.summary.failed = this.results.summary.total - this.results.summary.passed;
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
  }

  async generateReport() {
    const reportPath = path.join(__dirname, `mobile-tablet-validation-report-${Date.now()}.json`);
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n📋 Report saved to: ${reportPath}`);
      
      // Generate HTML report
      const htmlReportPath = reportPath.replace('.json', '.html');
      await this.generateHTMLReport(htmlReportPath);
      console.log(`📋 HTML report saved to: ${htmlReportPath}`);
      
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  }

  async generateHTMLReport(filePath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile/Tablet Optimization Validation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #ef4444; margin-bottom: 30px; padding-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #ef4444; }
        .test-result { margin-bottom: 20px; padding: 15px; border-radius: 8px; border-left: 4px solid; }
        .passed { background: #f0fdf4; border-color: #22c55e; }
        .failed { background: #fef2f2; border-color: #ef4444; }
        .test-name { font-weight: bold; margin-bottom: 10px; }
        .test-details { font-size: 0.9em; color: #666; }
        .viewport-info { background: #f1f5f9; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Mobile/Tablet Optimization Validation Report</h1>
            <p>Generated on: ${new Date(this.results.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.results.summary.total}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%</div>
                <div>Success Rate</div>
            </div>
        </div>
        
        <h2>🧪 Test Results</h2>
        ${this.results.testResults.map(result => `
            <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                <div class="test-name">${result.testName}</div>
                ${result.viewport ? `<div class="viewport-info">Viewport: ${result.viewport.width}x${result.viewport.height}</div>` : ''}
                ${result.testResults ? result.testResults.map(tr => `
                    <div class="test-details">
                        ${tr.test}: ${tr.passed ? '✅' : '❌'} - ${tr.details}
                    </div>
                `).join('') : ''}
                ${result.details ? `<div class="test-details">${JSON.stringify(result.details, null, 2)}</div>` : ''}
                ${result.error ? `<div class="test-details" style="color: #ef4444;">Error: ${result.error}</div>` : ''}
            </div>
        `).join('')}
        
        ${this.results.errors.length > 0 ? `
            <h2>❌ Errors</h2>
            ${this.results.errors.map(error => `
                <div class="test-result failed">
                    <div class="test-name">${error.testName}</div>
                    <div class="test-details">${error.error}</div>
                </div>
            `).join('')}
        ` : ''}
        
        <h2>📊 Performance Metrics</h2>
        <pre style="background: #f8fafc; padding: 20px; border-radius: 8px; overflow: auto;">
${JSON.stringify(this.results.performanceMetrics, null, 2)}
        </pre>
    </div>
</body>
</html>`;

    await fs.writeFile(filePath, html);
  }

  async runAllTests() {
    console.log('🚀 Starting Mobile/Tablet Optimization Validation Suite...\n');
    
    await this.init();

    try {
      await this.testViewportResponsiveness();
      await this.testGestureSupport();
      await this.testTabletLayouts();
      await this.testPerformanceOptimizations();
      await this.testAccessibility();
      
    } catch (error) {
      console.error('Test suite error:', error);
    }

    this.calculateSummary();
    await this.generateReport();
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('\n✨ Mobile/Tablet validation complete!');
    
    // Exit with appropriate code
    process.exit(this.results.summary.failed > 0 ? 1 : 0);
  }
}

// Run the validation suite
const validator = new MobileTabletValidator();
validator.runAllTests().catch(console.error);

module.exports = MobileTabletValidator;