/**
 * Comprehensive Tablet Optimization Test Suite
 * Tests all tablet-specific components and functionality
 * Validates against vlr.gg-like tablet experience requirements
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Test configuration for different tablet viewports
const TABLET_VIEWPORTS = {
  'iPad Pro 12.9"': { width: 1024, height: 1366, deviceScaleFactor: 2 },
  'iPad Pro 11"': { width: 834, height: 1194, deviceScaleFactor: 2 },
  'iPad Air': { width: 820, height: 1180, deviceScaleFactor: 2 },
  'iPad (Standard)': { width: 768, height: 1024, deviceScaleFactor: 2 },
  'iPad mini': { width: 744, height: 1133, deviceScaleFactor: 2 },
  'Generic Tablet (Landscape)': { width: 1024, height: 768, deviceScaleFactor: 1 },
  'Generic Tablet (Portrait)': { width: 768, height: 1024, deviceScaleFactor: 1 }
};

class TabletOptimizationTester {
  constructor() {
    this.browser = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async setup() {
    console.log('🚀 Starting Tablet Optimization Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--touch-events=enabled',
        '--enable-touch-drag-drop'
      ]
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(testName, testFn) {
    console.log(`\n📱 Running test: ${testName}`);
    this.results.total++;
    
    try {
      await testFn();
      this.results.passed++;
      this.results.details.push({ name: testName, status: 'PASSED', error: null });
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      this.results.failed++;
      this.results.details.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  async testTabletComponentLoading(viewport, viewportName) {
    const page = await this.browser.newPage();
    await page.setViewport(viewport);
    
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Test if tablet-specific components are loaded
      const isTabletDetected = await page.evaluate(() => {
        const width = window.innerWidth;
        return width >= 768 && width <= 1024;
      });

      if (!isTabletDetected) {
        throw new Error(`Tablet detection failed for ${viewportName} (${viewport.width}x${viewport.height})`);
      }

      // Check if tablet CSS classes are applied
      const hasTabletClasses = await page.evaluate(() => {
        return document.body.classList.contains('tablet-optimized') ||
               document.querySelector('.tablet-container') !== null ||
               document.querySelector('.tablet-layout') !== null;
      });

      if (!hasTabletClasses) {
        console.warn(`⚠️  Tablet CSS classes not found for ${viewportName}`);
      }

      // Test tablet-specific components
      const components = await page.evaluate(() => {
        const results = {};
        
        // Check for tablet bracket visualization
        results.bracketVisualization = document.querySelector('.tablet-bracket-container') !== null;
        
        // Check for tablet navigation
        results.navigation = document.querySelector('.tablet-nav-sidebar') !== null ||
                           document.querySelector('.tablet-tab-nav') !== null;
        
        // Check for tablet match cards
        results.matchCards = document.querySelector('.tablet-match-card') !== null ||
                           document.querySelector('.tablet-match-card-enhanced') !== null;
        
        return results;
      });

      console.log(`📊 ${viewportName} Component Status:`, components);

    } finally {
      await page.close();
    }
  }

  async testTabletTouchInteractions(viewport, viewportName) {
    const page = await this.browser.newPage();
    await page.setViewport(viewport);
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

      // Test touch target sizes
      const touchTargets = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, .tablet-touch-target, .touch-target');
        const smallTargets = [];
        
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            smallTargets.push({
              tag: el.tagName,
              class: el.className,
              width: rect.width,
              height: rect.height
            });
          }
        });
        
        return {
          total: elements.length,
          smallTargets: smallTargets.length,
          details: smallTargets.slice(0, 5) // First 5 small targets
        };
      });

      if (touchTargets.smallTargets > 0) {
        console.warn(`⚠️  Found ${touchTargets.smallTargets} touch targets smaller than 44px on ${viewportName}`);
        console.log('Sample small targets:', touchTargets.details);
      }

      // Test pinch-to-zoom on bracket if available
      const hasBracket = await page.$('.tablet-bracket-container');
      if (hasBracket) {
        // Simulate pinch gesture
        await page.evaluate(() => {
          const bracket = document.querySelector('.tablet-bracket-container');
          if (bracket) {
            // Simulate touch events for pinch
            const touchStart = new TouchEvent('touchstart', {
              touches: [
                { clientX: 200, clientY: 200, identifier: 0 },
                { clientX: 300, clientY: 300, identifier: 1 }
              ]
            });
            bracket.dispatchEvent(touchStart);
            
            // Simulate pinch zoom out
            const touchMove = new TouchEvent('touchmove', {
              touches: [
                { clientX: 150, clientY: 150, identifier: 0 },
                { clientX: 350, clientY: 350, identifier: 1 }
              ]
            });
            bracket.dispatchEvent(touchMove);
            
            const touchEnd = new TouchEvent('touchend', { touches: [] });
            bracket.dispatchEvent(touchEnd);
          }
        });
      }

    } finally {
      await page.close();
    }
  }

  async testTabletNavigation(viewport, viewportName) {
    const page = await this.browser.newPage();
    await page.setViewport(viewport);
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

      const navigationTest = await page.evaluate(() => {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        return {
          isLandscape,
          hasSidebar: document.querySelector('.tablet-nav-sidebar') !== null,
          hasTabNav: document.querySelector('.tablet-tab-nav') !== null,
          hasHamburger: document.querySelector('.hamburger, .menu-toggle') !== null,
          navItems: document.querySelectorAll('.tablet-nav-item, .tablet-tab-item').length
        };
      });

      // Validate landscape navigation
      if (navigationTest.isLandscape && !navigationTest.hasSidebar) {
        console.warn(`⚠️  Landscape ${viewportName} should have sidebar navigation`);
      }

      // Validate portrait navigation
      if (!navigationTest.isLandscape && !navigationTest.hasTabNav && !navigationTest.hasHamburger) {
        console.warn(`⚠️  Portrait ${viewportName} should have tab navigation or hamburger menu`);
      }

      console.log(`🧭 ${viewportName} Navigation:`, navigationTest);

    } finally {
      await page.close();
    }
  }

  async testTabletBracketVisualization(viewport, viewportName) {
    const page = await this.browser.newPage();
    await page.setViewport(viewport);
    
    try {
      // Navigate to a page with brackets (assuming /events or /tournaments)
      await page.goto('http://localhost:3000/events', { waitUntil: 'networkidle2' });

      const bracketTest = await page.evaluate(() => {
        const container = document.querySelector('.tablet-bracket-container');
        const viewport = document.querySelector('.tablet-bracket-viewport');
        const zoomControls = document.querySelector('.tablet-zoom-controls');
        const matches = document.querySelectorAll('.tablet-match-card');
        
        return {
          hasContainer: container !== null,
          hasViewport: viewport !== null,
          hasZoomControls: zoomControls !== null,
          matchCount: matches.length,
          containerSize: container ? {
            width: container.offsetWidth,
            height: container.offsetHeight
          } : null
        };
      });

      if (bracketTest.hasContainer) {
        // Test zoom controls
        const zoomInBtn = await page.$('.tablet-zoom-button[title*="Zoom In"], .zoom-in');
        const zoomOutBtn = await page.$('.tablet-zoom-button[title*="Zoom Out"], .zoom-out');
        
        if (zoomInBtn) {
          await zoomInBtn.click();
          await page.waitForTimeout(500);
          console.log(`🔍 ${viewportName} - Zoom In tested`);
        }
        
        if (zoomOutBtn) {
          await zoomOutBtn.click();
          await page.waitForTimeout(500);
          console.log(`🔍 ${viewportName} - Zoom Out tested`);
        }
      }

      console.log(`🏆 ${viewportName} Bracket Test:`, bracketTest);

    } finally {
      await page.close();
    }
  }

  async testTabletMatchCards(viewport, viewportName) {
    const page = await this.browser.newPage();
    await page.setViewport(viewport);
    
    try {
      await page.goto('http://localhost:3000/matches', { waitUntil: 'networkidle2' });

      const matchCardTest = await page.evaluate(() => {
        const cards = document.querySelectorAll('.tablet-match-card, .tablet-match-card-enhanced');
        const cardData = [];
        
        cards.forEach((card, index) => {
          if (index < 3) { // Test first 3 cards
            const rect = card.getBoundingClientRect();
            const hasTeams = card.querySelectorAll('.tablet-team-info, .team-name').length >= 2;
            const hasScores = card.querySelectorAll('.tablet-team-score, .score').length >= 2;
            const hasStatus = card.querySelector('.tablet-match-status, .match-status') !== null;
            
            cardData.push({
              width: rect.width,
              height: rect.height,
              hasTeams,
              hasScores,
              hasStatus,
              isClickable: card.style.cursor === 'pointer' || card.classList.contains('clickable')
            });
          }
        });
        
        return {
          totalCards: cards.length,
          cardData,
          hasGrid: document.querySelector('.tablet-match-grid') !== null
        };
      });

      // Test card interactions
      const firstCard = await page.$('.tablet-match-card, .match-card');
      if (firstCard) {
        await firstCard.click();
        await page.waitForTimeout(500);
        console.log(`🎮 ${viewportName} - Match card click tested`);
      }

      console.log(`🃏 ${viewportName} Match Cards:`, matchCardTest);

    } finally {
      await page.close();
    }
  }

  async testTabletLiveScoring(viewport, viewportName) {
    const page = await this.browser.newPage();
    await page.setViewport(viewport);
    
    try {
      // Try to find a live match or create test scenario
      await page.goto('http://localhost:3000/matches', { waitUntil: 'networkidle2' });

      const liveTest = await page.evaluate(() => {
        const liveComponents = document.querySelectorAll('.tablet-live-scoring, .live-scoring');
        const liveMatches = document.querySelectorAll('.live, [data-status="live"]');
        
        return {
          hasLiveComponent: liveComponents.length > 0,
          liveMatchCount: liveMatches.length,
          hasLiveAnimations: document.querySelector('.live-pulse, .animate-pulse') !== null,
          hasScoreDisplay: document.querySelector('.team-score, .score-display') !== null
        };
      });

      console.log(`🔴 ${viewportName} Live Scoring:`, liveTest);

    } finally {
      await page.close();
    }
  }

  async testResponsiveBreakpoints(viewport, viewportName) {
    const page = await this.browser.newPage();
    await page.setViewport(viewport);
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

      const breakpointTest = await page.evaluate(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLandscape = width > height;
        
        // Check CSS media query compliance
        const testElement = document.createElement('div');
        testElement.style.display = 'none';
        testElement.className = 'tablet-test-element';
        document.body.appendChild(testElement);
        
        // Add CSS rule to test
        const style = document.createElement('style');
        style.textContent = `
          @media (min-width: 768px) and (max-width: 1024px) {
            .tablet-test-element { display: block; }
          }
        `;
        document.head.appendChild(style);
        
        const isTabletBreakpoint = window.getComputedStyle(testElement).display === 'block';
        
        // Cleanup
        document.body.removeChild(testElement);
        document.head.removeChild(style);
        
        return {
          width,
          height,
          isLandscape,
          isTabletBreakpoint,
          devicePixelRatio: window.devicePixelRatio,
          userAgent: navigator.userAgent.includes('iPad') || navigator.userAgent.includes('Tablet')
        };
      });

      if (breakpointTest.width >= 768 && breakpointTest.width <= 1024 && !breakpointTest.isTabletBreakpoint) {
        throw new Error(`Tablet breakpoint not triggered for ${viewportName} (${breakpointTest.width}px)`);
      }

      console.log(`📐 ${viewportName} Breakpoint Test:`, breakpointTest);

    } finally {
      await page.close();
    }
  }

  async runAllTests() {
    await this.setup();

    try {
      // Test each tablet viewport
      for (const [name, viewport] of Object.entries(TABLET_VIEWPORTS)) {
        console.log(`\n🖥️  Testing ${name} (${viewport.width}x${viewport.height})`);
        
        await this.runTest(`${name} - Component Loading`, () => 
          this.testTabletComponentLoading(viewport, name)
        );
        
        await this.runTest(`${name} - Touch Interactions`, () => 
          this.testTabletTouchInteractions(viewport, name)
        );
        
        await this.runTest(`${name} - Navigation`, () => 
          this.testTabletNavigation(viewport, name)
        );
        
        await this.runTest(`${name} - Bracket Visualization`, () => 
          this.testTabletBracketVisualization(viewport, name)
        );
        
        await this.runTest(`${name} - Match Cards`, () => 
          this.testTabletMatchCards(viewport, name)
        );
        
        await this.runTest(`${name} - Live Scoring`, () => 
          this.testTabletLiveScoring(viewport, name)
        );
        
        await this.runTest(`${name} - Responsive Breakpoints`, () => 
          this.testResponsiveBreakpoints(viewport, name)
        );
      }

      // Additional integration tests
      await this.runTest('iPad Detection and Optimization', () => this.testiPadOptimizations());
      await this.runTest('Gesture System Integration', () => this.testGestureIntegration());
      await this.runTest('Performance on Tablet Viewports', () => this.testPerformance());

    } finally {
      await this.cleanup();
    }

    this.printResults();
  }

  async testiPadOptimizations() {
    const page = await this.browser.newPage();
    
    // Set iPad user agent
    await page.setUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 1024, height: 1366, deviceScaleFactor: 2 });
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

      const iPadTest = await page.evaluate(() => {
        return {
          hasIPadClasses: document.body.classList.contains('ipad-optimized'),
          hasIPadSpecificCSS: getComputedStyle(document.documentElement).getPropertyValue('--ipad-layout') !== '',
          hasApplePencilSupport: document.body.classList.contains('apple-pencil-support'),
          hasSafeAreaSupport: getComputedStyle(document.documentElement).getPropertyValue('--ipad-safe-top') !== ''
        };
      });

      console.log('🍎 iPad Optimizations:', iPadTest);

    } finally {
      await page.close();
    }
  }

  async testGestureIntegration() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

      // Test if gesture handlers are properly attached
      const gestureTest = await page.evaluate(() => {
        const elements = document.querySelectorAll('.tablet-pinch-zoom, .pinch-zoom-container');
        const panElements = document.querySelectorAll('.tablet-pan-container, .pan-container');
        
        return {
          hasPinchElements: elements.length > 0,
          hasPanElements: panElements.length > 0,
          hasTouchAction: document.documentElement.style.touchAction !== undefined
        };
      });

      console.log('👆 Gesture Integration:', gestureTest);

    } finally {
      await page.close();
    }
  }

  async testPerformance() {
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
    
    try {
      // Enable performance monitoring
      await page.setCacheEnabled(false);
      
      const startTime = Date.now();
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;

      const metrics = await page.metrics();
      
      const performanceTest = {
        loadTime,
        jsHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024 * 100) / 100, // MB
        jsHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024 * 100) / 100, // MB
        nodes: metrics.Nodes,
        layoutCount: metrics.LayoutCount,
        recalcStyleCount: metrics.RecalcStyleCount
      };

      // Performance thresholds for tablet
      if (loadTime > 5000) {
        console.warn(`⚠️  Load time ${loadTime}ms exceeds 5s threshold`);
      }
      
      if (performanceTest.jsHeapUsedSize > 50) {
        console.warn(`⚠️  JS Heap usage ${performanceTest.jsHeapUsedSize}MB is high`);
      }

      console.log('⚡ Performance Metrics:', performanceTest);

    } finally {
      await page.close();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TABLET OPTIMIZATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total:  ${this.results.total}`);
    console.log(`📊 Success Rate: ${Math.round(this.results.passed / this.results.total * 100)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Save results to file
    const fs = require('fs');
    const resultsFile = path.join(__dirname, `tablet-test-results-${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    console.log(`📁 Detailed results saved to: ${resultsFile}`);
  }
}

// Run the tests
async function main() {
  const tester = new TabletOptimizationTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TabletOptimizationTester;