/**
 * Match Detail Page Bug Hunt Test Script
 * 
 * This script tests various scenarios and edge cases for the MatchDetailPage component
 * to identify potential bugs and issues that could affect production stability.
 */

const { chromium } = require('playwright');

class MatchDetailBugHunter {
  constructor() {
    this.browser = null;
    this.page = null;
    this.bugs = [];
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.bugs.push({
          type: 'console_error',
          severity: 'high',
          message: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Listen for uncaught exceptions
    this.page.on('pageerror', error => {
      this.bugs.push({
        type: 'uncaught_exception',
        severity: 'critical',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Listen for network failures
    this.page.on('requestfailed', request => {
      this.bugs.push({
        type: 'network_failure',
        severity: 'medium',
        url: request.url(),
        failure: request.failure(),
        timestamp: new Date().toISOString()
      });
    });
  }

  async testMatchDetailPageLoad() {
    console.log('🧪 Testing match detail page load with match ID 6...');
    
    try {
      await this.page.goto('http://localhost:3000/match/6', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for the match to load
      await this.page.waitForSelector('.min-h-screen', { timeout: 10000 });

      // Check if match loads successfully
      const matchData = await this.page.evaluate(() => {
        const teamElements = document.querySelectorAll('h2');
        const scoreElements = document.querySelectorAll('.text-4xl');
        return {
          teamsFound: teamElements.length > 0,
          scoresFound: scoreElements.length > 0,
          hasErrorBoundary: document.querySelector('[data-testid="error-boundary"]') !== null
        };
      });

      if (matchData.teamsFound && matchData.scoresFound && !matchData.hasErrorBoundary) {
        this.testResults.passed++;
        console.log('✅ Match detail page loads successfully');
      } else {
        this.testResults.failed++;
        this.bugs.push({
          type: 'load_failure',
          severity: 'high',
          message: 'Match detail page failed to load properly',
          details: matchData,
          timestamp: new Date().toISOString()
        });
        console.log('❌ Match detail page load failed');
      }

    } catch (error) {
      this.testResults.failed++;
      this.bugs.push({
        type: 'page_load_error',
        severity: 'critical',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log('❌ Error loading match detail page:', error.message);
    }
  }

  async testMapSwitching() {
    console.log('🧪 Testing map switching functionality...');
    
    try {
      // Find map boxes
      const mapBoxes = await this.page.$$('.w-20.h-24.rounded-lg');
      
      if (mapBoxes.length === 0) {
        this.bugs.push({
          type: 'missing_elements',
          severity: 'medium',
          message: 'No map boxes found for switching',
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`Found ${mapBoxes.length} map boxes`);

      // Test clicking on each map
      for (let i = 0; i < mapBoxes.length && i < 3; i++) {
        console.log(`Testing map ${i + 1} switch...`);
        
        await mapBoxes[i].click();
        await this.page.waitForTimeout(500); // Wait for state update

        // Check if current map indicator updated
        const currentMapText = await this.page.textContent('.font-bold.text-blue-900');
        const expectedText = `Map ${i + 1}`;
        
        if (currentMapText && currentMapText.includes(expectedText)) {
          console.log(`✅ Map ${i + 1} switch successful`);
          this.testResults.passed++;
        } else {
          console.log(`❌ Map ${i + 1} switch failed - expected ${expectedText}, got ${currentMapText}`);
          this.testResults.failed++;
          this.bugs.push({
            type: 'map_switch_failure',
            severity: 'medium',
            message: `Map switching to Map ${i + 1} failed`,
            expected: expectedText,
            actual: currentMapText,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      this.testResults.failed++;
      this.bugs.push({
        type: 'map_switch_error',
        severity: 'high',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log('❌ Error testing map switching:', error.message);
    }
  }

  async testPlayerDataPersistence() {
    console.log('🧪 Testing player data persistence...');
    
    try {
      // Capture initial player data
      const initialPlayerData = await this.page.evaluate(() => {
        const playerRows = document.querySelectorAll('tbody tr');
        return Array.from(playerRows).map(row => {
          const cells = row.querySelectorAll('td');
          return cells.length > 0 ? {
            playerName: cells[0]?.textContent?.trim(),
            hero: cells[1]?.querySelector('img')?.alt,
            kills: cells[2]?.textContent?.trim(),
            deaths: cells[3]?.textContent?.trim()
          } : null;
        }).filter(Boolean);
      });

      console.log(`Initial player data: ${initialPlayerData.length} players found`);

      // Navigate away and back
      await this.page.goto('http://localhost:3000/matches');
      await this.page.waitForTimeout(1000);
      await this.page.goto('http://localhost:3000/match/6');
      await this.page.waitForSelector('.min-h-screen', { timeout: 10000 });

      // Capture player data after navigation
      const afterNavigationData = await this.page.evaluate(() => {
        const playerRows = document.querySelectorAll('tbody tr');
        return Array.from(playerRows).map(row => {
          const cells = row.querySelectorAll('td');
          return cells.length > 0 ? {
            playerName: cells[0]?.textContent?.trim(),
            hero: cells[1]?.querySelector('img')?.alt,
            kills: cells[2]?.textContent?.trim(),
            deaths: cells[3]?.textContent?.trim()
          } : null;
        }).filter(Boolean);
      });

      // Compare data
      const dataMatches = JSON.stringify(initialPlayerData) === JSON.stringify(afterNavigationData);
      
      if (dataMatches) {
        console.log('✅ Player data persisted correctly after navigation');
        this.testResults.passed++;
      } else {
        console.log('❌ Player data persistence failed');
        this.testResults.failed++;
        this.bugs.push({
          type: 'data_persistence_failure',
          severity: 'high',
          message: 'Player data not preserved after navigation',
          initialData: initialPlayerData,
          afterNavigationData: afterNavigationData,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      this.testResults.failed++;
      this.bugs.push({
        type: 'persistence_test_error',
        severity: 'high',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log('❌ Error testing player data persistence:', error.message);
    }
  }

  async testMemoryLeaks() {
    console.log('🧪 Testing for memory leaks in polling mechanism...');
    
    try {
      // Check initial memory usage
      const initialMemory = await this.page.evaluate(() => performance.memory?.usedJSHeapSize);
      
      // Navigate to match page multiple times to trigger multiple subscriptions
      for (let i = 0; i < 5; i++) {
        await this.page.goto('http://localhost:3000/match/6');
        await this.page.waitForTimeout(2000); // Let polling start
        await this.page.goto('http://localhost:3000/matches');
        await this.page.waitForTimeout(1000);
      }

      // Force garbage collection if available
      await this.page.evaluate(() => {
        if (window.gc) window.gc();
      });

      await this.page.waitForTimeout(2000);

      // Check final memory usage
      const finalMemory = await this.page.evaluate(() => performance.memory?.usedJSHeapSize);
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB
        console.log(`Memory usage increased by ${memoryIncrease.toFixed(2)} MB`);
        
        if (memoryIncrease > 10) { // Flag if memory increased by more than 10MB
          this.bugs.push({
            type: 'memory_leak',
            severity: 'high',
            message: `Potential memory leak detected: ${memoryIncrease.toFixed(2)} MB increase`,
            initialMemory,
            finalMemory,
            timestamp: new Date().toISOString()
          });
          console.log('⚠️ Potential memory leak detected');
        } else {
          console.log('✅ No significant memory leaks detected');
          this.testResults.passed++;
        }
      } else {
        console.log('⚠️ Memory monitoring not available in this browser');
      }

    } catch (error) {
      this.bugs.push({
        type: 'memory_test_error',
        severity: 'medium',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log('❌ Error testing for memory leaks:', error.message);
    }
  }

  async testNullUndefinedPlayerData() {
    console.log('🧪 Testing edge cases with null/undefined player data...');
    
    try {
      // Test what happens when player data is missing
      await this.page.evaluate(() => {
        // Simulate null player data scenario
        if (window.React && window.React.version) {
          // Try to trigger the scenario where player data might be null
          const event = new CustomEvent('storage', {
            detail: {
              key: 'mrvl_live_match_6',
              newValue: JSON.stringify({
                data: {
                  maps: [
                    {
                      team1_composition: null,
                      team2_composition: undefined,
                      team1_players: [],
                      team2_players: null
                    }
                  ]
                }
              })
            }
          });
          window.dispatchEvent(event);
        }
      });

      await this.page.waitForTimeout(1000);

      // Check if the page handles null data gracefully
      const hasError = await this.page.evaluate(() => {
        return document.querySelector('[data-testid="error-boundary"]') !== null;
      });

      const playerTables = await this.page.$$('tbody');
      const emptyStateMessage = await this.page.textContent('text=No player data available');

      if (!hasError && (emptyStateMessage || playerTables.length > 0)) {
        console.log('✅ Null/undefined player data handled gracefully');
        this.testResults.passed++;
      } else {
        console.log('❌ Poor handling of null/undefined player data');
        this.testResults.failed++;
        this.bugs.push({
          type: 'null_data_handling',
          severity: 'medium',
          message: 'Application crashes or behaves poorly with null/undefined player data',
          hasError,
          emptyStateMessage: !!emptyStateMessage,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      this.bugs.push({
        type: 'null_data_test_error',
        severity: 'medium',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log('❌ Error testing null/undefined data handling:', error.message);
    }
  }

  async testRaceConditions() {
    console.log('🧪 Testing for race conditions in update logic...');
    
    try {
      await this.page.goto('http://localhost:3000/match/6');
      await this.page.waitForSelector('.min-h-screen', { timeout: 10000 });

      // Simulate rapid updates that could cause race conditions
      await this.page.evaluate(() => {
        // Trigger multiple simultaneous localStorage updates
        const updates = [
          { team1_score: 1, team2_score: 0 },
          { team1_score: 1, team2_score: 1 },
          { team1_score: 2, team2_score: 1 },
          { current_map: 2 },
          { status: 'live' }
        ];

        updates.forEach((update, index) => {
          setTimeout(() => {
            const event = new CustomEvent('storage', {
              detail: {
                key: 'mrvl_live_match_6',
                newValue: JSON.stringify({
                  data: update,
                  timestamp: Date.now() + index
                })
              }
            });
            window.dispatchEvent(event);
          }, index * 10); // Rapid succession
        });
      });

      await this.page.waitForTimeout(2000);

      // Check if the final state is consistent
      const scoreElements = await this.page.$$('.text-4xl');
      const scores = await Promise.all(scoreElements.map(el => el.textContent()));
      
      console.log('Final scores after rapid updates:', scores);

      // Basic consistency check - scores should be numbers
      const validScores = scores.every(score => !isNaN(parseInt(score)));

      if (validScores) {
        console.log('✅ No obvious race condition issues detected');
        this.testResults.passed++;
      } else {
        console.log('❌ Potential race condition detected in score updates');
        this.testResults.failed++;
        this.bugs.push({
          type: 'race_condition',
          severity: 'high',
          message: 'Inconsistent state after rapid updates',
          finalScores: scores,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      this.bugs.push({
        type: 'race_condition_test_error',
        severity: 'medium',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log('❌ Error testing race conditions:', error.message);
    }
  }

  async testEventListenerCleanup() {
    console.log('🧪 Testing cleanup of event listeners and intervals...');
    
    try {
      // Check initial listener count
      const initialListeners = await this.page.evaluate(() => {
        return {
          storage: window.addEventListener.length || 0,
          intervals: Object.keys(window).filter(key => key.includes('interval')).length
        };
      });

      // Navigate to match page and back multiple times
      for (let i = 0; i < 3; i++) {
        await this.page.goto('http://localhost:3000/match/6');
        await this.page.waitForTimeout(1000);
        await this.page.goto('http://localhost:3000/matches');
        await this.page.waitForTimeout(500);
      }

      // Check final listener count
      const finalListeners = await this.page.evaluate(() => {
        return {
          storage: window.addEventListener.length || 0,
          intervals: Object.keys(window).filter(key => key.includes('interval')).length
        };
      });

      // Check if LiveScoreSync is properly cleaning up
      const liveScoreSyncState = await this.page.evaluate(() => {
        if (window.__liveScoreSync) {
          return {
            listenersSize: window.__liveScoreSync.listeners?.size || 0,
            pollingsSize: window.__liveScoreSync.pollingIntervals?.size || 0
          };
        }
        return null;
      });

      console.log('LiveScoreSync state:', liveScoreSyncState);

      if (liveScoreSyncState && liveScoreSyncState.pollingsSize === 0) {
        console.log('✅ Event listeners and intervals cleaned up properly');
        this.testResults.passed++;
      } else {
        console.log('❌ Potential memory leak from uncleaned listeners/intervals');
        this.testResults.failed++;
        this.bugs.push({
          type: 'cleanup_failure',
          severity: 'medium',
          message: 'Event listeners or intervals not properly cleaned up',
          initialListeners,
          finalListeners,
          liveScoreSyncState,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      this.bugs.push({
        type: 'cleanup_test_error',
        severity: 'medium',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log('❌ Error testing cleanup:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive bug hunt for MatchDetailPage...\n');

    await this.init();

    const tests = [
      () => this.testMatchDetailPageLoad(),
      () => this.testMapSwitching(),
      () => this.testPlayerDataPersistence(),
      () => this.testMemoryLeaks(),
      () => this.testNullUndefinedPlayerData(),
      () => this.testRaceConditions(),
      () => this.testEventListenerCleanup()
    ];

    for (const test of tests) {
      try {
        await test();
        console.log(''); // Add spacing between tests
      } catch (error) {
        console.error('Test execution error:', error);
        this.testResults.errors.push(error.message);
      }
    }

    await this.generateReport();
    await this.browser.close();
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 BUG HUNT REPORT - MATCH DETAIL PAGE');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⚠️ Errors: ${this.testResults.errors.length}`);

    if (this.bugs.length > 0) {
      console.log(`\n🐛 Issues Found: ${this.bugs.length}\n`);
      
      // Group bugs by severity
      const criticalBugs = this.bugs.filter(bug => bug.severity === 'critical');
      const highBugs = this.bugs.filter(bug => bug.severity === 'high');
      const mediumBugs = this.bugs.filter(bug => bug.severity === 'medium');
      const lowBugs = this.bugs.filter(bug => bug.severity === 'low');

      if (criticalBugs.length > 0) {
        console.log(`🚨 CRITICAL ISSUES (${criticalBugs.length}):`);
        criticalBugs.forEach((bug, index) => {
          console.log(`${index + 1}. ${bug.type}: ${bug.message}`);
          if (bug.details) console.log(`   Details: ${JSON.stringify(bug.details)}`);
        });
        console.log('');
      }

      if (highBugs.length > 0) {
        console.log(`⚠️ HIGH PRIORITY ISSUES (${highBugs.length}):`);
        highBugs.forEach((bug, index) => {
          console.log(`${index + 1}. ${bug.type}: ${bug.message}`);
          if (bug.details) console.log(`   Details: ${JSON.stringify(bug.details)}`);
        });
        console.log('');
      }

      if (mediumBugs.length > 0) {
        console.log(`🔶 MEDIUM PRIORITY ISSUES (${mediumBugs.length}):`);
        mediumBugs.forEach((bug, index) => {
          console.log(`${index + 1}. ${bug.type}: ${bug.message}`);
        });
        console.log('');
      }
    } else {
      console.log('\n🎉 No bugs detected! The MatchDetailPage appears to be functioning correctly.');
    }

    console.log('='.repeat(80));
    console.log('End of Bug Hunt Report');
    console.log('='.repeat(80));
  }
}

// Run the bug hunt
if (require.main === module) {
  const bugHunter = new MatchDetailBugHunter();
  bugHunter.runAllTests().catch(console.error);
}

module.exports = MatchDetailBugHunter;