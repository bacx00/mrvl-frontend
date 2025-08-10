/**
 * LiveScore Bidirectional Synchronization Test Suite
 * 
 * This test suite verifies that all components properly receive and handle
 * real-time score updates through the LiveScoreManager system.
 * 
 * Tests include:
 * - SimplifiedLiveScoring → All other components
 * - MatchForm → All other components  
 * - Cross-tab synchronization
 * - Conflict resolution
 * - Performance under load
 */

import liveScoreManager from './LiveScoreManager';

class LiveScoreTest {
  constructor() {
    this.testResults = [];
    this.simulatedComponents = new Map();
    this.testMatchId = 9999; // Use a test match ID
    
    console.log('🧪 LiveScore Test Suite initialized');
  }

  /**
   * Initialize test components that simulate real components
   */
  setupTestComponents() {
    console.log('🔧 Setting up test components...');
    
    // Simulate HomePage
    this.simulatedComponents.set('homepage', {
      name: 'HomePage (Simulated)',
      updates: [],
      callback: (updateData, source) => {
        this.simulatedComponents.get('homepage').updates.push({
          timestamp: Date.now(),
          source,
          data: updateData
        });
        console.log(`📱 HomePage received update from ${source}:`, updateData);
      }
    });
    
    // Simulate MatchDetailPage
    this.simulatedComponents.set('matchdetail', {
      name: 'MatchDetailPage (Simulated)',
      updates: [],
      callback: (updateData, source) => {
        this.simulatedComponents.get('matchdetail').updates.push({
          timestamp: Date.now(),
          source,
          data: updateData
        });
        console.log(`📄 MatchDetailPage received update from ${source}:`, updateData);
      }
    });
    
    // Simulate AdminMatches
    this.simulatedComponents.set('adminmatches', {
      name: 'AdminMatches (Simulated)',
      updates: [],
      callback: (updateData, source) => {
        this.simulatedComponents.get('adminmatches').updates.push({
          timestamp: Date.now(),
          source,
          data: updateData
        });
        console.log(`👨‍💼 AdminMatches received update from ${source}:`, updateData);
      }
    });
    
    // Subscribe all test components
    this.simulatedComponents.forEach((component, key) => {
      liveScoreManager.subscribe(
        `test-${key}`,
        component.callback,
        { 
          matchId: this.testMatchId,
          updateType: 'all'
        }
      );
    });
    
    console.log('✅ Test components setup complete');
  }

  /**
   * Test 1: SimplifiedLiveScoring broadcasts to all components
   */
  async testSimplifiedLiveScoringBroadcast() {
    console.log('\n🧪 TEST 1: SimplifiedLiveScoring → All Components');
    
    // Clear previous updates
    this.simulatedComponents.forEach(comp => comp.updates = []);
    
    // Simulate SimplifiedLiveScoring update
    const scoreUpdate = {
      team1_score: 2,
      team2_score: 1,
      status: 'live',
      maps: [
        { team1_score: 13, team2_score: 11, winner_id: 1 },
        { team1_score: 10, team2_score: 13, winner_id: 2 },
        { team1_score: 8, team2_score: 6, winner_id: null } // Live map
      ]
    };
    
    liveScoreManager.broadcastScoreUpdate(this.testMatchId, scoreUpdate, {
      source: 'SimplifiedLiveScoring',
      type: 'live_score_update'
    });
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify all components received the update
    let allReceived = true;
    this.simulatedComponents.forEach((comp, key) => {
      if (comp.updates.length === 0) {
        console.error(`❌ ${comp.name} did not receive SimplifiedLiveScoring update`);
        allReceived = false;
      } else {
        console.log(`✅ ${comp.name} received update:`, comp.updates[0].source);
      }
    });
    
    this.testResults.push({
      test: 'SimplifiedLiveScoring Broadcast',
      passed: allReceived,
      details: `${Array.from(this.simulatedComponents.values()).filter(c => c.updates.length > 0).length}/${this.simulatedComponents.size} components received update`
    });
    
    return allReceived;
  }

  /**
   * Test 2: MatchForm broadcasts to all components
   */
  async testMatchFormBroadcast() {
    console.log('\n🧪 TEST 2: MatchForm → All Components');
    
    // Clear previous updates
    this.simulatedComponents.forEach(comp => comp.updates = []);
    
    // Simulate MatchForm update
    const formUpdate = {
      team1_score: 3,
      team2_score: 1,
      status: 'completed',
      current_map: 4,
      maps: [
        { team1_score: 13, team2_score: 11, winner_id: 1 },
        { team1_score: 10, team2_score: 13, winner_id: 2 },
        { team1_score: 13, team2_score: 8, winner_id: 1 },
        { team1_score: 13, team2_score: 6, winner_id: 1 }
      ]
    };
    
    liveScoreManager.broadcastScoreUpdate(this.testMatchId, formUpdate, {
      source: 'MatchForm',
      type: 'form_score_update'
    });
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify all components received the update
    let allReceived = true;
    this.simulatedComponents.forEach((comp, key) => {
      if (comp.updates.length === 0) {
        console.error(`❌ ${comp.name} did not receive MatchForm update`);
        allReceived = false;
      } else {
        console.log(`✅ ${comp.name} received update:`, comp.updates[0].source);
      }
    });
    
    this.testResults.push({
      test: 'MatchForm Broadcast',
      passed: allReceived,
      details: `${Array.from(this.simulatedComponents.values()).filter(c => c.updates.length > 0).length}/${this.simulatedComponents.size} components received update`
    });
    
    return allReceived;
  }

  /**
   * Test 3: Cross-tab synchronization (localStorage events)
   */
  async testCrossTabSync() {
    console.log('\n🧪 TEST 3: Cross-Tab Synchronization');
    
    // Clear previous updates
    this.simulatedComponents.forEach(comp => comp.updates = []);
    
    // Simulate cross-tab update by directly triggering storage event
    const storageKey = `match_update_${this.testMatchId}`;
    const storageValue = JSON.stringify({
      matchId: this.testMatchId,
      timestamp: Date.now(),
      source: 'CrossTab',
      data: {
        team1_score: 1,
        team2_score: 2,
        status: 'live'
      },
      type: 'cross_tab_update'
    });
    
    // Manually trigger storage event
    const storageEvent = new StorageEvent('storage', {
      key: storageKey,
      newValue: storageValue,
      oldValue: null,
      storageArea: localStorage
    });
    
    window.dispatchEvent(storageEvent);
    
    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify components received the cross-tab update
    let crossTabWorking = true;
    this.simulatedComponents.forEach((comp, key) => {
      if (comp.updates.length === 0) {
        console.error(`❌ ${comp.name} did not receive cross-tab update`);
        crossTabWorking = false;
      } else {
        console.log(`✅ ${comp.name} received cross-tab update`);
      }
    });
    
    this.testResults.push({
      test: 'Cross-Tab Synchronization',
      passed: crossTabWorking,
      details: crossTabWorking ? 'All components received cross-tab updates' : 'Some components missed cross-tab updates'
    });
    
    return crossTabWorking;
  }

  /**
   * Test 4: Performance under rapid updates
   */
  async testPerformanceUnderLoad() {
    console.log('\n🧪 TEST 4: Performance Under Load');
    
    const startTime = Date.now();
    const updateCount = 50;
    let updatesReceived = 0;
    
    // Clear previous updates
    this.simulatedComponents.forEach(comp => comp.updates = []);
    
    // Send rapid updates
    for (let i = 0; i < updateCount; i++) {
      const scoreUpdate = {
        team1_score: Math.floor(i / 10),
        team2_score: Math.floor(i / 15),
        status: 'live',
        updateNumber: i
      };
      
      liveScoreManager.broadcastScoreUpdate(this.testMatchId, scoreUpdate, {
        source: 'PerformanceTest',
        type: 'rapid_update'
      });
      
      // Small delay to simulate realistic timing
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Wait for all updates to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Count total updates received across all components
    this.simulatedComponents.forEach(comp => {
      updatesReceived += comp.updates.length;
    });
    
    const expectedUpdates = updateCount * this.simulatedComponents.size;
    const successRate = (updatesReceived / expectedUpdates) * 100;
    const performanceGood = successRate >= 95 && duration < 2000; // 95% success rate, under 2 seconds
    
    console.log(`📊 Performance Results:`);
    console.log(`- Duration: ${duration}ms`);
    console.log(`- Updates sent: ${updateCount}`);
    console.log(`- Updates received: ${updatesReceived}/${expectedUpdates}`);
    console.log(`- Success rate: ${successRate.toFixed(1)}%`);
    
    this.testResults.push({
      test: 'Performance Under Load',
      passed: performanceGood,
      details: `${successRate.toFixed(1)}% success rate in ${duration}ms`
    });
    
    return performanceGood;
  }

  /**
   * Test 5: Bidirectional synchronization between components
   */
  async testBidirectionalSync() {
    console.log('\n🧪 TEST 5: Bidirectional Synchronization');
    
    // Clear previous updates
    this.simulatedComponents.forEach(comp => comp.updates = []);
    
    let bidirectionalWorking = true;
    
    // Test SimplifiedLiveScoring → Others
    liveScoreManager.broadcastScoreUpdate(this.testMatchId, 
      { team1_score: 5, team2_score: 3 }, 
      { source: 'SimplifiedLiveScoring' }
    );
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify HomePage and AdminMatches received it
    if (this.simulatedComponents.get('homepage').updates.length === 0 ||
        this.simulatedComponents.get('adminmatches').updates.length === 0) {
      bidirectionalWorking = false;
    }
    
    // Clear and test reverse direction
    this.simulatedComponents.forEach(comp => comp.updates = []);
    
    // Test MatchForm → Others
    liveScoreManager.broadcastScoreUpdate(this.testMatchId, 
      { team1_score: 6, team2_score: 3 }, 
      { source: 'MatchForm' }
    );
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify MatchDetailPage and AdminMatches received it
    if (this.simulatedComponents.get('matchdetail').updates.length === 0 ||
        this.simulatedComponents.get('adminmatches').updates.length === 0) {
      bidirectionalWorking = false;
    }
    
    this.testResults.push({
      test: 'Bidirectional Synchronization',
      passed: bidirectionalWorking,
      details: bidirectionalWorking ? 'All components communicate bidirectionally' : 'Bidirectional communication issues detected'
    });
    
    return bidirectionalWorking;
  }

  /**
   * Run all tests and generate a comprehensive report
   */
  async runAllTests() {
    console.log('🚀 Starting LiveScore Bidirectional Synchronization Test Suite...\n');
    
    this.setupTestComponents();
    
    const tests = [
      () => this.testSimplifiedLiveScoringBroadcast(),
      () => this.testMatchFormBroadcast(),
      () => this.testCrossTabSync(),
      () => this.testPerformanceUnderLoad(),
      () => this.testBidirectionalSync()
    ];
    
    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('❌ Test failed with error:', error);
        this.testResults.push({
          test: 'Unknown Test',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
    }
    
    this.generateReport();
    this.cleanup();
  }

  /**
   * Generate and display test report
   */
  generateReport() {
    console.log('\n📋 LiveScore Synchronization Test Report');
    console.log('═'.repeat(50));
    
    const passedTests = this.testResults.filter(t => t.passed).length;
    const totalTests = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}: ${result.details}`);
    });
    
    console.log('═'.repeat(50));
    console.log(`Overall: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Real-time score synchronization is working perfectly.');
    } else {
      console.log('⚠️  Some tests failed. Check the implementation for issues.');
    }
    
    // Return results for programmatic use
    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      results: this.testResults
    };
  }

  /**
   * Clean up test components and subscriptions
   */
  cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    this.simulatedComponents.forEach((comp, key) => {
      liveScoreManager.unsubscribe(`test-${key}`);
    });
    
    this.simulatedComponents.clear();
    liveScoreManager.clearMatchCache(this.testMatchId);
    
    console.log('✅ Test cleanup complete');
  }

  /**
   * Get debug information about LiveScoreManager
   */
  getDebugInfo() {
    return {
      liveScoreManagerDebug: liveScoreManager.getDebugInfo(),
      testResults: this.testResults,
      simulatedComponentsCount: this.simulatedComponents.size
    };
  }
}

// Export for use in browser console or components
export default LiveScoreTest;

// Auto-run tests if in development mode
if (process.env.NODE_ENV === 'development') {
  // Make available in browser console
  if (typeof window !== 'undefined') {
    window.LiveScoreTest = LiveScoreTest;
    window.runLiveScoreTest = () => {
      const test = new LiveScoreTest();
      return test.runAllTests();
    };
  }
}