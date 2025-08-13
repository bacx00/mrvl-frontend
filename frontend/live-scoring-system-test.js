/**
 * Comprehensive Live Scoring System Test
 * 
 * This test verifies all components of the live scoring system are working correctly
 * after the React re-rendering fixes. Tests both SimplifiedLiveScoring and MatchDetailPage
 * integration with immediate visual updates.
 */

class LiveScoringSystemTest {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.warnings = [];
    this.currentMatch = null;
    this.testStartTime = Date.now();
  }

  /**
   * Add test result
   */
  addResult(test, passed, details = '', data = null) {
    const result = {
      test,
      passed,
      details,
      data,
      timestamp: Date.now()
    };
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${details}`);
    
    if (!passed) {
      this.errors.push(result);
    }
  }

  /**
   * Add warning
   */
  addWarning(test, message, data = null) {
    const warning = { test, message, data, timestamp: Date.now() };
    this.warnings.push(warning);
    console.warn(`⚠️ ${test}: ${message}`);
  }

  /**
   * Test 1: Verify MatchDetailPage loads and displays correctly
   */
  async testMatchDetailPageLoad() {
    console.log('\n🔄 Testing MatchDetailPage Load...');
    
    try {
      // Check if we're on a match detail page
      const currentPath = window.location.pathname;
      const matchIdMatch = currentPath.match(/\/match\/(\d+)/);
      
      if (!matchIdMatch) {
        this.addResult('MatchDetailPage Load', false, 'Not on a match detail page. Navigate to /match/[id] first');
        return false;
      }
      
      const matchId = matchIdMatch[1];
      this.currentMatch = { id: matchId };
      
      // Check for MatchDetailPage container
      const matchContainer = document.querySelector('[class*="min-h-screen"]');
      if (!matchContainer) {
        this.addResult('MatchDetailPage Load', false, 'MatchDetailPage container not found');
        return false;
      }
      
      // Check for team displays
      const teamElements = document.querySelectorAll('[class*="team"]');
      if (teamElements.length === 0) {
        this.addResult('MatchDetailPage Load', false, 'Team elements not found');
        return false;
      }
      
      // Check for score displays
      const scoreElements = document.querySelectorAll('[class*="text-4xl"], [class*="text-3xl"]');
      if (scoreElements.length === 0) {
        this.addResult('MatchDetailPage Load', false, 'Score displays not found');
        return false;
      }
      
      // Check for map navigation boxes
      const mapBoxes = document.querySelectorAll('[class*="map-box"], [class*="w-20 h-24"]');
      if (mapBoxes.length === 0) {
        this.addResult('MatchDetailPage Load', false, 'Map navigation boxes not found');
        return false;
      }
      
      // Check for player statistics table
      const playerTables = document.querySelectorAll('table');
      if (playerTables.length < 2) {
        this.addResult('MatchDetailPage Load', false, 'Player statistics tables not found (need at least 2 for both teams)');
        return false;
      }
      
      this.addResult('MatchDetailPage Load', true, `Match ${matchId} loaded successfully with all UI elements`);
      return true;
      
    } catch (error) {
      this.addResult('MatchDetailPage Load', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 2: Check Live Scoring Button Access
   */
  async testLiveScoringAccess() {
    console.log('\n🔄 Testing Live Scoring Access...');
    
    try {
      // Look for "Live Scoring" button
      const liveScoringButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Live Scoring'));
      
      if (!liveScoringButton) {
        this.addResult('Live Scoring Access', false, 'Live Scoring button not found. Admin access may be required');
        return false;
      }
      
      // Check if button is enabled
      if (liveScoringButton.disabled) {
        this.addResult('Live Scoring Access', false, 'Live Scoring button is disabled');
        return false;
      }
      
      this.addResult('Live Scoring Access', true, 'Live Scoring button found and enabled');
      return true;
      
    } catch (error) {
      this.addResult('Live Scoring Access', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 3: Open SimplifiedLiveScoring Panel
   */
  async testOpenLiveScoringPanel() {
    console.log('\n🔄 Testing SimplifiedLiveScoring Panel Opening...');
    
    try {
      // Find and click the Live Scoring button
      const liveScoringButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Live Scoring'));
      
      if (!liveScoringButton) {
        this.addResult('Open Live Scoring Panel', false, 'Live Scoring button not found');
        return false;
      }
      
      // Click the button
      liveScoringButton.click();
      
      // Wait for panel to open
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if panel opened
      const panel = document.querySelector('[class*="fixed inset-0"]');
      if (!panel) {
        this.addResult('Open Live Scoring Panel', false, 'Live Scoring panel did not open');
        return false;
      }
      
      // Check for key panel elements
      const header = panel.querySelector('[class*="Live Control"], [class*="Live View"]');
      if (!header) {
        this.addResult('Open Live Scoring Panel', false, 'Panel header not found');
        return false;
      }
      
      // Check for series score section
      const seriesScore = panel.querySelector('[class*="SERIES SCORE"]');
      if (!seriesScore) {
        this.addResult('Open Live Scoring Panel', false, 'Series score section not found');
        return false;
      }
      
      // Check for player stats sections
      const playerSections = panel.querySelectorAll('[class*="bg-gray-800"][class*="p-3"]');
      if (playerSections.length < 2) {
        this.addResult('Open Live Scoring Panel', false, 'Player stats sections not found');
        return false;
      }
      
      this.addResult('Open Live Scoring Panel', true, 'SimplifiedLiveScoring panel opened successfully');
      return true;
      
    } catch (error) {
      this.addResult('Open Live Scoring Panel', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 4: Verify Live Sync Initialization
   */
  async testLiveSyncInitialization() {
    console.log('\n🔄 Testing Live Sync Initialization...');
    
    try {
      // Check if MatchLiveSync is available
      if (typeof window.matchLiveSync === 'undefined') {
        this.addWarning('Live Sync Initialization', 'MatchLiveSync not available on window object');
      }
      
      // Check localStorage for live scoring setup
      const matchId = this.currentMatch?.id;
      if (matchId) {
        const liveKey = `live_match_${matchId}`;
        const existingData = localStorage.getItem(liveKey);
        
        if (existingData) {
          try {
            const data = JSON.parse(existingData);
            this.addResult('Live Sync Initialization', true, `Live data found in localStorage for match ${matchId}`, data);
          } catch (e) {
            this.addWarning('Live Sync Initialization', 'Invalid live data format in localStorage');
          }
        } else {
          this.addResult('Live Sync Initialization', true, 'No existing live data (clean state)');
        }
      }
      
      return true;
      
    } catch (error) {
      this.addResult('Live Sync Initialization', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 5: Test Score Updates and Visual Changes
   */
  async testScoreUpdates() {
    console.log('\n🔄 Testing Score Updates and Visual Changes...');
    
    try {
      const panel = document.querySelector('[class*="fixed inset-0"]');
      if (!panel) {
        this.addResult('Score Updates', false, 'Live scoring panel not open');
        return false;
      }
      
      // Find current map score controls
      const scoreButtons = panel.querySelectorAll('button[class*="bg-green-600"], button[class*="bg-red-600"]');
      const plusButtons = Array.from(scoreButtons).filter(btn => btn.textContent.includes('+1'));
      
      if (plusButtons.length < 2) {
        this.addResult('Score Updates', false, 'Score increment buttons not found');
        return false;
      }
      
      // Get initial score values from MatchDetailPage
      const initialScores = this.getMatchDetailPageScores();
      
      // Click first team's +1 button (current map score)
      console.log('🔄 Clicking Team 1 +1 button...');
      plusButtons[0].click();
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if scores updated on MatchDetailPage
      const updatedScores = this.getMatchDetailPageScores();
      
      const scoreChanged = (
        updatedScores.currentMapTeam1 !== initialScores.currentMapTeam1 ||
        updatedScores.currentMapTeam2 !== initialScores.currentMapTeam2
      );
      
      if (scoreChanged) {
        this.addResult('Score Updates', true, 'Current map score updated successfully', {
          initial: initialScores,
          updated: updatedScores
        });
      } else {
        this.addResult('Score Updates', false, 'Current map score did not update on MatchDetailPage', {
          initial: initialScores,
          updated: updatedScores
        });
      }
      
      return scoreChanged;
      
    } catch (error) {
      this.addResult('Score Updates', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 6: Test Hero Selection Updates
   */
  async testHeroUpdates() {
    console.log('\n🔄 Testing Hero Selection Updates...');
    
    try {
      const panel = document.querySelector('[class*="fixed inset-0"]');
      if (!panel) {
        this.addResult('Hero Updates', false, 'Live scoring panel not open');
        return false;
      }
      
      // Find hero selection dropdowns
      const heroSelects = panel.querySelectorAll('select[id*="hero-team"]');
      
      if (heroSelects.length === 0) {
        this.addResult('Hero Updates', false, 'Hero selection dropdowns not found');
        return false;
      }
      
      // Get initial hero images from MatchDetailPage
      const initialHeroes = this.getMatchDetailPageHeroes();
      
      // Change first player's hero
      const firstHeroSelect = heroSelects[0];
      const originalValue = firstHeroSelect.value;
      
      // Find a different hero option
      const options = Array.from(firstHeroSelect.options);
      const newOption = options.find(opt => opt.value && opt.value !== originalValue);
      
      if (!newOption) {
        this.addResult('Hero Updates', false, 'No alternative hero options found');
        return false;
      }
      
      console.log(`🔄 Changing hero from "${originalValue}" to "${newOption.value}"...`);
      firstHeroSelect.value = newOption.value;
      firstHeroSelect.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if hero images updated on MatchDetailPage
      const updatedHeroes = this.getMatchDetailPageHeroes();
      
      const heroChanged = JSON.stringify(initialHeroes) !== JSON.stringify(updatedHeroes);
      
      if (heroChanged) {
        this.addResult('Hero Updates', true, 'Hero selection updated successfully', {
          initial: initialHeroes,
          updated: updatedHeroes,
          changed: newOption.value
        });
      } else {
        this.addResult('Hero Updates', false, 'Hero selection did not update on MatchDetailPage', {
          initial: initialHeroes,
          updated: updatedHeroes,
          attempted: newOption.value
        });
      }
      
      return heroChanged;
      
    } catch (error) {
      this.addResult('Hero Updates', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 7: Test Player Stats Updates
   */
  async testPlayerStatsUpdates() {
    console.log('\n🔄 Testing Player Stats Updates...');
    
    try {
      const panel = document.querySelector('[class*="fixed inset-0"]');
      if (!panel) {
        this.addResult('Player Stats Updates', false, 'Live scoring panel not open');
        return false;
      }
      
      // Find player stat input fields
      const statInputs = panel.querySelectorAll('input[id*="kills-team"], input[id*="deaths-team"], input[id*="assists-team"]');
      
      if (statInputs.length === 0) {
        this.addResult('Player Stats Updates', false, 'Player stat input fields not found');
        return false;
      }
      
      // Get initial stats from MatchDetailPage
      const initialStats = this.getMatchDetailPagePlayerStats();
      
      // Update first player's kills
      const firstKillsInput = Array.from(statInputs).find(input => input.id.includes('kills'));
      
      if (!firstKillsInput) {
        this.addResult('Player Stats Updates', false, 'Kills input field not found');
        return false;
      }
      
      const originalKills = firstKillsInput.value;
      const newKills = parseInt(originalKills) + 1;
      
      console.log(`🔄 Updating kills from ${originalKills} to ${newKills}...`);
      firstKillsInput.value = newKills;
      firstKillsInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if stats updated on MatchDetailPage
      const updatedStats = this.getMatchDetailPagePlayerStats();
      
      const statsChanged = JSON.stringify(initialStats) !== JSON.stringify(updatedStats);
      
      if (statsChanged) {
        this.addResult('Player Stats Updates', true, 'Player stats updated successfully', {
          initial: initialStats,
          updated: updatedStats
        });
      } else {
        this.addResult('Player Stats Updates', false, 'Player stats did not update on MatchDetailPage', {
          initial: initialStats,
          updated: updatedStats
        });
      }
      
      return statsChanged;
      
    } catch (error) {
      this.addResult('Player Stats Updates', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 8: Test Cross-Tab Synchronization
   */
  async testCrossTabSync() {
    console.log('\n🔄 Testing Cross-Tab Synchronization...');
    
    try {
      const matchId = this.currentMatch?.id;
      if (!matchId) {
        this.addResult('Cross-Tab Sync', false, 'No current match ID available');
        return false;
      }
      
      // Simulate cross-tab update by manually triggering localStorage event
      const testData = {
        series_score_team1: 1,
        series_score_team2: 0,
        team1_score: 1,
        team2_score: 0,
        current_map_team1_score: 10,
        current_map_team2_score: 5,
        matchId: parseInt(matchId),
        timestamp: Date.now(),
        source: 'CrossTabTest',
        type: 'test_update'
      };
      
      // Store initial state
      const initialScores = this.getMatchDetailPageScores();
      
      // Trigger localStorage event
      console.log('🔄 Simulating cross-tab update...');
      localStorage.setItem(`live_match_${matchId}`, JSON.stringify(testData));
      
      // Manually trigger storage event (simulates cross-tab)
      const storageEvent = new StorageEvent('storage', {
        key: `live_match_${matchId}`,
        newValue: JSON.stringify(testData),
        oldValue: null
      });
      window.dispatchEvent(storageEvent);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if MatchDetailPage updated
      const updatedScores = this.getMatchDetailPageScores();
      
      const syncWorked = (
        updatedScores.seriesTeam1 !== initialScores.seriesTeam1 ||
        updatedScores.seriesTeam2 !== initialScores.seriesTeam2 ||
        updatedScores.currentMapTeam1 !== initialScores.currentMapTeam1 ||
        updatedScores.currentMapTeam2 !== initialScores.currentMapTeam2
      );
      
      if (syncWorked) {
        this.addResult('Cross-Tab Sync', true, 'Cross-tab synchronization working', {
          testData,
          initial: initialScores,
          updated: updatedScores
        });
      } else {
        this.addResult('Cross-Tab Sync', false, 'Cross-tab synchronization not working', {
          testData,
          initial: initialScores,
          updated: updatedScores
        });
      }
      
      return syncWorked;
      
    } catch (error) {
      this.addResult('Cross-Tab Sync', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 9: Test Map Navigation Updates
   */
  async testMapNavigation() {
    console.log('\n🔄 Testing Map Navigation Updates...');
    
    try {
      const panel = document.querySelector('[class*="fixed inset-0"]');
      if (!panel) {
        this.addResult('Map Navigation', false, 'Live scoring panel not open');
        return false;
      }
      
      // Find map selector
      const mapSelector = panel.querySelector('select[id="map-selector"]');
      if (!mapSelector) {
        this.addResult('Map Navigation', false, 'Map selector not found');
        return false;
      }
      
      // Get initial map state
      const initialMapBoxes = this.getMatchDetailPageMapBoxes();
      const currentMap = mapSelector.value;
      
      // Change to different map if available
      const options = Array.from(mapSelector.options);
      const otherMap = options.find(opt => opt.value !== currentMap);
      
      if (!otherMap) {
        this.addResult('Map Navigation', false, 'No alternative map options found');
        return false;
      }
      
      console.log(`🔄 Switching from map ${currentMap} to map ${otherMap.value}...`);
      mapSelector.value = otherMap.value;
      mapSelector.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if map boxes updated on MatchDetailPage
      const updatedMapBoxes = this.getMatchDetailPageMapBoxes();
      
      const mapChanged = JSON.stringify(initialMapBoxes) !== JSON.stringify(updatedMapBoxes);
      
      if (mapChanged) {
        this.addResult('Map Navigation', true, 'Map navigation updated successfully', {
          initial: initialMapBoxes,
          updated: updatedMapBoxes,
          switchedTo: otherMap.value
        });
      } else {
        this.addResult('Map Navigation', false, 'Map navigation did not update on MatchDetailPage', {
          initial: initialMapBoxes,
          updated: updatedMapBoxes,
          attempted: otherMap.value
        });
      }
      
      return mapChanged;
      
    } catch (error) {
      this.addResult('Map Navigation', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 10: Test Re-render Performance
   */
  async testRerenderPerformance() {
    console.log('\n🔄 Testing Re-render Performance...');
    
    try {
      const startTime = Date.now();
      let updateCount = 0;
      
      // Monitor DOM changes
      const observer = new MutationObserver(mutations => {
        updateCount += mutations.length;
      });
      
      const matchDetailPage = document.querySelector('[class*="min-h-screen"]');
      if (matchDetailPage) {
        observer.observe(matchDetailPage, {
          childList: true,
          subtree: true,
          attributes: true
        });
      }
      
      // Perform rapid updates
      const panel = document.querySelector('[class*="fixed inset-0"]');
      if (panel) {
        const scoreButtons = panel.querySelectorAll('button[class*="bg-green-600"]');
        const plusButton = Array.from(scoreButtons).find(btn => btn.textContent.includes('+1'));
        
        if (plusButton) {
          // Rapid fire updates
          for (let i = 0; i < 5; i++) {
            plusButton.click();
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      
      // Wait for all updates to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      observer.disconnect();
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      const performanceGood = totalTime < 5000 && updateCount > 0;
      
      if (performanceGood) {
        this.addResult('Re-render Performance', true, `Performance acceptable: ${totalTime}ms, ${updateCount} DOM updates`);
      } else {
        this.addResult('Re-render Performance', false, `Performance issues: ${totalTime}ms, ${updateCount} DOM updates`);
      }
      
      return performanceGood;
      
    } catch (error) {
      this.addResult('Re-render Performance', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Helper: Get current scores from MatchDetailPage
   */
  getMatchDetailPageScores() {
    try {
      // Series scores (main scores)
      const seriesScoreElements = document.querySelectorAll('[class*="text-4xl"]');
      const seriesTeam1 = seriesScoreElements[0]?.textContent?.trim() || '0';
      const seriesTeam2 = seriesScoreElements[1]?.textContent?.trim() || '0';
      
      // Current map scores
      const currentMapScoreText = document.querySelector('[class*="Current Map:"]')?.textContent || 'Current Map: 0 - 0';
      const currentMapMatch = currentMapScoreText.match(/(\d+) - (\d+)/);
      const currentMapTeam1 = currentMapMatch ? currentMapMatch[1] : '0';
      const currentMapTeam2 = currentMapMatch ? currentMapMatch[2] : '0';
      
      return {
        seriesTeam1: parseInt(seriesTeam1),
        seriesTeam2: parseInt(seriesTeam2),
        currentMapTeam1: parseInt(currentMapTeam1),
        currentMapTeam2: parseInt(currentMapTeam2)
      };
    } catch (error) {
      console.warn('Error getting scores:', error);
      return { seriesTeam1: 0, seriesTeam2: 0, currentMapTeam1: 0, currentMapTeam2: 0 };
    }
  }

  /**
   * Helper: Get current hero images from MatchDetailPage
   */
  getMatchDetailPageHeroes() {
    try {
      const heroImages = Array.from(document.querySelectorAll('img[alt*="hero"], img[src*="hero"]'));
      return heroImages.map(img => ({
        src: img.src,
        alt: img.alt
      }));
    } catch (error) {
      console.warn('Error getting heroes:', error);
      return [];
    }
  }

  /**
   * Helper: Get current player stats from MatchDetailPage
   */
  getMatchDetailPagePlayerStats() {
    try {
      const statCells = Array.from(document.querySelectorAll('td[class*="text-center"]'));
      return statCells.map(cell => cell.textContent?.trim()).filter(Boolean);
    } catch (error) {
      console.warn('Error getting player stats:', error);
      return [];
    }
  }

  /**
   * Helper: Get current map box states from MatchDetailPage
   */
  getMatchDetailPageMapBoxes() {
    try {
      const mapBoxes = Array.from(document.querySelectorAll('[class*="w-20 h-24"]'));
      return mapBoxes.map(box => ({
        text: box.textContent?.trim(),
        classes: box.className,
        isActive: box.classList.contains('scale-105') || box.classList.contains('border-blue-500')
      }));
    } catch (error) {
      console.warn('Error getting map boxes:', error);
      return [];
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Live Scoring System Test...\n');
    
    const tests = [
      () => this.testMatchDetailPageLoad(),
      () => this.testLiveScoringAccess(),
      () => this.testOpenLiveScoringPanel(),
      () => this.testLiveSyncInitialization(),
      () => this.testScoreUpdates(),
      () => this.testHeroUpdates(),
      () => this.testPlayerStatsUpdates(),
      () => this.testCrossTabSync(),
      () => this.testMapNavigation(),
      () => this.testRerenderPerformance()
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result) passedTests++;
      } catch (error) {
        console.error('Test execution error:', error);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return this.generateReport(passedTests, totalTests);
  }

  /**
   * Generate comprehensive test report
   */
  generateReport(passedTests, totalTests) {
    const testDuration = Date.now() - this.testStartTime;
    
    const report = {
      summary: {
        passed: passedTests,
        total: totalTests,
        failed: totalTests - passedTests,
        warnings: this.warnings.length,
        duration: testDuration,
        success: passedTests === totalTests
      },
      results: this.testResults,
      errors: this.errors,
      warnings: this.warnings,
      timestamp: new Date().toISOString()
    };
    
    // Console summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`⏱️ Duration: ${testDuration}ms`);
    
    if (report.summary.success) {
      console.log('\n🎉 All tests passed! Live scoring system is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the detailed results for issues.');
    }
    
    // Detailed results
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.details}`);
      if (result.data) {
        console.log('   Data:', result.data);
      }
    });
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => {
        console.log(`⚠️ ${warning.test}: ${warning.message}`);
      });
    }
    
    return report;
  }
}

// Export for use
window.LiveScoringSystemTest = LiveScoringSystemTest;

// Auto-run if script is loaded directly
if (typeof window !== 'undefined') {
  console.log('Live Scoring System Test loaded. Run with:');
  console.log('const test = new LiveScoringSystemTest(); test.runAllTests();');
}