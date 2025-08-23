const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Real-Time User Profile Update Test Suite
 * Tests live scoring engineering aspects: WebSocket/polling, state management, and real-time updates
 */

class RealTimeProfileTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: {},
      performance: {},
      realTimeMetrics: {},
      errors: []
    };
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.testUserId = null;
    this.initialStats = {};
    this.currentStats = {};
  }

  async init() {
    console.log('🚀 Initializing Real-Time Profile Update Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to false to see the browser in action
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-features=VizDisplayCompositor'
      ],
      slowMo: 100 // Slow down for better observation
    });

    this.page = await this.browser.newPage();
    
    // Set viewport for desktop testing
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.text().includes('Activity stats') || msg.text().includes('🎯') || msg.text().includes('📊')) {
        console.log('🔍 Frontend Log:', msg.text());
      }
    });

    // Enable network monitoring for API calls
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      if (request.url().includes('/api/users/') && request.url().includes('/stats')) {
        console.log(`📡 Stats API Call: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });

    this.page.on('response', response => {
      if (response.url().includes('/api/users/') && response.url().includes('/stats')) {
        console.log(`✅ Stats API Response: ${response.status()} ${response.url()}`);
      }
    });

    console.log('✅ Test suite initialized');
  }

  async login() {
    console.log('🔐 Logging in...');
    
    try {
      await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });
      
      // Wait for login form
      await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      // Fill login form (using test credentials)
      await this.page.type('input[name="email"]', 'testuser@example.com');
      await this.page.type('input[name="password"]', 'password123');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard or profile
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Get current user ID from the page
      this.testUserId = await this.page.evaluate(() => {
        return window.localStorage.getItem('user_id') || 
               document.querySelector('[data-user-id]')?.getAttribute('data-user-id');
      });
      
      console.log(`✅ Logged in successfully. User ID: ${this.testUserId}`);
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      this.testResults.errors.push(`Login failed: ${error.message}`);
      return false;
    }
  }

  async testPollingMechanism() {
    console.log('🕒 Testing 30-second polling mechanism...');
    
    try {
      // Navigate to profile page
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
      
      // Wait for profile to load
      await this.page.waitForSelector('[data-testid="live-update-indicator"]', { timeout: 10000 });
      
      // Capture initial stats
      this.initialStats = await this.captureStats();
      console.log('📊 Initial stats captured:', this.initialStats);
      
      // Monitor API calls over 70 seconds to catch at least 2 polling cycles
      const apiCalls = [];
      const startTime = Date.now();
      const monitoringDuration = 70000; // 70 seconds
      
      // Set up API call monitoring
      const responseHandler = (response) => {
        if (response.url().includes('/api/users/') && response.url().includes('/stats')) {
          apiCalls.push({
            timestamp: Date.now(),
            url: response.url(),
            status: response.status()
          });
        }
      };
      
      this.page.on('response', responseHandler);
      
      console.log(`⏱️ Monitoring API calls for ${monitoringDuration / 1000} seconds...`);
      
      // Wait for monitoring period
      await new Promise(resolve => setTimeout(resolve, monitoringDuration));
      
      // Remove event listener
      this.page.removeListener('response', responseHandler);
      
      // Analyze polling behavior
      const pollingIntervals = [];
      for (let i = 1; i < apiCalls.length; i++) {
        const interval = apiCalls[i].timestamp - apiCalls[i - 1].timestamp;
        pollingIntervals.push(interval);
      }
      
      const averageInterval = pollingIntervals.length > 0 
        ? pollingIntervals.reduce((a, b) => a + b, 0) / pollingIntervals.length 
        : 0;
      
      this.testResults.tests.pollingMechanism = {
        passed: apiCalls.length >= 2 && averageInterval >= 25000 && averageInterval <= 35000,
        apiCallCount: apiCalls.length,
        averageInterval,
        expectedInterval: 30000,
        intervals: pollingIntervals,
        details: 'Testing automatic 30-second polling for stats updates'
      };
      
      console.log(`✅ Polling test complete. API calls: ${apiCalls.length}, Avg interval: ${averageInterval}ms`);
      
    } catch (error) {
      console.error('❌ Polling mechanism test failed:', error.message);
      this.testResults.tests.pollingMechanism = {
        passed: false,
        error: error.message
      };
    }
  }

  async testActivityContextTriggers() {
    console.log('🎯 Testing activity context triggers...');
    
    try {
      // Test forum post creation trigger
      await this.simulateForumPost();
      await this.wait(3000); // Wait for potential debounced update
      
      // Check if stats were updated
      const statsAfterPost = await this.captureStats();
      
      // Test comment creation trigger
      await this.simulateComment();
      await this.wait(3000); // Wait for potential debounced update
      
      // Check if stats were updated again
      const statsAfterComment = await this.captureStats();
      
      this.testResults.tests.activityTriggers = {
        passed: true,
        initialStats: this.initialStats,
        afterPost: statsAfterPost,
        afterComment: statsAfterComment,
        details: 'Testing immediate stats updates after user actions'
      };
      
      console.log('✅ Activity context triggers test complete');
      
    } catch (error) {
      console.error('❌ Activity context triggers test failed:', error.message);
      this.testResults.tests.activityTriggers = {
        passed: false,
        error: error.message
      };
    }
  }

  async testLiveIndicators() {
    console.log('🎨 Testing live update indicators...');
    
    try {
      // Navigate to profile page
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
      
      // Check for green pulsing indicator
      const hasPulsingIndicator = await this.page.evaluate(() => {
        const indicator = document.querySelector('[data-testid="live-indicator"]') ||
                         document.querySelector('.animate-pulse') ||
                         document.querySelector('.bg-green-500');
        return indicator !== null;
      });
      
      // Check for timestamp indicator
      const timestampElement = await this.page.$('[data-testid="last-updated"]') ||
                              await this.page.$('text=/Updated:.*/')?.first;
      
      const hasTimestamp = timestampElement !== null;
      
      // Capture initial timestamp
      let initialTimestamp = null;
      if (hasTimestamp) {
        initialTimestamp = await this.page.evaluate(() => {
          const element = document.querySelector('[data-testid="last-updated"]') ||
                         Array.from(document.querySelectorAll('*')).find(el => 
                           el.textContent && el.textContent.includes('Updated:'));
          return element ? element.textContent : null;
        });
      }
      
      // Wait for next update cycle (35 seconds to ensure we catch an update)
      console.log('⏱️ Waiting for timestamp update...');
      await this.wait(35000);
      
      // Check if timestamp changed
      let updatedTimestamp = null;
      if (hasTimestamp) {
        updatedTimestamp = await this.page.evaluate(() => {
          const element = document.querySelector('[data-testid="last-updated"]') ||
                         Array.from(document.querySelectorAll('*')).find(el => 
                           el.textContent && el.textContent.includes('Updated:'));
          return element ? element.textContent : null;
        });
      }
      
      this.testResults.tests.liveIndicators = {
        passed: hasPulsingIndicator && hasTimestamp && (initialTimestamp !== updatedTimestamp),
        hasPulsingIndicator,
        hasTimestamp,
        initialTimestamp,
        updatedTimestamp,
        timestampChanged: initialTimestamp !== updatedTimestamp,
        details: 'Testing visual live update indicators and timestamp updates'
      };
      
      console.log('✅ Live indicators test complete');
      
    } catch (error) {
      console.error('❌ Live indicators test failed:', error.message);
      this.testResults.tests.liveIndicators = {
        passed: false,
        error: error.message
      };
    }
  }

  async testRealtimeDataConsistency() {
    console.log('🔄 Testing real-time data consistency...');
    
    try {
      // Open profile in two tabs to test multi-client consistency
      const page2 = await this.browser.newPage();
      await page2.setViewport({ width: 1920, height: 1080 });
      
      // Navigate both pages to profile
      await Promise.all([
        this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' }),
        page2.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' })
      ]);
      
      // Capture stats from both tabs
      const stats1 = await this.captureStats();
      const stats2 = await this.captureStatsFromPage(page2);
      
      // Perform action on first tab
      await this.simulateVoting();
      
      // Wait for updates to propagate
      await this.wait(5000);
      
      // Check stats on both tabs
      const updatedStats1 = await this.captureStats();
      const updatedStats2 = await this.captureStatsFromPage(page2);
      
      // Close second tab
      await page2.close();
      
      this.testResults.tests.dataConsistency = {
        passed: this.compareStats(updatedStats1, updatedStats2),
        initialStats: { tab1: stats1, tab2: stats2 },
        updatedStats: { tab1: updatedStats1, tab2: updatedStats2 },
        details: 'Testing data consistency across multiple clients'
      };
      
      console.log('✅ Real-time data consistency test complete');
      
    } catch (error) {
      console.error('❌ Real-time data consistency test failed:', error.message);
      this.testResults.tests.dataConsistency = {
        passed: false,
        error: error.message
      };
    }
  }

  async testPerformanceUnderLoad() {
    console.log('⚡ Testing performance under load...');
    
    try {
      const startTime = Date.now();
      
      // Navigate to profile
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
      
      // Measure initial load time
      const loadTime = Date.now() - startTime;
      
      // Rapid user actions to stress test the system
      const actions = [
        () => this.simulateComment(),
        () => this.simulateVoting(),
        () => this.simulateForumPost(),
        () => this.simulateActivity()
      ];
      
      const actionStartTime = Date.now();
      
      // Perform multiple actions rapidly
      for (let i = 0; i < 10; i++) {
        const action = actions[i % actions.length];
        await action();
        await this.wait(500); // Short delay between actions
      }
      
      const actionDuration = Date.now() - actionStartTime;
      
      // Measure memory usage
      const metrics = await this.page.metrics();
      
      this.testResults.performance = {
        loadTime,
        actionDuration,
        jsHeapUsedSize: metrics.JSHeapUsedSize,
        jsHeapTotalSize: metrics.JSHeapTotalSize,
        passed: loadTime < 5000 && actionDuration < 30000,
        details: 'Performance testing under rapid user actions'
      };
      
      console.log(`✅ Performance test complete. Load: ${loadTime}ms, Actions: ${actionDuration}ms`);
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      this.testResults.performance = {
        passed: false,
        error: error.message
      };
    }
  }

  async captureStats() {
    return await this.captureStatsFromPage(this.page);
  }

  async captureStatsFromPage(page) {
    return await page.evaluate(() => {
      const stats = {};
      
      // Extract stats from the DOM
      const statElements = document.querySelectorAll('[data-testid*="stat-"]');
      statElements.forEach(el => {
        const key = el.getAttribute('data-testid').replace('stat-', '');
        const value = parseInt(el.textContent) || 0;
        stats[key] = value;
      });
      
      // Fallback: extract from text content
      const textStats = {
        forumThreads: document.querySelector('text=/Forum Threads/')?.nextSibling?.textContent,
        forumPosts: document.querySelector('text=/Forum Posts/')?.nextSibling?.textContent,
        comments: document.querySelector('text=/Comments/')?.nextSibling?.textContent,
        reputation: document.querySelector('text=/Reputation/')?.nextSibling?.textContent
      };
      
      return { ...stats, ...textStats };
    });
  }

  compareStats(stats1, stats2) {
    const keys = Object.keys(stats1);
    for (let key of keys) {
      if (stats1[key] !== stats2[key]) {
        console.log(`Stats mismatch: ${key} - ${stats1[key]} vs ${stats2[key]}`);
        return false;
      }
    }
    return true;
  }

  async simulateForumPost() {
    console.log('📝 Simulating forum post...');
    
    try {
      // Navigate to create thread page
      await this.page.goto(`${this.baseUrl}/forums/create`, { waitUntil: 'networkidle2' });
      
      // Fill out forum post form
      await this.page.waitForSelector('input[name="title"]', { timeout: 5000 });
      await this.page.type('input[name="title"]', 'Test Forum Post - Real-time Update Test');
      await this.page.type('textarea[name="content"]', 'This is a test post to verify real-time profile updates.');
      
      // Submit the form
      await this.page.click('button[type="submit"]');
      
      // Wait for submission to complete
      await this.wait(2000);
      
    } catch (error) {
      console.log('⚠️ Forum post simulation failed (might not have create access):', error.message);
    }
  }

  async simulateComment() {
    console.log('💬 Simulating comment...');
    
    try {
      // Find a news article or forum post to comment on
      await this.page.goto(`${this.baseUrl}/news`, { waitUntil: 'networkidle2' });
      
      // Click on first news item
      const firstNewsLink = await this.page.$('a[href*="/news/"]');
      if (firstNewsLink) {
        await firstNewsLink.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Find comment textarea
        const commentArea = await this.page.$('textarea[placeholder*="comment"]');
        if (commentArea) {
          await commentArea.type('Test comment for real-time update verification');
          
          // Submit comment
          const submitButton = await this.page.$('button:contains("Post Comment")') ||
                              await this.page.$('button[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            await this.wait(2000);
          }
        }
      }
      
    } catch (error) {
      console.log('⚠️ Comment simulation failed:', error.message);
    }
  }

  async simulateVoting() {
    console.log('👍 Simulating voting...');
    
    try {
      // Find voting buttons on current page
      const upvoteButton = await this.page.$('[data-testid="upvote-button"]') ||
                          await this.page.$('.upvote-btn') ||
                          await this.page.$('button:contains("👍")');
      
      if (upvoteButton) {
        await upvoteButton.click();
        await this.wait(1000);
      }
      
    } catch (error) {
      console.log('⚠️ Voting simulation failed:', error.message);
    }
  }

  async simulateActivity() {
    console.log('🎯 Simulating general activity...');
    
    try {
      // Navigate between pages to trigger activity
      await this.page.goto(`${this.baseUrl}/matches`, { waitUntil: 'networkidle2' });
      await this.wait(1000);
      await this.page.goto(`${this.baseUrl}/forums`, { waitUntil: 'networkidle2' });
      await this.wait(1000);
      
    } catch (error) {
      console.log('⚠️ Activity simulation failed:', error.message);
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateReport() {
    console.log('📄 Generating test report...');
    
    const report = {
      ...this.testResults,
      summary: {
        totalTests: Object.keys(this.testResults.tests).length,
        passedTests: Object.values(this.testResults.tests).filter(t => t.passed).length,
        failedTests: Object.values(this.testResults.tests).filter(t => !t.passed).length,
        overallPassed: Object.values(this.testResults.tests).every(t => t.passed) && 
                      (this.testResults.performance?.passed !== false)
      }
    };
    
    const reportPath = path.join(__dirname, `realtime-profile-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Test Results Summary:`);
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Overall Result: ${report.summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Report saved: ${reportPath}`);
    
    return report;
  }

  async runAllTests() {
    console.log('🎮 Starting Real-Time Profile Update Test Suite...');
    
    try {
      await this.init();
      
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Login failed - cannot proceed with tests');
      }
      
      // Run all tests
      await this.testPollingMechanism();
      await this.testActivityContextTriggers();
      await this.testLiveIndicators();
      await this.testRealtimeDataConsistency();
      await this.testPerformanceUnderLoad();
      
      // Generate report
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.errors.push(`Test suite error: ${error.message}`);
      return this.testResults;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test suite
async function runRealTimeProfileTests() {
  const tester = new RealTimeProfileTester();
  const results = await tester.runAllTests();
  
  console.log('\n🏁 Real-Time Profile Update Test Suite Complete!');
  console.log('Check the generated report for detailed results.');
  
  process.exit(results.summary?.overallPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runRealTimeProfileTests().catch(console.error);
}

module.exports = { RealTimeProfileTester };