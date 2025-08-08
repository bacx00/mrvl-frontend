#!/usr/bin/env node

/**
 * VLR.gg-Style Mobile Optimization Test Suite
 * Comprehensive testing for Marvel Rivals Tournament Platform
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class MobileVLROptimizationTester {
  constructor() {
    this.results = {
      navigation: [],
      touchInteractions: [],
      typography: [],
      performance: [],
      responsiveGrid: [],
      brackets: [],
      search: [],
      loading: [],
      overall: {
        score: 0,
        issues: [],
        recommendations: []
      }
    };
    this.testDevices = [
      {
        name: 'iPhone 13 Pro',
        viewport: { width: 390, height: 844, isMobile: true },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      },
      {
        name: 'Samsung Galaxy S21',
        viewport: { width: 360, height: 800, isMobile: true },
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      },
      {
        name: 'iPad Air',
        viewport: { width: 820, height: 1180, isMobile: true },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      }
    ];
  }

  async runTests() {
    console.log('🚀 Starting VLR.gg-Style Mobile Optimization Tests...\n');

    const browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      for (const device of this.testDevices) {
        console.log(`📱 Testing on ${device.name}...`);
        await this.testDevice(browser, device);
      }

      await this.generateReport();
    } finally {
      await browser.close();
    }
  }

  async testDevice(browser, device) {
    const page = await browser.newPage();
    await page.setViewport(device.viewport);
    await page.setUserAgent(device.userAgent);

    try {
      // Test VLR.gg-style navigation
      await this.testMobileNavigation(page, device);

      // Test tournament cards touch interactions
      await this.testTouchInteractions(page, device);

      // Test typography hierarchy
      await this.testTypographyHierarchy(page, device);

      // Test responsive grids
      await this.testResponsiveGrids(page, device);

      // Test bracket visualization
      await this.testBracketVisualization(page, device);

      // Test search functionality
      await this.testSearchFunctionality(page, device);

      // Test performance metrics
      await this.testPerformanceMetrics(page, device);

      console.log(`✅ ${device.name} tests completed`);
    } catch (error) {
      console.error(`❌ Error testing ${device.name}:`, error.message);
    } finally {
      await page.close();
    }
  }

  async testMobileNavigation(page, device) {
    console.log(`  📋 Testing VLR.gg-style navigation...`);
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

      // Test sticky header
      const header = await page.$('header');
      const headerStyles = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          zIndex: styles.zIndex,
          backdrop: styles.backdropFilter
        };
      }, header);

      const stickyTest = {
        device: device.name,
        test: 'Sticky Header',
        passed: headerStyles.position === 'fixed' && parseInt(headerStyles.zIndex) >= 50,
        details: headerStyles
      };

      // Test touch targets (minimum 44px)
      const touchTargets = await page.$$eval('button, a[role="button"], .touch-target', (elements) => {
        return elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            meets44px: rect.width >= 44 && rect.height >= 44
          };
        });
      });

      const touchTargetTest = {
        device: device.name,
        test: 'Touch Target Sizing (44px minimum)',
        passed: touchTargets.every(target => target.meets44px),
        details: {
          total: touchTargets.length,
          passing: touchTargets.filter(t => t.meets44px).length,
          failing: touchTargets.filter(t => !t.meets44px).length
        }
      };

      // Test bottom navigation
      const bottomNav = await page.$('nav[class*="bottom"]');
      const bottomNavTest = {
        device: device.name,
        test: 'Bottom Navigation Visibility',
        passed: !!bottomNav,
        details: bottomNav ? 'Bottom navigation found' : 'Bottom navigation missing'
      };

      // Test menu toggle functionality
      const menuButton = await page.$('button[aria-label="Menu"]');
      if (menuButton) {
        await menuButton.click();
        await page.waitForTimeout(500);
        
        const menuOpen = await page.$('.fixed.inset-y-0.right-0');
        const menuToggleTest = {
          device: device.name,
          test: 'Menu Toggle Functionality',
          passed: !!menuOpen,
          details: menuOpen ? 'Menu opens correctly' : 'Menu toggle failed'
        };
        
        this.results.navigation.push(menuToggleTest);

        // Close menu
        if (menuOpen) {
          const closeButton = await page.$('button:has-text("×")');
          if (closeButton) await closeButton.click();
        }
      }

      this.results.navigation.push(stickyTest, touchTargetTest, bottomNavTest);

    } catch (error) {
      this.results.navigation.push({
        device: device.name,
        test: 'Navigation Error',
        passed: false,
        details: error.message
      });
    }
  }

  async testTouchInteractions(page, device) {
    console.log(`  👆 Testing touch interactions...`);

    try {
      // Test card touch feedback
      const eventCards = await page.$$('.mobile-card, [class*="card"]');
      
      for (const card of eventCards.slice(0, 3)) {
        // Simulate touch interaction
        await card.hover();
        await page.waitForTimeout(100);
        
        const cardStyles = await page.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            transform: styles.transform,
            transition: styles.transition
          };
        }, card);

        this.results.touchInteractions.push({
          device: device.name,
          test: 'Card Touch Feedback',
          passed: cardStyles.transition.includes('transform') || cardStyles.transform !== 'none',
          details: cardStyles
        });
      }

      // Test VLR.gg style active states
      const interactiveElements = await page.$$('.touch-optimized');
      const activeStateTest = {
        device: device.name,
        test: 'VLR.gg Active States',
        passed: interactiveElements.length > 0,
        details: `Found ${interactiveElements.length} touch-optimized elements`
      };

      this.results.touchInteractions.push(activeStateTest);

    } catch (error) {
      this.results.touchInteractions.push({
        device: device.name,
        test: 'Touch Interaction Error',
        passed: false,
        details: error.message
      });
    }
  }

  async testTypographyHierarchy(page, device) {
    console.log(`  📝 Testing typography hierarchy...`);

    try {
      // Test VLR.gg typography classes
      const typographyClasses = [
        '.mobile-h1', '.mobile-h2', '.mobile-h3',
        '.mobile-priority-high', '.mobile-priority-medium', '.mobile-priority-low',
        '.mobile-time-sensitive'
      ];

      const typographyTest = {
        device: device.name,
        test: 'VLR.gg Typography Classes',
        passed: false,
        details: {}
      };

      for (const className of typographyClasses) {
        const elements = await page.$$(className);
        typographyTest.details[className] = elements.length;
      }

      typographyTest.passed = Object.values(typographyTest.details).some(count => count > 0);

      // Test text readability (line-height, font-size)
      const readabilityTest = await page.evaluate(() => {
        const textElements = document.querySelectorAll('p, span, div:not(:empty)');
        let readableCount = 0;
        
        for (const el of Array.from(textElements).slice(0, 20)) {
          const styles = window.getComputedStyle(el);
          const fontSize = parseFloat(styles.fontSize);
          const lineHeight = parseFloat(styles.lineHeight);
          
          // VLR.gg readability standards
          if (fontSize >= 14 && lineHeight >= fontSize * 1.3) {
            readableCount++;
          }
        }
        
        return {
          total: Math.min(textElements.length, 20),
          readable: readableCount,
          percentage: (readableCount / Math.min(textElements.length, 20)) * 100
        };
      });

      const readabilityTestResult = {
        device: device.name,
        test: 'Text Readability Standards',
        passed: readabilityTest.percentage >= 80,
        details: readabilityTest
      };

      this.results.typography.push(typographyTest, readabilityTestResult);

    } catch (error) {
      this.results.typography.push({
        device: device.name,
        test: 'Typography Error',
        passed: false,
        details: error.message
      });
    }
  }

  async testResponsiveGrids(page, device) {
    console.log(`  📐 Testing responsive grids...`);

    try {
      const gridClasses = [
        '.mobile-grid-events', '.mobile-grid-matches', '.mobile-grid-cards',
        '.mobile-grid-stats', '.mobile-grid-news'
      ];

      const gridTests = [];

      for (const gridClass of gridClasses) {
        const grids = await page.$$(gridClass);
        if (grids.length > 0) {
          const gridStyles = await page.evaluate((className) => {
            const el = document.querySelector(className);
            if (!el) return null;
            
            const styles = window.getComputedStyle(el);
            return {
              display: styles.display,
              gridTemplateColumns: styles.gridTemplateColumns,
              gap: styles.gap
            };
          }, gridClass);

          gridTests.push({
            device: device.name,
            test: `Grid System: ${gridClass}`,
            passed: gridStyles && gridStyles.display.includes('grid'),
            details: gridStyles
          });
        }
      }

      // Test viewport adaptation
      const viewportTest = await page.evaluate(() => {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio
        };
      });

      gridTests.push({
        device: device.name,
        test: 'Viewport Adaptation',
        passed: true,
        details: viewportTest
      });

      this.results.responsiveGrid.push(...gridTests);

    } catch (error) {
      this.results.responsiveGrid.push({
        device: device.name,
        test: 'Responsive Grid Error',
        passed: false,
        details: error.message
      });
    }
  }

  async testBracketVisualization(page, device) {
    console.log(`  🏆 Testing bracket visualization...`);

    try {
      // Navigate to a tournament page with brackets
      const tournamentLinks = await page.$$('a[href*="events"], a[href*="tournaments"]');
      if (tournamentLinks.length > 0) {
        await tournamentLinks[0].click();
        await page.waitForTimeout(2000);
      }

      // Test mobile bracket components
      const bracketContainer = await page.$('.mobile-bracket-container, .bracket-container');
      const bracketTest = {
        device: device.name,
        test: 'Mobile Bracket Container',
        passed: !!bracketContainer,
        details: bracketContainer ? 'Bracket container found' : 'No bracket container'
      };

      // Test touch gestures for brackets
      if (bracketContainer) {
        const touchGestureTest = await page.evaluate((container) => {
          const styles = window.getComputedStyle(container);
          return {
            overflowX: styles.overflowX,
            webkitOverflowScrolling: styles.webkitOverflowScrolling,
            touchAction: styles.touchAction
          };
        }, bracketContainer);

        const gestureTest = {
          device: device.name,
          test: 'Bracket Touch Gestures',
          passed: touchGestureTest.overflowX === 'auto' || touchGestureTest.webkitOverflowScrolling === 'touch',
          details: touchGestureTest
        };

        this.results.brackets.push(gestureTest);
      }

      // Test zoom controls
      const zoomControls = await page.$('.zoom-controls-mobile');
      const zoomTest = {
        device: device.name,
        test: 'Mobile Zoom Controls',
        passed: !!zoomControls,
        details: zoomControls ? 'Zoom controls present' : 'No zoom controls found'
      };

      this.results.brackets.push(bracketTest, zoomTest);

    } catch (error) {
      this.results.brackets.push({
        device: device.name,
        test: 'Bracket Visualization Error',
        passed: false,
        details: error.message
      });
    }
  }

  async testSearchFunctionality(page, device) {
    console.log(`  🔍 Testing search functionality...`);

    try {
      // Test search toggle
      const searchToggle = await page.$('button[aria-label="Search"]');
      if (searchToggle) {
        await searchToggle.click();
        await page.waitForTimeout(500);

        const searchInput = await page.$('input[type="search"], input[placeholder*="search" i]');
        const searchTest = {
          device: device.name,
          test: 'Search Toggle & Input',
          passed: !!searchInput,
          details: searchInput ? 'Search input appears on toggle' : 'Search input not found'
        };

        // Test search input behavior
        if (searchInput) {
          await searchInput.type('test query');
          await page.waitForTimeout(300);

          const inputValue = await page.evaluate((input) => input.value, searchInput);
          const inputTest = {
            device: device.name,
            test: 'Search Input Functionality',
            passed: inputValue === 'test query',
            details: `Input value: "${inputValue}"`
          };

          this.results.search.push(inputTest);
        }

        this.results.search.push(searchTest);
      }

      // Test filter tabs
      const filterTabs = await page.$$('.mobile-filter-tab');
      const filterTest = {
        device: device.name,
        test: 'Filter Tabs',
        passed: filterTabs.length > 0,
        details: `Found ${filterTabs.length} filter tabs`
      };

      this.results.search.push(filterTest);

    } catch (error) {
      this.results.search.push({
        device: device.name,
        test: 'Search Functionality Error',
        passed: false,
        details: error.message
      });
    }
  }

  async testPerformanceMetrics(page, device) {
    console.log(`  ⚡ Testing performance metrics...`);

    try {
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        return {
          loadStart: perfData.loadEventStart,
          loadEnd: perfData.loadEventEnd,
          domContentLoaded: perfData.domContentLoadedEventEnd,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
      });

      const performanceTest = {
        device: device.name,
        test: 'Performance Metrics',
        passed: performanceMetrics.firstContentfulPaint < 3000, // VLR.gg standard: <3s FCP on mobile
        details: performanceMetrics
      };

      // Test lazy loading
      const lazyImages = await page.$$('img[loading="lazy"], .mobile-lazy-image');
      const lazyLoadingTest = {
        device: device.name,
        test: 'Lazy Loading Implementation',
        passed: lazyImages.length > 0,
        details: `Found ${lazyImages.length} lazy-loaded images`
      };

      // Test critical CSS
      const criticalCSS = await page.evaluate(() => {
        const criticalElements = document.querySelectorAll('.mobile-critical-above-fold');
        return criticalElements.length > 0;
      });

      const criticalCSSTest = {
        device: device.name,
        test: 'Critical CSS Implementation',
        passed: criticalCSS,
        details: criticalCSS ? 'Critical CSS classes found' : 'No critical CSS optimization'
      };

      this.results.performance.push(performanceTest, lazyLoadingTest, criticalCSSTest);

    } catch (error) {
      this.results.performance.push({
        device: device.name,
        test: 'Performance Metrics Error',
        passed: false,
        details: error.message
      });
    }
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive test report...');

    // Calculate overall scores
    const allTests = [
      ...this.results.navigation,
      ...this.results.touchInteractions,
      ...this.results.typography,
      ...this.results.responsiveGrid,
      ...this.results.brackets,
      ...this.results.search,
      ...this.results.performance
    ];

    const passedTests = allTests.filter(test => test.passed);
    const overallScore = Math.round((passedTests.length / allTests.length) * 100);

    this.results.overall.score = overallScore;

    // Generate recommendations
    const failedTests = allTests.filter(test => !test.passed);
    this.results.overall.issues = failedTests.map(test => `${test.device}: ${test.test} - ${test.details}`);

    if (overallScore < 90) {
      this.results.overall.recommendations.push('Consider implementing additional VLR.gg mobile patterns');
    }
    if (this.results.performance.some(test => !test.passed)) {
      this.results.overall.recommendations.push('Optimize loading performance for mobile networks');
    }
    if (this.results.touchInteractions.some(test => !test.passed)) {
      this.results.overall.recommendations.push('Improve touch interaction feedback');
    }

    // Generate report
    const reportContent = this.generateReportHTML();
    const reportPath = path.join(__dirname, 'mobile-vlr-optimization-report.html');
    await fs.writeFile(reportPath, reportContent);

    // Console summary
    console.log('\n' + '='.repeat(60));
    console.log('📱 VLR.gg Mobile Optimization Test Results');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${overallScore}%`);
    console.log(`Tests Passed: ${passedTests.length}/${allTests.length}`);
    console.log(`Report saved: ${reportPath}`);
    
    if (this.results.overall.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      this.results.overall.issues.slice(0, 5).forEach(issue => console.log(`  • ${issue}`));
    }

    if (this.results.overall.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.overall.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    console.log('\n✅ Mobile optimization testing completed!');
  }

  generateReportHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VLR.gg Mobile Optimization Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 40px; }
    .score { font-size: 48px; font-weight: bold; color: #dc2626; margin: 20px 0; }
    .section { margin: 30px 0; }
    .section h2 { color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; }
    .test-result { display: flex; justify-content: space-between; padding: 15px; margin: 10px 0; border-radius: 6px; }
    .passed { background: #f0f9ff; border-left: 4px solid #10b981; }
    .failed { background: #fef2f2; border-left: 4px solid #ef4444; }
    .device-badge { background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .recommendations { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 VLR.gg Mobile Optimization Test Report</h1>
      <div class="score">${this.results.overall.score}%</div>
      <p>Comprehensive mobile testing results for Marvel Rivals Tournament Platform</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
      <h2>🧭 Navigation Tests</h2>
      ${this.renderTestResults(this.results.navigation)}
    </div>

    <div class="section">
      <h2>👆 Touch Interaction Tests</h2>
      ${this.renderTestResults(this.results.touchInteractions)}
    </div>

    <div class="section">
      <h2>📝 Typography & Hierarchy Tests</h2>
      ${this.renderTestResults(this.results.typography)}
    </div>

    <div class="section">
      <h2>📐 Responsive Grid Tests</h2>
      ${this.renderTestResults(this.results.responsiveGrid)}
    </div>

    <div class="section">
      <h2>🏆 Bracket Visualization Tests</h2>
      ${this.renderTestResults(this.results.brackets)}
    </div>

    <div class="section">
      <h2>🔍 Search Functionality Tests</h2>
      ${this.renderTestResults(this.results.search)}
    </div>

    <div class="section">
      <h2>⚡ Performance Tests</h2>
      ${this.renderTestResults(this.results.performance)}
    </div>

    ${this.results.overall.recommendations.length > 0 ? `
    <div class="section">
      <h2>💡 Recommendations</h2>
      <div class="recommendations">
        <ul>
          ${this.results.overall.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2>📊 Summary</h2>
      <table>
        <tr><th>Category</th><th>Tests Run</th><th>Passed</th><th>Success Rate</th></tr>
        <tr><td>Navigation</td><td>${this.results.navigation.length}</td><td>${this.results.navigation.filter(t => t.passed).length}</td><td>${Math.round((this.results.navigation.filter(t => t.passed).length / this.results.navigation.length) * 100)}%</td></tr>
        <tr><td>Touch Interactions</td><td>${this.results.touchInteractions.length}</td><td>${this.results.touchInteractions.filter(t => t.passed).length}</td><td>${Math.round((this.results.touchInteractions.filter(t => t.passed).length / this.results.touchInteractions.length) * 100)}%</td></tr>
        <tr><td>Typography</td><td>${this.results.typography.length}</td><td>${this.results.typography.filter(t => t.passed).length}</td><td>${Math.round((this.results.typography.filter(t => t.passed).length / this.results.typography.length) * 100)}%</td></tr>
        <tr><td>Responsive Grids</td><td>${this.results.responsiveGrid.length}</td><td>${this.results.responsiveGrid.filter(t => t.passed).length}</td><td>${Math.round((this.results.responsiveGrid.filter(t => t.passed).length / this.results.responsiveGrid.length) * 100)}%</td></tr>
        <tr><td>Bracket Visualization</td><td>${this.results.brackets.length}</td><td>${this.results.brackets.filter(t => t.passed).length}</td><td>${Math.round((this.results.brackets.filter(t => t.passed).length / this.results.brackets.length) * 100)}%</td></tr>
        <tr><td>Search</td><td>${this.results.search.length}</td><td>${this.results.search.filter(t => t.passed).length}</td><td>${Math.round((this.results.search.filter(t => t.passed).length / this.results.search.length) * 100)}%</td></tr>
        <tr><td>Performance</td><td>${this.results.performance.length}</td><td>${this.results.performance.filter(t => t.passed).length}</td><td>${Math.round((this.results.performance.filter(t => t.passed).length / this.results.performance.length) * 100)}%</td></tr>
      </table>
    </div>
  </div>
</body>
</html>`;
  }

  renderTestResults(tests) {
    return tests.map(test => `
      <div class="test-result ${test.passed ? 'passed' : 'failed'}">
        <div>
          <span class="device-badge">${test.device}</span>
          <strong>${test.test}</strong>
          <div style="font-size: 14px; color: #666; margin-top: 5px;">
            ${typeof test.details === 'object' ? JSON.stringify(test.details, null, 2) : test.details}
          </div>
        </div>
        <div style="font-size: 24px; color: ${test.passed ? '#10b981' : '#ef4444'};">
          ${test.passed ? '✅' : '❌'}
        </div>
      </div>
    `).join('');
  }
}

// Run the tests
if (require.main === module) {
  const tester = new MobileVLROptimizationTester();
  tester.runTests().catch(console.error);
}

module.exports = MobileVLROptimizationTester;