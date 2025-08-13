/**
 * Live Scoring Synchronization Test
 * 
 * This file tests the real-time synchronization between SimplifiedLiveScoring 
 * and MatchDetailPage to ensure all changes reflect immediately.
 * 
 * Usage: Run this in browser console on MatchDetailPage to test sync
 */

// Test Configuration
const TEST_MATCH_ID = 1; // Change this to actual match ID
const TEST_SCENARIOS = [
  'player_stats_update',
  'hero_selection_update', 
  'map_score_update',
  'map_change_update',
  'series_score_update'
];

class LiveScoringSyncTester {
  constructor(matchId) {
    this.matchId = matchId;
    this.testResults = [];
    this.startTime = Date.now();
    
    console.log(`🧪 Starting Live Scoring Sync Tests for Match ${matchId}`);
    console.log('🎯 Testing synchronization between SimplifiedLiveScoring ↔ MatchDetailPage');
  }

  // Test 1: Player Stats Update
  testPlayerStatsUpdate() {
    console.log('\n📊 Test 1: Player Stats Update');
    
    const testData = {
      series_score_team1: 1,
      series_score_team2: 0,
      team1_score: 1,
      team2_score: 0,
      current_map_team1_score: 15,
      current_map_team2_score: 12,
      team1_players: [
        {
          id: 1,
          username: 'TestPlayer1',
          hero: 'Iron Man',
          kills: 12,
          deaths: 3,
          assists: 8,
          damage: 15000,
          healing: 0,
          blocked: 0,
          kda: '6.67'
        }
      ],
      team2_players: [
        {
          id: 2,
          username: 'TestPlayer2', 
          hero: 'Spider-Man',
          kills: 8,
          deaths: 5,
          assists: 12,
          damage: 12000,
          healing: 0,
          blocked: 0,
          kda: '4.00'
        }
      ],
      current_map: 1,
      total_maps: 3,
      maps: {
        1: { team1Score: 15, team2Score: 12, status: 'active', winner: null },
        2: { team1Score: 0, team2Score: 0, status: 'pending', winner: null },
        3: { team1Score: 0, team2Score: 0, status: 'pending', winner: null }
      },
      matchId: this.matchId,
      timestamp: Date.now(),
      source: 'TestSuite',
      type: 'player_stats_update',
      status: 'live'
    };

    return this.simulateUpdate(testData, 'Player Stats Update');
  }

  // Test 2: Hero Selection Update
  testHeroSelectionUpdate() {
    console.log('\n🦸 Test 2: Hero Selection Update');
    
    const testData = {
      series_score_team1: 1,
      series_score_team2: 0,
      team1_score: 1,
      team2_score: 0,
      team1_players: [
        {
          id: 1,
          username: 'TestPlayer1',
          hero: 'Doctor Strange', // Changed hero
          kills: 12,
          deaths: 3,
          assists: 8,
          damage: 15000,
          healing: 0,
          blocked: 0,
          kda: '6.67'
        }
      ],
      team2_players: [
        {
          id: 2,
          username: 'TestPlayer2',
          hero: 'Wolverine', // Changed hero
          kills: 8,
          deaths: 5,
          assists: 12,
          damage: 12000,
          healing: 0,
          blocked: 0,
          kda: '4.00'
        }
      ],
      current_map: 1,
      matchId: this.matchId,
      timestamp: Date.now(),
      source: 'TestSuite',
      type: 'hero_selection_update',
      status: 'live'
    };

    return this.simulateUpdate(testData, 'Hero Selection Update');
  }

  // Test 3: Map Score Update
  testMapScoreUpdate() {
    console.log('\n🗺️ Test 3: Map Score Update');
    
    const testData = {
      series_score_team1: 1,
      series_score_team2: 0,
      team1_score: 1,
      team2_score: 0,
      current_map_team1_score: 20, // Updated scores
      current_map_team2_score: 18,
      current_map: 1,
      maps: {
        1: { team1Score: 20, team2Score: 18, status: 'active', winner: null },
        2: { team1Score: 0, team2Score: 0, status: 'pending', winner: null },
        3: { team1Score: 0, team2Score: 0, status: 'pending', winner: null }
      },
      matchId: this.matchId,
      timestamp: Date.now(),
      source: 'TestSuite',
      type: 'map_score_update',
      status: 'live'
    };

    return this.simulateUpdate(testData, 'Map Score Update');
  }

  // Test 4: Map Change Update
  testMapChangeUpdate() {
    console.log('\n🔄 Test 4: Map Change Update');
    
    const testData = {
      series_score_team1: 2, // Team 1 won map 1
      series_score_team2: 0,
      team1_score: 2,
      team2_score: 0,
      current_map: 2, // Switched to map 2
      current_map_team1_score: 0,
      current_map_team2_score: 0,
      maps: {
        1: { team1Score: 25, team2Score: 20, status: 'completed', winner: 1 },
        2: { team1Score: 0, team2Score: 0, status: 'active', winner: null },
        3: { team1Score: 0, team2Score: 0, status: 'pending', winner: null }
      },
      matchId: this.matchId,
      timestamp: Date.now(),
      source: 'TestSuite',
      type: 'map_change',
      status: 'live'
    };

    return this.simulateUpdate(testData, 'Map Change Update');
  }

  // Test 5: Series Score Update
  testSeriesScoreUpdate() {
    console.log('\n🏆 Test 5: Series Score Update');
    
    const testData = {
      series_score_team1: 2,
      series_score_team2: 1, // Team 2 won a map
      team1_score: 2,
      team2_score: 1,
      current_map: 3,
      maps: {
        1: { team1Score: 25, team2Score: 20, status: 'completed', winner: 1 },
        2: { team1Score: 18, team2Score: 25, status: 'completed', winner: 2 },
        3: { team1Score: 0, team2Score: 0, status: 'active', winner: null }
      },
      matchId: this.matchId,
      timestamp: Date.now(),
      source: 'TestSuite',
      type: 'series_score_update',
      status: 'live'
    };

    return this.simulateUpdate(testData, 'Series Score Update');
  }

  // Simulate a live update through MatchLiveSync
  simulateUpdate(testData, testName) {
    const startTime = Date.now();
    
    try {
      // Method 1: Direct MatchLiveSync update (same-tab)
      if (window.matchLiveSync) {
        console.log(`📡 Broadcasting via MatchLiveSync: ${testName}`);
        window.matchLiveSync.handleLiveUpdate(this.matchId, testData);
      }
      
      // Method 2: localStorage update (cross-tab simulation)
      console.log(`💾 Broadcasting via localStorage: ${testName}`);
      localStorage.setItem(`live_match_${this.matchId}`, JSON.stringify(testData));
      
      const endTime = Date.now();
      const result = {
        test: testName,
        success: true,
        latency: endTime - startTime,
        timestamp: new Date().toISOString(),
        data: testData
      };
      
      this.testResults.push(result);
      console.log(`✅ ${testName} completed in ${result.latency}ms`);
      return result;
      
    } catch (error) {
      const result = {
        test: testName,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(result);
      console.error(`❌ ${testName} failed:`, error);
      return result;
    }
  }

  // Run all tests with delays
  async runAllTests() {
    console.log('\n🚀 Running All Live Scoring Sync Tests...\n');
    
    const tests = [
      () => this.testPlayerStatsUpdate(),
      () => this.testHeroSelectionUpdate(), 
      () => this.testMapScoreUpdate(),
      () => this.testMapChangeUpdate(),
      () => this.testSeriesScoreUpdate()
    ];

    for (let i = 0; i < tests.length; i++) {
      tests[i]();
      
      // Wait 2 seconds between tests to observe changes
      if (i < tests.length - 1) {
        console.log('⏳ Waiting 2 seconds for observation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    this.generateReport();
  }

  // Generate test report
  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.testResults.filter(r => r.success).length;
    const failureCount = this.testResults.filter(r => !r.success).length;
    
    console.log('\n📋 LIVE SCORING SYNC TEST REPORT');
    console.log('=====================================');
    console.log(`🎯 Match ID: ${this.matchId}`);
    console.log(`⏱️ Total Test Duration: ${totalTime}ms`);
    console.log(`✅ Tests Passed: ${successCount}`);
    console.log(`❌ Tests Failed: ${failureCount}`);
    console.log(`📊 Success Rate: ${((successCount / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (this.testResults.length > 0) {
      const avgLatency = this.testResults
        .filter(r => r.success && r.latency)
        .reduce((sum, r) => sum + r.latency, 0) / successCount;
      console.log(`⚡ Average Update Latency: ${avgLatency.toFixed(1)}ms`);
    }
    
    console.log('\n📝 Detailed Results:');
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const latency = result.latency ? ` (${result.latency}ms)` : '';
      const error = result.error ? ` - Error: ${result.error}` : '';
      console.log(`${index + 1}. ${status} ${result.test}${latency}${error}`);
    });

    console.log('\n🔍 Instructions for Manual Verification:');
    console.log('1. Check that the MatchDetailPage scores updated immediately');
    console.log('2. Verify that player stats, heroes, and map data changed');
    console.log('3. Confirm that map switching worked correctly');
    console.log('4. Ensure no console errors appeared during updates');
    console.log('5. Check that the live scoring panel (if open) reflected changes');
    
    return {
      matchId: this.matchId,
      totalTests: this.testResults.length,
      passed: successCount,
      failed: failureCount,
      successRate: (successCount / this.testResults.length) * 100,
      averageLatency: successCount > 0 ? this.testResults
        .filter(r => r.success && r.latency)
        .reduce((sum, r) => sum + r.latency, 0) / successCount : 0,
      results: this.testResults
    };
  }

  // Quick test for immediate verification
  static quickTest(matchId = TEST_MATCH_ID) {
    console.log('🔥 QUICK LIVE SCORING SYNC TEST');
    console.log('This will test if updates immediately reflect on MatchDetailPage');
    
    const quickData = {
      series_score_team1: 99,
      series_score_team2: 88,
      team1_score: 99,
      team2_score: 88,
      current_map_team1_score: 77,
      current_map_team2_score: 66,
      team1_players: [{
        id: 999,
        username: 'SYNC_TEST',
        hero: 'Iron Man',
        kills: 99,
        deaths: 1,
        assists: 50,
        damage: 99999,
        healing: 0,
        blocked: 0,
        kda: '149.00'
      }],
      matchId: matchId,
      timestamp: Date.now(),
      source: 'QuickTest',
      type: 'sync_verification',
      status: 'live'
    };

    // Test both methods
    if (window.matchLiveSync) {
      window.matchLiveSync.handleLiveUpdate(matchId, quickData);
    }
    localStorage.setItem(`live_match_${matchId}`, JSON.stringify(quickData));
    
    console.log('✅ Quick test fired! Check MatchDetailPage for scores 99-88 and player "SYNC_TEST"');
    return quickData;
  }
}

// Make tester available globally
window.LiveScoringSyncTester = LiveScoringSyncTester;

// Auto-run quick test if on match detail page
if (window.location.pathname.includes('/match/')) {
  console.log('🎯 Detected MatchDetailPage - Live Scoring Sync Tester Ready!');
  console.log('');
  console.log('📚 Available Commands:');
  console.log('- LiveScoringSyncTester.quickTest()  // Quick verification');
  console.log('- new LiveScoringSyncTester(matchId).runAllTests()  // Full test suite');
  console.log('');
  console.log('🚨 Run LiveScoringSyncTester.quickTest() to verify sync is working!');
}

export default LiveScoringSyncTester;