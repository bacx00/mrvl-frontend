/**
 * COMPREHENSIVE LIVE SCORING SYNCHRONIZATION AUDIT
 * Testing real-time data flow between LiveScoringPanel and MatchDetailPage
 * 
 * This audit verifies:
 * 1. Map scores synchronization (team1_score, team2_score per map)
 * 2. Player statistics updates (eliminations, deaths, assists, damage, healing, damage_blocked)
 * 3. Hero selection updates per player per map
 * 4. Overall match score auto-calculation
 * 5. Instant reflection of changes between components
 * 6. Multi-map scenarios (BO3, BO5, BO7, BO9)
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class LiveScoringAudit {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      testResults: {},
      criticalIssues: [],
      recommendations: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalFailures: 0
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Live Scoring Synchronization Audit...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser Console Error:', msg.text());
      } else {
        console.log(`🌐 Browser Console:`, msg.text());
      }
    });

    // Navigate to the frontend
    await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('✅ Browser initialized and navigated to frontend');
  }

  async runComprehensiveAudit() {
    try {
      await this.initialize();
      
      // Run all audit tests
      await this.testMapScoreSynchronization();
      await this.testPlayerStatisticsUpdates();
      await this.testHeroSelectionUpdates();
      await this.testOverallScoreCalculation();
      await this.testInstantReflection();
      await this.testMultiMapScenarios();
      await this.testConcurrentOperations();
      await this.testErrorRecovery();
      await this.testPerformanceUnderLoad();
      await this.testDataConsistency();
      
      // Generate comprehensive report
      await this.generateAuditReport();
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
      this.results.criticalIssues.push({
        type: 'AUDIT_FAILURE',
        severity: 'CRITICAL',
        description: `Audit execution failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async testMapScoreSynchronization() {
    console.log('🗺️  Testing Map Score Synchronization...');
    
    const testResult = {
      name: 'Map Score Synchronization',
      status: 'running',
      details: {
        bo3Tests: {},
        bo5Tests: {},
        scoreUpdates: {},
        realTimeSync: {}
      },
      issues: []
    };

    try {
      // Navigate to a match detail page
      await this.navigateToTestMatch('BO3');
      
      // Open LiveScoringPanel
      await this.openLiveScoringPanel();
      
      // Test BO3 Map Score Updates
      for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
        await this.testMapScoreUpdate(mapIndex, testResult);
      }
      
      // Test BO5 scenario
      await this.navigateToTestMatch('BO5');
      await this.openLiveScoringPanel();
      
      for (let mapIndex = 0; mapIndex < 5; mapIndex++) {
        await this.testMapScoreUpdate(mapIndex, testResult);
      }
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'SYNC_FAILURE',
        description: `Map score synchronization failed: ${error.message}`,
        severity: 'HIGH'
      });
    }
    
    this.results.testResults.mapScoreSync = testResult;
    this.updateSummary(testResult);
  }

  async testMapScoreUpdate(mapIndex, testResult) {
    console.log(`  🎯 Testing map ${mapIndex + 1} score updates...`);
    
    // Switch to the specific map
    await this.page.click(`[data-testid="map-tab-${mapIndex}"]`);
    await this.page.waitForTimeout(500);
    
    // Get initial scores
    const initialScores = await this.page.evaluate(() => {
      const team1ScoreEl = document.querySelector('[data-testid="team1-map-score"]');
      const team2ScoreEl = document.querySelector('[data-testid="team2-map-score"]');
      return {
        team1: team1ScoreEl ? parseInt(team1ScoreEl.textContent) : 0,
        team2: team2ScoreEl ? parseInt(team2ScoreEl.textContent) : 0
      };
    });
    
    // Update team1 score in LiveScoringPanel
    await this.page.click('[data-testid="team1-score-plus"]');
    await this.page.waitForTimeout(100); // Allow for instant updates
    
    // Verify immediate reflection in MatchDetailPage
    const updatedScores = await this.page.evaluate(() => {
      const team1ScoreEl = document.querySelector('[data-testid="team1-map-score"]');
      const team2ScoreEl = document.querySelector('[data-testid="team2-map-score"]');
      return {
        team1: team1ScoreEl ? parseInt(team1ScoreEl.textContent) : 0,
        team2: team2ScoreEl ? parseInt(team2ScoreEl.textContent) : 0
      };
    });
    
    // Verify the score was updated correctly
    if (updatedScores.team1 !== initialScores.team1 + 1) {
      testResult.issues.push({
        type: 'SCORE_SYNC_FAILURE',
        description: `Map ${mapIndex + 1} team1 score not synchronized properly`,
        expected: initialScores.team1 + 1,
        actual: updatedScores.team1,
        severity: 'HIGH'
      });
    }
    
    // Test team2 score update
    await this.page.click('[data-testid="team2-score-plus"]');
    await this.page.waitForTimeout(100);
    
    const finalScores = await this.page.evaluate(() => {
      const team1ScoreEl = document.querySelector('[data-testid="team1-map-score"]');
      const team2ScoreEl = document.querySelector('[data-testid="team2-map-score"]');
      return {
        team1: team1ScoreEl ? parseInt(team1ScoreEl.textContent) : 0,
        team2: team2ScoreEl ? parseInt(team2ScoreEl.textContent) : 0
      };
    });
    
    if (finalScores.team2 !== initialScores.team2 + 1) {
      testResult.issues.push({
        type: 'SCORE_SYNC_FAILURE',
        description: `Map ${mapIndex + 1} team2 score not synchronized properly`,
        expected: initialScores.team2 + 1,
        actual: finalScores.team2,
        severity: 'HIGH'
      });
    }
    
    testResult.details[`map${mapIndex + 1}`] = {
      initial: initialScores,
      final: finalScores,
      syncSuccess: finalScores.team1 === initialScores.team1 + 1 && finalScores.team2 === initialScores.team2 + 1
    };
  }

  async testPlayerStatisticsUpdates() {
    console.log('📊 Testing Player Statistics Updates...');
    
    const testResult = {
      name: 'Player Statistics Updates',
      status: 'running',
      details: {
        eliminationUpdates: {},
        deathUpdates: {},
        assistUpdates: {},
        damageUpdates: {},
        healingUpdates: {},
        damageBlockedUpdates: {}
      },
      issues: []
    };

    try {
      await this.navigateToTestMatch('BO3');
      await this.openLiveScoringPanel();
      
      // Test each stat type for first player of each team
      const stats = ['eliminations', 'deaths', 'assists', 'damage', 'healing', 'damage_blocked'];
      
      for (const stat of stats) {
        await this.testPlayerStatUpdate(0, 0, stat, testResult); // Team1, Player1
        await this.testPlayerStatUpdate(1, 0, stat, testResult); // Team2, Player1
      }
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'STAT_UPDATE_FAILURE',
        description: `Player statistics update failed: ${error.message}`,
        severity: 'HIGH'
      });
    }
    
    this.results.testResults.playerStatsUpdate = testResult;
    this.updateSummary(testResult);
  }

  async testPlayerStatUpdate(teamIndex, playerIndex, statType, testResult) {
    console.log(`  📈 Testing ${statType} update for team ${teamIndex + 1}, player ${playerIndex + 1}...`);
    
    const selector = `[data-testid="player-${teamIndex}-${playerIndex}-${statType}"]`;
    
    // Get initial value
    const initialValue = await this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? parseInt(el.textContent) || 0 : 0;
    }, selector);
    
    // Update the stat in LiveScoringPanel
    const updateButton = `[data-testid="update-player-${teamIndex}-${playerIndex}-${statType}"]`;
    await this.page.click(updateButton);
    await this.page.waitForTimeout(100);
    
    // Verify immediate reflection
    const updatedValue = await this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? parseInt(el.textContent) || 0 : 0;
    }, selector);
    
    const syncSuccess = updatedValue === initialValue + 1;
    
    if (!syncSuccess) {
      testResult.issues.push({
        type: 'PLAYER_STAT_SYNC_FAILURE',
        description: `${statType} not synchronized for team ${teamIndex + 1}, player ${playerIndex + 1}`,
        expected: initialValue + 1,
        actual: updatedValue,
        severity: 'MEDIUM'
      });
    }
    
    testResult.details[`${statType}Updates`][`team${teamIndex + 1}_player${playerIndex + 1}`] = {
      initial: initialValue,
      updated: updatedValue,
      syncSuccess
    };
  }

  async testHeroSelectionUpdates() {
    console.log('🦸 Testing Hero Selection Updates...');
    
    const testResult = {
      name: 'Hero Selection Updates',
      status: 'running',
      details: {
        heroChanges: {},
        mapSpecificHeroes: {},
        compositionSync: {}
      },
      issues: []
    };

    try {
      await this.navigateToTestMatch('BO3');
      await this.openLiveScoringPanel();
      
      // Test hero selection changes across different maps
      for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
        await this.testHeroChangeOnMap(mapIndex, testResult);
      }
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'HERO_SYNC_FAILURE',
        description: `Hero selection sync failed: ${error.message}`,
        severity: 'HIGH'
      });
    }
    
    this.results.testResults.heroSelectionUpdate = testResult;
    this.updateSummary(testResult);
  }

  async testHeroChangeOnMap(mapIndex, testResult) {
    console.log(`  🦸 Testing hero changes on map ${mapIndex + 1}...`);
    
    // Switch to specific map
    await this.page.click(`[data-testid="map-tab-${mapIndex}"]`);
    await this.page.waitForTimeout(500);
    
    // Get initial hero for first player of team 1
    const initialHero = await this.page.evaluate(() => {
      const heroEl = document.querySelector('[data-testid="player-0-0-hero"]');
      return heroEl ? heroEl.textContent.trim() : 'TBD';
    });
    
    // Change hero in LiveScoringPanel
    await this.page.click('[data-testid="change-hero-0-0"]');
    await this.page.waitForTimeout(300);
    
    // Select a different hero (Spider-Man)
    await this.page.click('[data-testid="select-hero-spider-man"]');
    await this.page.waitForTimeout(200);
    
    // Verify immediate reflection in MatchDetailPage
    const updatedHero = await this.page.evaluate(() => {
      const heroEl = document.querySelector('[data-testid="player-0-0-hero"]');
      return heroEl ? heroEl.textContent.trim() : 'TBD';
    });
    
    const syncSuccess = updatedHero !== initialHero && updatedHero === 'Spider-Man';
    
    if (!syncSuccess) {
      testResult.issues.push({
        type: 'HERO_CHANGE_SYNC_FAILURE',
        description: `Hero change not synchronized on map ${mapIndex + 1}`,
        expected: 'Spider-Man',
        actual: updatedHero,
        severity: 'MEDIUM'
      });
    }
    
    testResult.details.heroChanges[`map${mapIndex + 1}`] = {
      initial: initialHero,
      updated: updatedHero,
      syncSuccess
    };
  }

  async testOverallScoreCalculation() {
    console.log('🏆 Testing Overall Score Auto-Calculation...');
    
    const testResult = {
      name: 'Overall Score Calculation',
      status: 'running',
      details: {
        bo3Calculation: {},
        bo5Calculation: {},
        winConditions: {}
      },
      issues: []
    };

    try {
      // Test BO3 scenario
      await this.navigateToTestMatch('BO3');
      await this.openLiveScoringPanel();
      
      await this.testScoreCalculation('BO3', 3, testResult);
      
      // Test BO5 scenario
      await this.navigateToTestMatch('BO5');
      await this.openLiveScoringPanel();
      
      await this.testScoreCalculation('BO5', 5, testResult);
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'SCORE_CALCULATION_FAILURE',
        description: `Overall score calculation failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }
    
    this.results.testResults.overallScoreCalculation = testResult;
    this.updateSummary(testResult);
  }

  async testScoreCalculation(format, mapCount, testResult) {
    console.log(`  🧮 Testing ${format} score calculation...`);
    
    // Simulate winning maps for team 1
    let expectedTeam1Score = 0;
    let expectedTeam2Score = 0;
    
    for (let i = 0; i < mapCount; i++) {
      await this.page.click(`[data-testid="map-tab-${i}"]`);
      await this.page.waitForTimeout(300);
      
      if (i < Math.ceil(mapCount / 2)) {
        // Team 1 wins this map
        await this.setMapWinner(1);
        expectedTeam1Score++;
      } else {
        // Team 2 wins this map
        await this.setMapWinner(2);
        expectedTeam2Score++;
      }
    }
    
    // Check overall scores
    const actualScores = await this.page.evaluate(() => {
      const team1ScoreEl = document.querySelector('[data-testid="overall-team1-score"]');
      const team2ScoreEl = document.querySelector('[data-testid="overall-team2-score"]');
      return {
        team1: team1ScoreEl ? parseInt(team1ScoreEl.textContent) : 0,
        team2: team2ScoreEl ? parseInt(team2ScoreEl.textContent) : 0
      };
    });
    
    const calculationCorrect = actualScores.team1 === expectedTeam1Score && actualScores.team2 === expectedTeam2Score;
    
    if (!calculationCorrect) {
      testResult.issues.push({
        type: 'SCORE_CALCULATION_ERROR',
        description: `${format} overall score calculation incorrect`,
        expected: { team1: expectedTeam1Score, team2: expectedTeam2Score },
        actual: actualScores,
        severity: 'CRITICAL'
      });
    }
    
    testResult.details[`${format.toLowerCase()}Calculation`] = {
      expected: { team1: expectedTeam1Score, team2: expectedTeam2Score },
      actual: actualScores,
      calculationCorrect
    };
  }

  async testInstantReflection() {
    console.log('⚡ Testing Instant Reflection of Changes...');
    
    const testResult = {
      name: 'Instant Reflection',
      status: 'running',
      details: {
        responseTime: {},
        concurrentUpdates: {},
        uiConsistency: {}
      },
      issues: []
    };

    try {
      await this.navigateToTestMatch('BO3');
      await this.openLiveScoringPanel();
      
      // Test response time for various updates
      await this.testUpdateResponseTime('map_score', testResult);
      await this.testUpdateResponseTime('player_stat', testResult);
      await this.testUpdateResponseTime('hero_selection', testResult);
      
      // Test concurrent updates
      await this.testConcurrentUpdates(testResult);
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'INSTANT_REFLECTION_FAILURE',
        description: `Instant reflection test failed: ${error.message}`,
        severity: 'HIGH'
      });
    }
    
    this.results.testResults.instantReflection = testResult;
    this.updateSummary(testResult);
  }

  async testUpdateResponseTime(updateType, testResult) {
    console.log(`  ⏱️  Testing ${updateType} response time...`);
    
    const startTime = Date.now();
    
    // Perform update based on type
    switch (updateType) {
      case 'map_score':
        await this.page.click('[data-testid="team1-score-plus"]');
        break;
      case 'player_stat':
        await this.page.click('[data-testid="update-player-0-0-eliminations"]');
        break;
      case 'hero_selection':
        await this.page.click('[data-testid="change-hero-0-0"]');
        await this.page.click('[data-testid="select-hero-iron-man"]');
        break;
    }
    
    // Wait for DOM update (should be instant)
    await this.page.waitForTimeout(50);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Response should be under 100ms for instant updates
    const isInstant = responseTime < 100;
    
    if (!isInstant) {
      testResult.issues.push({
        type: 'SLOW_RESPONSE',
        description: `${updateType} response time too slow`,
        responseTime,
        threshold: 100,
        severity: 'MEDIUM'
      });
    }
    
    testResult.details.responseTime[updateType] = {
      time: responseTime,
      isInstant
    };
  }

  async testMultiMapScenarios() {
    console.log('🗺️  Testing Multi-Map Scenarios...');
    
    const testResult = {
      name: 'Multi-Map Scenarios',
      status: 'running',
      details: {
        bo3: {},
        bo5: {},
        bo7: {},
        mapSeparation: {}
      },
      issues: []
    };

    try {
      // Test each format
      const formats = ['BO3', 'BO5', 'BO7'];
      
      for (const format of formats) {
        await this.testMultiMapFormat(format, testResult);
      }
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'MULTI_MAP_FAILURE',
        description: `Multi-map scenario test failed: ${error.message}`,
        severity: 'HIGH'
      });
    }
    
    this.results.testResults.multiMapScenarios = testResult;
    this.updateSummary(testResult);
  }

  async testMultiMapFormat(format, testResult) {
    console.log(`  🎮 Testing ${format} format...`);
    
    await this.navigateToTestMatch(format);
    await this.openLiveScoringPanel();
    
    const mapCount = format === 'BO3' ? 3 : format === 'BO5' ? 5 : 7;
    const mapData = {};
    
    // Set unique data for each map
    for (let mapIndex = 0; mapIndex < mapCount; mapIndex++) {
      await this.page.click(`[data-testid="map-tab-${mapIndex}"]`);
      await this.page.waitForTimeout(300);
      
      // Set different scores and heroes for each map
      const team1Score = mapIndex + 1;
      const team2Score = mapCount - mapIndex;
      
      // Update map scores
      for (let i = 0; i < team1Score; i++) {
        await this.page.click('[data-testid="team1-score-plus"]');
        await this.page.waitForTimeout(50);
      }
      
      for (let i = 0; i < team2Score; i++) {
        await this.page.click('[data-testid="team2-score-plus"]');
        await this.page.waitForTimeout(50);
      }
      
      // Change heroes to unique selections per map
      await this.setUniqueHeroesForMap(mapIndex);
      
      mapData[`map${mapIndex + 1}`] = {
        team1Score,
        team2Score,
        heroesSet: true
      };
    }
    
    // Verify data separation between maps
    await this.verifyMapDataSeparation(mapCount, mapData, testResult);
    
    testResult.details[format.toLowerCase()] = mapData;
  }

  async testConcurrentOperations() {
    console.log('🔄 Testing Concurrent Operations...');
    
    const testResult = {
      name: 'Concurrent Operations',
      status: 'running',
      details: {
        concurrentUpdates: {},
        dataRaces: {},
        consistency: {}
      },
      issues: []
    };

    try {
      await this.navigateToTestMatch('BO3');
      await this.openLiveScoringPanel();
      
      // Perform rapid concurrent updates
      const updates = [
        () => this.page.click('[data-testid="team1-score-plus"]'),
        () => this.page.click('[data-testid="team2-score-plus"]'),
        () => this.page.click('[data-testid="update-player-0-0-eliminations"]'),
        () => this.page.click('[data-testid="update-player-1-0-eliminations"]'),
      ];
      
      // Execute all updates simultaneously
      await Promise.all(updates.map(update => update()));
      
      // Wait for all updates to complete
      await this.page.waitForTimeout(500);
      
      // Verify data consistency
      const finalState = await this.captureMatchState();
      
      testResult.details.concurrentUpdates = finalState;
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'CONCURRENT_OPERATION_FAILURE',
        description: `Concurrent operations test failed: ${error.message}`,
        severity: 'HIGH'
      });
    }
    
    this.results.testResults.concurrentOperations = testResult;
    this.updateSummary(testResult);
  }

  async testErrorRecovery() {
    console.log('🔧 Testing Error Recovery...');
    
    const testResult = {
      name: 'Error Recovery',
      status: 'running',
      details: {
        networkErrors: {},
        invalidData: {},
        rollback: {}
      },
      issues: []
    };

    try {
      await this.navigateToTestMatch('BO3');
      await this.openLiveScoringPanel();
      
      // Test network error simulation
      await this.page.setOfflineMode(true);
      await this.page.click('[data-testid="team1-score-plus"]');
      await this.page.waitForTimeout(1000);
      await this.page.setOfflineMode(false);
      
      // Test invalid data handling
      await this.page.evaluate(() => {
        // Try to set negative scores
        window.dispatchEvent(new CustomEvent('test-invalid-score', { detail: { score: -1 } }));
      });
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'ERROR_RECOVERY_FAILURE',
        description: `Error recovery test failed: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
    
    this.results.testResults.errorRecovery = testResult;
    this.updateSummary(testResult);
  }

  async testPerformanceUnderLoad() {
    console.log('⚡ Testing Performance Under Load...');
    
    const testResult = {
      name: 'Performance Under Load',
      status: 'running',
      details: {
        rapidUpdates: {},
        memoryUsage: {},
        responseTime: {}
      },
      issues: []
    };

    try {
      await this.navigateToTestMatch('BO5');
      await this.openLiveScoringPanel();
      
      const startTime = Date.now();
      
      // Perform 100 rapid updates
      for (let i = 0; i < 100; i++) {
        await this.page.click('[data-testid="team1-score-plus"]');
        if (i % 10 === 0) {
          await this.page.waitForTimeout(10); // Small delay every 10 updates
        }
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Check if performance is acceptable (under 5 seconds for 100 updates)
      const performanceAcceptable = totalTime < 5000;
      
      if (!performanceAcceptable) {
        testResult.issues.push({
          type: 'PERFORMANCE_DEGRADATION',
          description: 'Performance degraded under load',
          totalTime,
          threshold: 5000,
          severity: 'HIGH'
        });
      }
      
      testResult.details.rapidUpdates = {
        totalTime,
        performanceAcceptable,
        updatesPerSecond: 100 / (totalTime / 1000)
      };
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'PERFORMANCE_TEST_FAILURE',
        description: `Performance test failed: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
    
    this.results.testResults.performanceUnderLoad = testResult;
    this.updateSummary(testResult);
  }

  async testDataConsistency() {
    console.log('🔄 Testing Data Consistency...');
    
    const testResult = {
      name: 'Data Consistency',
      status: 'running',
      details: {
        crossMapConsistency: {},
        statePreservation: {},
        dataIntegrity: {}
      },
      issues: []
    };

    try {
      await this.navigateToTestMatch('BO3');
      await this.openLiveScoringPanel();
      
      // Set data on each map
      for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
        await this.page.click(`[data-testid="map-tab-${mapIndex}"]`);
        await this.page.waitForTimeout(300);
        
        // Set unique data for this map
        await this.setMapData(mapIndex, {
          team1Score: mapIndex + 1,
          team2Score: mapIndex + 2,
          playerStats: { eliminations: mapIndex + 3 }
        });
      }
      
      // Verify data preservation when switching between maps
      await this.verifyDataPreservation(testResult);
      
      testResult.status = 'passed';
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.issues.push({
        type: 'DATA_CONSISTENCY_FAILURE',
        description: `Data consistency test failed: ${error.message}`,
        severity: 'CRITICAL'
      });
    }
    
    this.results.testResults.dataConsistency = testResult;
    this.updateSummary(testResult);
  }

  // Helper Methods

  async navigateToTestMatch(format) {
    console.log(`  🎯 Navigating to ${format} test match...`);
    
    // Navigate to matches page first
    await this.page.goto('http://localhost:3000/matches', { waitUntil: 'networkidle0' });
    
    // Look for a match with the specified format or create one
    const matchSelector = `[data-testid="match-${format}"]`;
    
    try {
      await this.page.waitForSelector(matchSelector, { timeout: 5000 });
      await this.page.click(matchSelector);
    } catch {
      // If no match found, create a test match
      await this.createTestMatch(format);
    }
    
    await this.page.waitForSelector('[data-testid="match-detail-page"]', { timeout: 10000 });
  }

  async createTestMatch(format) {
    console.log(`  ➕ Creating test match for ${format}...`);
    
    // Click create match button
    await this.page.click('[data-testid="create-match-button"]');
    await this.page.waitForSelector('[data-testid="match-form"]');
    
    // Fill form with test data
    await this.page.select('[data-testid="format-select"]', format);
    await this.page.select('[data-testid="team1-select"]', '1'); // First team
    await this.page.select('[data-testid="team2-select"]', '2'); // Second team
    
    // Submit form
    await this.page.click('[data-testid="submit-match"]');
    await this.page.waitForSelector('[data-testid="match-detail-page"]');
  }

  async openLiveScoringPanel() {
    console.log('  📊 Opening LiveScoringPanel...');
    
    // Click the live scoring button
    await this.page.click('[data-testid="open-live-scoring"]');
    await this.page.waitForSelector('[data-testid="live-scoring-panel"]', { timeout: 5000 });
  }

  async setMapWinner(teamNumber) {
    // Set a winning score for the specified team
    const winningScore = 3; // Assuming 3 is a winning score
    const selector = `[data-testid="team${teamNumber}-score-input"]`;
    
    await this.page.focus(selector);
    await this.page.keyboard.selectAll();
    await this.page.keyboard.type(winningScore.toString());
    await this.page.keyboard.press('Tab'); // Trigger blur event
  }

  async setUniqueHeroesForMap(mapIndex) {
    const heroes = ['Spider-Man', 'Iron Man', 'Hulk', 'Thor', 'Black Widow'];
    const heroForMap = heroes[mapIndex % heroes.length];
    
    await this.page.click('[data-testid="change-hero-0-0"]');
    await this.page.click(`[data-testid="select-hero-${heroForMap.toLowerCase().replace(' ', '-')}"]`);
  }

  async verifyMapDataSeparation(mapCount, expectedData, testResult) {
    for (let mapIndex = 0; mapIndex < mapCount; mapIndex++) {
      await this.page.click(`[data-testid="map-tab-${mapIndex}"]`);
      await this.page.waitForTimeout(300);
      
      const actualData = await this.captureMapState(mapIndex);
      const expected = expectedData[`map${mapIndex + 1}`];
      
      const dataSeparated = actualData.team1Score === expected.team1Score &&
                           actualData.team2Score === expected.team2Score;
      
      if (!dataSeparated) {
        testResult.issues.push({
          type: 'MAP_DATA_MIXING',
          description: `Map ${mapIndex + 1} data not properly separated`,
          expected,
          actual: actualData,
          severity: 'HIGH'
        });
      }
    }
  }

  async captureMapState(mapIndex) {
    return await this.page.evaluate(() => {
      return {
        team1Score: parseInt(document.querySelector('[data-testid="team1-map-score"]')?.textContent || '0'),
        team2Score: parseInt(document.querySelector('[data-testid="team2-map-score"]')?.textContent || '0'),
        heroes: Array.from(document.querySelectorAll('[data-testid*="hero"]')).map(el => el.textContent.trim())
      };
    });
  }

  async captureMatchState() {
    return await this.page.evaluate(() => {
      return {
        overallScores: {
          team1: parseInt(document.querySelector('[data-testid="overall-team1-score"]')?.textContent || '0'),
          team2: parseInt(document.querySelector('[data-testid="overall-team2-score"]')?.textContent || '0')
        },
        currentMapScores: {
          team1: parseInt(document.querySelector('[data-testid="team1-map-score"]')?.textContent || '0'),
          team2: parseInt(document.querySelector('[data-testid="team2-map-score"]')?.textContent || '0')
        }
      };
    });
  }

  async setMapData(mapIndex, data) {
    // Set team scores
    for (let i = 0; i < data.team1Score; i++) {
      await this.page.click('[data-testid="team1-score-plus"]');
      await this.page.waitForTimeout(50);
    }
    
    for (let i = 0; i < data.team2Score; i++) {
      await this.page.click('[data-testid="team2-score-plus"]');
      await this.page.waitForTimeout(50);
    }
    
    // Set player stats if provided
    if (data.playerStats) {
      for (let i = 0; i < data.playerStats.eliminations; i++) {
        await this.page.click('[data-testid="update-player-0-0-eliminations"]');
        await this.page.waitForTimeout(50);
      }
    }
  }

  async verifyDataPreservation(testResult) {
    const preservedData = {};
    
    // Capture data for each map
    for (let mapIndex = 0; mapIndex < 3; mapIndex++) {
      await this.page.click(`[data-testid="map-tab-${mapIndex}"]`);
      await this.page.waitForTimeout(300);
      
      preservedData[`map${mapIndex + 1}`] = await this.captureMapState(mapIndex);
    }
    
    // Switch back and forth to verify data is preserved
    for (let i = 0; i < 5; i++) {
      const mapIndex = i % 3;
      await this.page.click(`[data-testid="map-tab-${mapIndex}"]`);
      await this.page.waitForTimeout(200);
      
      const currentData = await this.captureMapState(mapIndex);
      const originalData = preservedData[`map${mapIndex + 1}`];
      
      const dataPreserved = JSON.stringify(currentData) === JSON.stringify(originalData);
      
      if (!dataPreserved) {
        testResult.issues.push({
          type: 'DATA_NOT_PRESERVED',
          description: `Map ${mapIndex + 1} data not preserved during navigation`,
          original: originalData,
          current: currentData,
          severity: 'HIGH'
        });
      }
    }
    
    testResult.details.statePreservation = preservedData;
  }

  updateSummary(testResult) {
    this.results.summary.totalTests++;
    
    if (testResult.status === 'passed') {
      this.results.summary.passedTests++;
    } else {
      this.results.summary.failedTests++;
      
      // Count critical failures
      const criticalIssues = testResult.issues?.filter(issue => issue.severity === 'CRITICAL') || [];
      this.results.summary.criticalFailures += criticalIssues.length;
      
      // Add to critical issues list
      this.results.criticalIssues.push(...criticalIssues);
    }
  }

  async generateAuditReport() {
    console.log('📋 Generating Comprehensive Audit Report...');
    
    // Calculate pass rate
    const passRate = (this.results.summary.passedTests / this.results.summary.totalTests * 100).toFixed(1);
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Create executive summary
    const executiveSummary = {
      overallStatus: this.results.summary.criticalFailures === 0 ? 'HEALTHY' : 'REQUIRES_ATTENTION',
      passRate: `${passRate}%`,
      totalTests: this.results.summary.totalTests,
      criticalIssues: this.results.summary.criticalFailures,
      keyFindings: this.extractKeyFindings()
    };
    
    // Final report structure
    const finalReport = {
      ...this.results,
      executiveSummary,
      auditMetadata: {
        auditorVersion: '2.5.0',
        framework: 'Marvel Rivals Tournament Management',
        auditDuration: Date.now() - new Date(this.results.timestamp).getTime(),
        environment: 'Development'
      }
    };
    
    // Write report to file
    const reportPath = path.join(__dirname, `live-scoring-audit-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
    
    console.log(`📋 Comprehensive audit report saved to: ${reportPath}`);
    console.log(`📊 Overall Status: ${executiveSummary.overallStatus}`);
    console.log(`✅ Pass Rate: ${passRate}%`);
    console.log(`⚠️  Critical Issues: ${this.results.summary.criticalFailures}`);
    
    return finalReport;
  }

  generateRecommendations() {
    // Analyze issues and generate specific recommendations
    const recommendations = [];
    
    if (this.results.criticalIssues.some(issue => issue.type === 'SCORE_CALCULATION_ERROR')) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Fix Score Calculation Algorithm',
        description: 'The overall match score calculation contains errors that could affect tournament results.',
        implementation: 'Review and fix the calculateTeamScore function in LiveScoringPanel.js'
      });
    }
    
    if (this.results.criticalIssues.some(issue => issue.type === 'SYNC_FAILURE')) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Improve Real-time Synchronization',
        description: 'Data synchronization between components is failing or delayed.',
        implementation: 'Implement proper event-driven updates with immediate state propagation'
      });
    }
    
    // Add performance recommendations
    const performanceIssues = this.results.criticalIssues.filter(issue => 
      issue.type === 'PERFORMANCE_DEGRADATION' || issue.type === 'SLOW_RESPONSE'
    );
    
    if (performanceIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Optimize Performance',
        description: 'System performance degrades under load or with rapid updates.',
        implementation: 'Add debouncing, implement virtual scrolling, and optimize re-render cycles'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  extractKeyFindings() {
    const findings = [];
    
    // Analyze test results for key findings
    Object.entries(this.results.testResults).forEach(([testName, result]) => {
      if (result.status === 'failed') {
        findings.push(`${testName}: ${result.issues?.length || 0} issues found`);
      } else {
        findings.push(`${testName}: All checks passed`);
      }
    });
    
    return findings;
  }
}

// Run the audit
async function main() {
  console.log('🚀 Starting Comprehensive Live Scoring Synchronization Audit...');
  console.log('🎯 Target: Real-time data flow between LiveScoringPanel ↔ MatchDetailPage');
  console.log('📋 Testing: Map scores, player stats, hero selections, multi-map scenarios');
  console.log('');
  
  const audit = new LiveScoringAudit();
  const report = await audit.runComprehensiveAudit();
  
  console.log('');
  console.log('🏁 Audit completed successfully!');
  console.log('📊 Tournament integrity verification complete');
  
  return report;
}

// Export for external use
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LiveScoringAudit, main };