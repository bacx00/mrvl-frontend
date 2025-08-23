const puppeteer = require('puppeteer');

/**
 * Frontend Live Indicator Test
 * Specifically tests the visual live update indicators in the UserProfile component
 */

class ProfileLiveIndicatorTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async init() {
    console.log('🚀 Initializing Live Indicator Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 50
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async testLiveIndicatorPresence() {
    console.log('🔍 Testing live indicator presence...');
    
    try {
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
      
      // Test for various possible live indicator implementations
      const indicators = await this.page.evaluate(() => {
        const results = {};
        
        // Look for green pulsing dot
        const pulsingDot = document.querySelector('.bg-green-500.animate-pulse') ||
                          document.querySelector('[class*="bg-green"][class*="animate-pulse"]') ||
                          document.querySelector('.w-2.h-2.bg-green-500.rounded-full.animate-pulse');
        results.pulsingDot = !!pulsingDot;
        
        // Look for "Live updates" text
        const liveText = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent && el.textContent.includes('Live updates every 30 seconds'));
        results.liveText = !!liveText;
        
        // Look for timestamp indicator
        const timestampText = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent && el.textContent.match(/Updated:.*\d{1,2}:\d{2}:\d{2}/));
        results.timestamp = !!timestampText;
        results.timestampValue = timestampText ? timestampText.textContent : null;
        
        // Look for any element with data-testid attributes
        const testIds = Array.from(document.querySelectorAll('[data-testid]'))
          .map(el => el.getAttribute('data-testid'))
          .filter(id => id && (id.includes('live') || id.includes('update') || id.includes('indicator')));
        results.testIds = testIds;
        
        return results;
      });
      
      console.log('📊 Live indicator check results:', indicators);
      
      return {
        passed: indicators.pulsingDot || indicators.liveText || indicators.timestamp,
        details: indicators,
        score: (indicators.pulsingDot ? 1 : 0) + 
               (indicators.liveText ? 1 : 0) + 
               (indicators.timestamp ? 1 : 0)
      };
      
    } catch (error) {
      console.error('❌ Live indicator presence test failed:', error.message);
      return { passed: false, error: error.message };
    }
  }

  async testTimestampUpdates() {
    console.log('⏰ Testing timestamp updates...');
    
    try {
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
      
      // Capture initial timestamp
      const initialTimestamp = await this.page.evaluate(() => {
        const timestampElement = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent && el.textContent.match(/Updated:.*\d{1,2}:\d{2}:\d{2}/));
        return timestampElement ? timestampElement.textContent : null;
      });
      
      console.log('📅 Initial timestamp:', initialTimestamp);
      
      if (!initialTimestamp) {
        return { passed: false, error: 'No timestamp element found' };
      }
      
      // Wait 35 seconds to ensure at least one update cycle
      console.log('⏳ Waiting 35 seconds for timestamp update...');
      await this.wait(35000);
      
      // Capture updated timestamp
      const updatedTimestamp = await this.page.evaluate(() => {
        const timestampElement = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent && el.textContent.match(/Updated:.*\d{1,2}:\d{2}:\d{2}/));
        return timestampElement ? timestampElement.textContent : null;
      });
      
      console.log('📅 Updated timestamp:', updatedTimestamp);
      
      const timestampChanged = initialTimestamp !== updatedTimestamp;
      
      return {
        passed: timestampChanged,
        initialTimestamp,
        updatedTimestamp,
        timestampChanged,
        details: 'Testing automatic timestamp updates every 30 seconds'
      };
      
    } catch (error) {
      console.error('❌ Timestamp update test failed:', error.message);
      return { passed: false, error: error.message };
    }
  }

  async testVisualAnimations() {
    console.log('✨ Testing visual animations...');
    
    try {
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
      
      // Check for CSS animations
      const animations = await this.page.evaluate(() => {
        const results = {};
        
        // Check for animate-pulse class
        const pulseElements = document.querySelectorAll('.animate-pulse');
        results.pulseAnimations = pulseElements.length;
        
        // Check for any animated elements
        const animatedElements = document.querySelectorAll('[class*="animate-"]');
        results.animatedElements = animatedElements.length;
        
        // Check for green colored elements (indicators)
        const greenElements = document.querySelectorAll('[class*="bg-green"], [class*="text-green"]');
        results.greenElements = greenElements.length;
        
        // Check computed styles for animations
        const computedAnimations = [];
        pulseElements.forEach((el, index) => {
          const style = window.getComputedStyle(el);
          computedAnimations.push({
            element: index,
            animation: style.animation || style.webkitAnimation,
            transition: style.transition || style.webkitTransition
          });
        });
        results.computedAnimations = computedAnimations;
        
        return results;
      });
      
      console.log('🎨 Animation check results:', animations);
      
      return {
        passed: animations.pulseAnimations > 0 || animations.animatedElements > 0,
        details: animations,
        score: animations.pulseAnimations + animations.animatedElements
      };
      
    } catch (error) {
      console.error('❌ Visual animation test failed:', error.message);
      return { passed: false, error: error.message };
    }
  }

  async testResponsiveIndicators() {
    console.log('📱 Testing responsive live indicators...');
    
    try {
      // Test desktop view
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
      
      const desktopResults = await this.page.evaluate(() => {
        const liveIndicator = document.querySelector('.bg-green-500.animate-pulse') ||
                             document.querySelector('[class*="live"]');
        return {
          visible: liveIndicator && window.getComputedStyle(liveIndicator).display !== 'none',
          position: liveIndicator ? liveIndicator.getBoundingClientRect() : null
        };
      });
      
      // Test mobile view
      await this.page.setViewport({ width: 375, height: 667 });
      await this.wait(1000);
      
      const mobileResults = await this.page.evaluate(() => {
        const liveIndicator = document.querySelector('.bg-green-500.animate-pulse') ||
                             document.querySelector('[class*="live"]');
        return {
          visible: liveIndicator && window.getComputedStyle(liveIndicator).display !== 'none',
          position: liveIndicator ? liveIndicator.getBoundingClientRect() : null
        };
      });
      
      // Test tablet view
      await this.page.setViewport({ width: 768, height: 1024 });
      await this.wait(1000);
      
      const tabletResults = await this.page.evaluate(() => {
        const liveIndicator = document.querySelector('.bg-green-500.animate-pulse') ||
                             document.querySelector('[class*="live"]');
        return {
          visible: liveIndicator && window.getComputedStyle(liveIndicator).display !== 'none',
          position: liveIndicator ? liveIndicator.getBoundingClientRect() : null
        };
      });
      
      return {
        passed: desktopResults.visible || mobileResults.visible || tabletResults.visible,
        desktopResults,
        mobileResults,
        tabletResults,
        details: 'Testing live indicators across different screen sizes'
      };
      
    } catch (error) {
      console.error('❌ Responsive indicator test failed:', error.message);
      return { passed: false, error: error.message };
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllTests() {
    console.log('🎮 Starting Live Indicator Test Suite...');
    
    try {
      await this.init();
      
      const results = {
        timestamp: new Date().toISOString(),
        tests: {}
      };
      
      // Run all tests
      results.tests.indicatorPresence = await this.testLiveIndicatorPresence();
      results.tests.timestampUpdates = await this.testTimestampUpdates();
      results.tests.visualAnimations = await this.testVisualAnimations();
      results.tests.responsiveIndicators = await this.testResponsiveIndicators();
      
      // Calculate summary
      const totalTests = Object.keys(results.tests).length;
      const passedTests = Object.values(results.tests).filter(t => t.passed).length;
      
      results.summary = {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        overallPassed: passedTests === totalTests,
        score: passedTests / totalTests * 100
      };
      
      console.log('\n📊 Live Indicator Test Results:');
      console.log(`Overall Score: ${results.summary.score.toFixed(1)}%`);
      console.log(`Tests Passed: ${passedTests}/${totalTests}`);
      console.log(`Result: ${results.summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      return {
        error: error.message,
        summary: { overallPassed: false }
      };
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test suite
async function runLiveIndicatorTests() {
  const tester = new ProfileLiveIndicatorTester();
  const results = await tester.runAllTests();
  
  console.log('\n🏁 Live Indicator Test Suite Complete!');
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, `live-indicator-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Report saved: ${reportPath}`);
  
  process.exit(results.summary?.overallPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runLiveIndicatorTests().catch(console.error);
}

module.exports = { ProfileLiveIndicatorTester };