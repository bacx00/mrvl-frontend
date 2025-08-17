#!/usr/bin/env node

/**
 * Test script for Live Scoring Optimizations
 * Verifies debouncing, cleanup, and performance improvements
 */

const puppeteer = require('puppeteer');

const MATCH_ID = 6;
const BASE_URL = 'https://staging.mrvl.net';
const TEST_DURATION = 30000; // 30 seconds

async function testLiveScoringOptimizations() {
  console.log('🚀 Starting Live Scoring Optimization Tests');
  console.log('=' . repeat(50));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    startTime: Date.now(),
    tests: []
  };
  
  try {
    // Test 1: Verify polling interval is 2 seconds
    console.log('\n📊 Test 1: Polling Interval Check');
    const page1 = await browser.newPage();
    
    // Monitor network requests
    const requests = [];
    page1.on('request', req => {
      if (req.url().includes(`/api/matches/${MATCH_ID}`)) {
        requests.push({
          url: req.url(),
          timestamp: Date.now()
        });
      }
    });
    
    await page1.goto(`${BASE_URL}/matches/${MATCH_ID}`, { waitUntil: 'networkidle0' });
    
    // Wait for 10 seconds to collect polling data
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Analyze polling intervals
    const intervals = [];
    for (let i = 1; i < requests.length; i++) {
      intervals.push(requests[i].timestamp - requests[i - 1].timestamp);
    }
    
    const avgInterval = intervals.length > 0 ? 
      intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    
    const pollingTest = {
      name: 'Polling Interval',
      expected: '~2000ms',
      actual: `${Math.round(avgInterval)}ms`,
      requests: requests.length,
      passed: avgInterval >= 1900 && avgInterval <= 2100
    };
    
    console.log(`  ✅ Average interval: ${Math.round(avgInterval)}ms`);
    console.log(`  ✅ Total requests in 10s: ${requests.length}`);
    results.tests.push(pollingTest);
    
    // Test 2: Memory leak prevention (cleanup test)
    console.log('\n🧹 Test 2: Memory Cleanup Test');
    const page2 = await browser.newPage();
    
    // Enable console logging
    page2.on('console', msg => {
      if (msg.text().includes('cleanup') || msg.text().includes('destroyed')) {
        console.log(`  Console: ${msg.text()}`);
      }
    });
    
    await page2.goto(`${BASE_URL}/matches/${MATCH_ID}`, { waitUntil: 'networkidle0' });
    
    // Get initial memory usage
    const initialMetrics = await page2.metrics();
    console.log(`  Initial JS Heap: ${(initialMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Navigate away to trigger cleanup
    await page2.goto('about:blank');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get final memory usage
    const finalMetrics = await page2.metrics();
    console.log(`  Final JS Heap: ${(finalMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);
    
    const memoryTest = {
      name: 'Memory Cleanup',
      initialHeap: `${(initialMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`,
      finalHeap: `${(finalMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`,
      reduction: `${((initialMetrics.JSHeapUsedSize - finalMetrics.JSHeapUsedSize) / 1024 / 1024).toFixed(2)}MB`,
      passed: finalMetrics.JSHeapUsedSize < initialMetrics.JSHeapUsedSize * 1.1
    };
    
    results.tests.push(memoryTest);
    
    // Test 3: Tab visibility pause test
    console.log('\n⏸️ Test 3: Tab Visibility Pause Test');
    const page3 = await browser.newPage();
    
    const visibilityRequests = [];
    page3.on('request', req => {
      if (req.url().includes(`/api/matches/${MATCH_ID}`)) {
        visibilityRequests.push({
          url: req.url(),
          timestamp: Date.now()
        });
      }
    });
    
    await page3.goto(`${BASE_URL}/matches/${MATCH_ID}`, { waitUntil: 'networkidle0' });
    
    // Record requests for 5 seconds while visible
    await new Promise(resolve => setTimeout(resolve, 5000));
    const visibleRequests = visibilityRequests.length;
    
    // Simulate tab being hidden
    await page3.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Wait 5 seconds while "hidden"
    const beforeHidden = visibilityRequests.length;
    await new Promise(resolve => setTimeout(resolve, 5000));
    const afterHidden = visibilityRequests.length;
    
    const visibilityTest = {
      name: 'Tab Visibility Pause',
      requestsWhileVisible: visibleRequests,
      requestsWhileHidden: afterHidden - beforeHidden,
      passed: (afterHidden - beforeHidden) < visibleRequests / 2
    };
    
    console.log(`  Requests while visible (5s): ${visibleRequests}`);
    console.log(`  Requests while hidden (5s): ${afterHidden - beforeHidden}`);
    results.tests.push(visibilityTest);
    
    // Test 4: Debouncing test
    console.log('\n⚡ Test 4: State Update Debouncing');
    const page4 = await browser.newPage();
    
    await page4.goto(`${BASE_URL}/matches/${MATCH_ID}`, { waitUntil: 'networkidle0' });
    
    // Simulate rapid updates
    const updateResults = await page4.evaluate(async () => {
      const results = {
        renders: 0,
        updates: 0
      };
      
      // Hook into React DevTools if available
      const matchElement = document.querySelector('[data-match-id]');
      if (matchElement) {
        // Monitor DOM updates
        const observer = new MutationObserver(() => {
          results.renders++;
        });
        observer.observe(matchElement, { childList: true, subtree: true });
        
        // Simulate 10 rapid updates
        for (let i = 0; i < 10; i++) {
          window.dispatchEvent(new CustomEvent('match-update', { 
            detail: { score: i } 
          }));
          results.updates++;
          await new Promise(r => setTimeout(r, 10)); // 10ms between updates
        }
        
        // Wait for debounce to settle
        await new Promise(r => setTimeout(r, 200));
        
        observer.disconnect();
      }
      
      return results;
    });
    
    const debounceTest = {
      name: 'Update Debouncing',
      updates: updateResults.updates,
      renders: updateResults.renders,
      efficiency: updateResults.updates > 0 ? 
        `${((1 - updateResults.renders / updateResults.updates) * 100).toFixed(1)}%` : 'N/A',
      passed: updateResults.renders < updateResults.updates
    };
    
    console.log(`  Updates triggered: ${updateResults.updates}`);
    console.log(`  Actual renders: ${updateResults.renders}`);
    results.tests.push(debounceTest);
    
  } catch (error) {
    console.error('Test error:', error);
    results.error = error.message;
  } finally {
    await browser.close();
  }
  
  // Generate report
  console.log('\n' + '=' . repeat(50));
  console.log('📋 TEST REPORT');
  console.log('=' . repeat(50));
  
  results.tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`\n${status} ${test.name}`);
    Object.entries(test).forEach(([key, value]) => {
      if (key !== 'name' && key !== 'passed') {
        console.log(`   ${key}: ${value}`);
      }
    });
  });
  
  const totalTests = results.tests.length;
  const passedTests = results.tests.filter(t => t.passed).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log('\n' + '=' . repeat(50));
  console.log(`🎯 Overall Results: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
  console.log(`⏱️ Test Duration: ${((Date.now() - results.startTime) / 1000).toFixed(1)}s`);
  
  // Save results
  require('fs').writeFileSync(
    'live_scoring_optimization_report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📊 Full report saved to: live_scoring_optimization_report.json');
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
testLiveScoringOptimizations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});