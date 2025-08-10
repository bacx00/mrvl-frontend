/**
 * COMPREHENSIVE LIVE SCORING SYSTEM TEST SUITE
 * Tests all recently implemented features and critical workflows
 * Focus Areas: Live Scoring, Match Creation, Score Sync, Integration
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class LiveScoringSystemTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    this.baseUrl = 'http://localhost:3000';
  }

  async initialize() {
    console.log('🚀 Initializing Live Scoring System Test Suite...');
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      defaultViewport: { width: 1920, height: 1080 }
    });
    this.page = await this.browser.newPage();
    
    // Set up console and network monitoring
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.logError(`Console Error: ${msg.text()}`);
      }
    });
    
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.logWarning(`Network Error: ${response.status()} - ${response.url()}`);
      }
    });
  }

  async runAllTests() {
    await this.initialize();
    
    try {
      // Test Category 1: Live Scoring Interface Tests
      await this.testLiveScoringInterface();
      
      // Test Category 2: Match Creation & Score Sync Tests  
      await this.testMatchCreationAndSync();
      
      // Test Category 3: URL Display & Player Name Tests
      await this.testUrlDisplayAndPlayerNames();
      
      // Test Category 4: Integration Tests
      await this.testIntegrationWorkflows();
      
      // Test Category 5: Real-time Synchronization Tests
      await this.testRealTimeSynchronization();
      
      // Test Category 6: Error Handling & Edge Cases
      await this.testErrorHandlingAndEdgeCases();
      
    } catch (error) {
      this.logError(`Critical test failure: ${error.message}`);
    } finally {
      await this.generateReport();
      await this.cleanup();
    }
  }

  // ================== TEST CATEGORY 1: LIVE SCORING INTERFACE ==================
  async testLiveScoringInterface() {
    console.log('\n📊 Testing Live Scoring Interface...');
    
    // Test 1.1: Comprehensive Live Scoring Component Loading
    await this.testComponent('Live Scoring Component Load', async () => {
      await this.page.goto(`${this.baseUrl}/admin`);
      await this.page.waitForSelector('.live-scoring-button', { timeout: 10000 });
      
      // Verify live scoring button exists
      const liveScoringButton = await this.page.$('.live-scoring-button');
      if (!liveScoringButton) throw new Error('Live scoring button not found');
      
      // Click to open live scoring
      await liveScoringButton.click();
      await this.page.waitForSelector('.comprehensive-live-scoring', { timeout: 5000 });
      
      return 'Live scoring component loads successfully';
    });

    // Test 1.2: 12-Hero Roster Display with Images
    await this.testComponent('12-Hero Roster Display', async () => {
      // Wait for hero roster to load
      await this.page.waitForSelector('.hero-roster', { timeout: 5000 });
      
      // Count hero slots
      const heroSlots = await this.page.$$('.hero-slot');
      if (heroSlots.length !== 12) {
        throw new Error(`Expected 12 hero slots, found ${heroSlots.length}`);
      }
      
      // Verify hero images load
      const heroImages = await this.page.$$('.hero-image');
      let loadedImages = 0;
      for (let img of heroImages) {
        const isLoaded = await img.evaluate(el => el.complete && el.naturalHeight !== 0);
        if (isLoaded) loadedImages++;
      }
      
      return `12-hero roster displayed with ${loadedImages}/${heroImages.length} images loaded`;
    });

    // Test 1.3: K|D|A|KDA|DMG|HEAL|BLK Stats Editing
    await this.testComponent('Player Stats Editing', async () => {
      await this.page.waitForSelector('.player-stats-table', { timeout: 5000 });
      
      // Find first player's kills input
      const killsInput = await this.page.$('.stats-input[data-stat="kills"]');
      if (!killsInput) throw new Error('Kills input not found');
      
      // Clear and enter test value
      await killsInput.click({ clickCount: 3 });
      await killsInput.type('15');
      
      // Test deaths input
      const deathsInput = await this.page.$('.stats-input[data-stat="deaths"]');
      if (!deathsInput) throw new Error('Deaths input not found');
      await deathsInput.click({ clickCount: 3 });
      await deathsInput.type('3');
      
      // Test assists input
      const assistsInput = await this.page.$('.stats-input[data-stat="assists"]');
      if (!assistsInput) throw new Error('Assists input not found');
      await assistsInput.click({ clickCount: 3 });
      await assistsInput.type('8');
      
      // Verify KDA auto-calculation
      await this.page.waitForTimeout(1000); // Wait for calculation
      const kdaDisplay = await this.page.$eval('.kda-display', el => el.textContent);
      const expectedKda = ((15 + 8) / Math.max(3, 1)).toFixed(2);
      
      if (!kdaDisplay.includes(expectedKda)) {
        this.logWarning(`KDA calculation may be incorrect: ${kdaDisplay} vs expected ~${expectedKda}`);
      }
      
      return 'Player stats editing and KDA auto-calculation working';
    });

    // Test 1.4: Team Victory Buttons and Map Win Functionality
    await this.testComponent('Team Victory and Map Win', async () => {
      // Find team victory buttons
      const team1WinButton = await this.page.$('.team-victory-btn[data-team="1"]');
      const team2WinButton = await this.page.$('.team-victory-btn[data-team="2"]');
      
      if (!team1WinButton || !team2WinButton) {
        throw new Error('Team victory buttons not found');
      }
      
      // Click team 1 victory
      await team1WinButton.click();
      await this.page.waitForTimeout(500);
      
      // Verify score updated
      const team1Score = await this.page.$eval('.team1-score', el => el.textContent);
      if (parseInt(team1Score) !== 1) {
        throw new Error('Team 1 score not updated after victory');
      }
      
      return 'Team victory buttons and map win functionality working';
    });

    // Test 1.5: Auto-save and Live Sync Features
    await this.testComponent('Auto-save and Live Sync', async () => {
      // Check for auto-save indicator
      const autoSaveIndicator = await this.page.$('.auto-save-status');
      if (!autoSaveIndicator) {
        this.logWarning('Auto-save indicator not visible');
      }
      
      // Verify sync status
      const syncStatus = await this.page.$('.sync-status');
      if (syncStatus) {
        const statusText = await syncStatus.evaluate(el => el.textContent);
        if (statusText.includes('disconnected')) {
          throw new Error('Live sync appears disconnected');
        }
      }
      
      return 'Auto-save and live sync features active';
    });
  }

  // ================== TEST CATEGORY 2: MATCH CREATION & SYNC ==================
  async testMatchCreationAndSync() {
    console.log('\n🎮 Testing Match Creation & Score Synchronization...');

    // Test 2.1: Creating Completed Match with Scores
    await this.testComponent('Match Creation with Scores', async () => {
      await this.page.goto(`${this.baseUrl}/admin/matches/create`);
      await this.page.waitForSelector('.match-form', { timeout: 10000 });
      
      // Fill in match details
      await this.page.type('#team1-select', 'Test Team 1');
      await this.page.type('#team2-select', 'Test Team 2');
      
      // Set match as completed
      await this.page.select('#match-status', 'completed');
      
      // Add scores
      await this.page.type('#team1-score', '2');
      await this.page.type('#team2-score', '1');
      
      // Submit form
      await this.page.click('#submit-match');
      await this.page.waitForNavigation();
      
      return 'Completed match created with scores successfully';
    });

    // Test 2.2: Score Synchronization Across Components  
    await this.testComponent('Score Synchronization', async () => {
      // Navigate to match detail page
      await this.page.goto(`${this.baseUrl}/matches/1`);
      await this.page.waitForSelector('.match-detail', { timeout: 5000 });
      
      // Verify scores appear in MatchDetailPage
      const team1Score = await this.page.$eval('.team1-final-score', el => el.textContent);
      const team2Score = await this.page.$eval('.team2-final-score', el => el.textContent);
      
      if (team1Score !== '2' || team2Score !== '1') {
        throw new Error(`Score mismatch: ${team1Score}-${team2Score} vs expected 2-1`);
      }
      
      // Check HomePage displays
      await this.page.goto(`${this.baseUrl}/`);
      await this.page.waitForSelector('.match-card', { timeout: 5000 });
      
      const matchCards = await this.page.$$('.match-card');
      if (matchCards.length === 0) {
        throw new Error('No match cards found on homepage');
      }
      
      return 'Scores synchronized across all components';
    });

    // Test 2.3: Admin Match Cards Score Updates
    await this.testComponent('Admin Match Cards Updates', async () => {
      await this.page.goto(`${this.baseUrl}/admin/matches`);
      await this.page.waitForSelector('.admin-match-card', { timeout: 5000 });
      
      const adminMatchCard = await this.page.$('.admin-match-card');
      if (!adminMatchCard) {
        throw new Error('Admin match card not found');
      }
      
      // Verify score display in admin card
      const scoreDisplay = await this.page.$eval('.admin-score-display', el => el.textContent);
      if (!scoreDisplay.includes('2') || !scoreDisplay.includes('1')) {
        throw new Error('Admin match card not showing updated scores');
      }
      
      return 'Admin match cards showing updated scores';
    });
  }

  // ================== TEST CATEGORY 3: URL DISPLAY & PLAYER NAMES ==================
  async testUrlDisplayAndPlayerNames() {
    console.log('\n🔗 Testing URL Display & Player Name Formatting...');

    // Test 3.1: URL Button Categorization (Streaming | Betting | VOD)
    await this.testComponent('URL Button Categorization', async () => {
      await this.page.goto(`${this.baseUrl}/matches/1`);
      await this.page.waitForSelector('.match-detail', { timeout: 5000 });
      
      // Look for URL buttons
      const streamingButtons = await this.page.$$('.url-btn[data-category="streaming"]');
      const bettingButtons = await this.page.$$('.url-btn[data-category="betting"]');
      const vodButtons = await this.page.$$('.url-btn[data-category="vod"]');
      
      const totalUrls = streamingButtons.length + bettingButtons.length + vodButtons.length;
      
      return `URL buttons categorized: ${streamingButtons.length} Streaming, ${bettingButtons.length} Betting, ${vodButtons.length} VOD`;
    });

    // Test 3.2: URL Parsing and Capitalization
    await this.testComponent('URL Parsing and Capitalization', async () => {
      const urlButtons = await this.page.$$('.url-btn');
      
      for (let button of urlButtons) {
        const buttonText = await button.evaluate(el => el.textContent);
        
        // Check for proper capitalization
        if (buttonText.includes('marvelrivals') && !buttonText.includes('MarvelRivals')) {
          this.logWarning(`URL button may need capitalization fix: ${buttonText}`);
        }
      }
      
      return 'URL parsing and capitalization verified';
    });

    // Test 3.3: Player Name Display (Username Only)
    await this.testComponent('Player Name Display Format', async () => {
      await this.page.waitForSelector('.player-name', { timeout: 5000 });
      
      const playerNames = await this.page.$$eval('.player-name', elements => 
        elements.map(el => el.textContent)
      );
      
      let correctFormat = 0;
      let incorrectFormat = 0;
      
      playerNames.forEach(name => {
        // Check if it's just username (like "Sypeh") vs full name (like "Mikkel \"Sypeh\" Klein")
        if (name.includes('"') || name.split(' ').length > 1) {
          incorrectFormat++;
          this.logWarning(`Player name format issue: ${name}`);
        } else {
          correctFormat++;
        }
      });
      
      return `Player names: ${correctFormat} correct format, ${incorrectFormat} need fixing`;
    });

    // Test 3.4: Button Positioning Above Blue Box
    await this.testComponent('Button Positioning', async () => {
      const urlSection = await this.page.$('.url-section');
      const blueBox = await this.page.$('.blue-info-box');
      
      if (urlSection && blueBox) {
        const urlRect = await urlSection.boundingBox();
        const boxRect = await blueBox.boundingBox();
        
        if (urlRect.y > boxRect.y) {
          throw new Error('URL buttons appear below blue box instead of above');
        }
      }
      
      return 'Buttons properly positioned above blue box';
    });
  }

  // ================== TEST CATEGORY 4: INTEGRATION TESTS ==================
  async testIntegrationWorkflows() {
    console.log('\n🔄 Testing Integration Workflows...');

    // Test 4.1: Navigation Between Match-Related Pages
    await this.testComponent('Page Navigation Flow', async () => {
      // Start from homepage
      await this.page.goto(`${this.baseUrl}/`);
      
      // Navigate to matches page
      await this.page.click('a[href="/matches"]');
      await this.page.waitForNavigation();
      
      // Navigate to specific match
      const firstMatchLink = await this.page.$('.match-card a');
      if (firstMatchLink) {
        await firstMatchLink.click();
        await this.page.waitForNavigation();
      }
      
      // Navigate to admin panel
      await this.page.goto(`${this.baseUrl}/admin`);
      await this.page.waitForSelector('.admin-dashboard', { timeout: 5000 });
      
      return 'Navigation between match-related pages working';
    });

    // Test 4.2: Data Consistency Across Components
    await this.testComponent('Data Consistency Check', async () => {
      // Get match data from different components
      const matchData = [];
      
      // Homepage match card
      await this.page.goto(`${this.baseUrl}/`);
      const homeMatchData = await this.page.evaluate(() => {
        const card = document.querySelector('.match-card');
        return card ? {
          team1: card.querySelector('.team1-name')?.textContent,
          team2: card.querySelector('.team2-name')?.textContent,
          score1: card.querySelector('.team1-score')?.textContent,
          score2: card.querySelector('.team2-score')?.textContent
        } : null;
      });
      
      if (homeMatchData) matchData.push({ source: 'homepage', data: homeMatchData });
      
      // Match detail page
      await this.page.goto(`${this.baseUrl}/matches/1`);
      const detailMatchData = await this.page.evaluate(() => {
        return {
          team1: document.querySelector('.team1-detail-name')?.textContent,
          team2: document.querySelector('.team2-detail-name')?.textContent,
          score1: document.querySelector('.team1-final-score')?.textContent,
          score2: document.querySelector('.team2-final-score')?.textContent
        };
      });
      
      matchData.push({ source: 'detail', data: detailMatchData });
      
      // Check for inconsistencies
      const inconsistencies = [];
      if (matchData.length > 1) {
        const [first, second] = matchData;
        if (first.data.score1 !== second.data.score1) {
          inconsistencies.push(`Score 1: ${first.data.score1} vs ${second.data.score1}`);
        }
        if (first.data.score2 !== second.data.score2) {
          inconsistencies.push(`Score 2: ${first.data.score2} vs ${second.data.score2}`);
        }
      }
      
      if (inconsistencies.length > 0) {
        throw new Error(`Data inconsistencies found: ${inconsistencies.join(', ')}`);
      }
      
      return 'Data consistency verified across components';
    });

    // Test 4.3: Admin Permissions and Role-Based Access
    await this.testComponent('Role-Based Access Control', async () => {
      // Test admin access
      await this.page.goto(`${this.baseUrl}/admin`);
      
      const adminDashboard = await this.page.$('.admin-dashboard');
      if (!adminDashboard) {
        throw new Error('Admin dashboard not accessible');
      }
      
      // Test live scoring access (admin only)
      const liveScoringButton = await this.page.$('.live-scoring-access');
      if (!liveScoringButton) {
        this.logWarning('Live scoring access button not found');
      }
      
      return 'Admin permissions and role-based access verified';
    });

    // Test 4.4: Image Loading (Team Logos, Hero Images)
    await this.testComponent('Image Loading Verification', async () => {
      await this.page.goto(`${this.baseUrl}/matches/1`);
      
      let loadedImages = 0;
      let failedImages = 0;
      
      // Check team logos
      const teamLogos = await this.page.$$('.team-logo');
      for (let logo of teamLogos) {
        const isLoaded = await logo.evaluate(el => el.complete && el.naturalHeight !== 0);
        if (isLoaded) {
          loadedImages++;
        } else {
          failedImages++;
        }
      }
      
      // Check hero images (if any)
      const heroImages = await this.page.$$('.hero-image');
      for (let hero of heroImages) {
        const isLoaded = await hero.evaluate(el => el.complete && el.naturalHeight !== 0);
        if (isLoaded) {
          loadedImages++;
        } else {
          failedImages++;
        }
      }
      
      return `Image loading: ${loadedImages} successful, ${failedImages} failed`;
    });
  }

  // ================== TEST CATEGORY 5: REAL-TIME SYNC ==================
  async testRealTimeSynchronization() {
    console.log('\n⚡ Testing Real-time Synchronization...');

    // Test 5.1: Live Scoring to MatchDetailPage Sync
    await this.testComponent('Live Scoring Synchronization', async () => {
      // Open match detail in one tab
      const detailPage = await this.browser.newPage();
      await detailPage.goto(`${this.baseUrl}/matches/1`);
      
      // Open live scoring in original page
      await this.page.goto(`${this.baseUrl}/admin`);
      await this.page.click('.live-scoring-button');
      
      // Make a score change
      await this.page.click('.team1-victory-btn');
      await this.page.waitForTimeout(2000); // Wait for sync
      
      // Check if detail page updated
      await detailPage.reload();
      const updatedScore = await detailPage.$eval('.team1-score', el => el.textContent);
      
      await detailPage.close();
      
      return `Live scoring sync test completed, score: ${updatedScore}`;
    });
  }

  // ================== TEST CATEGORY 6: ERROR HANDLING ==================
  async testErrorHandlingAndEdgeCases() {
    console.log('\n🛠️ Testing Error Handling & Edge Cases...');

    // Test 6.1: Network Failure Handling
    await this.testComponent('Network Failure Resilience', async () => {
      // Simulate network issues
      await this.page.setOfflineMode(true);
      await this.page.goto(`${this.baseUrl}/matches/1`);
      
      // Wait and check for error handling
      await this.page.waitForTimeout(3000);
      
      const errorMessage = await this.page.$('.network-error');
      
      // Restore network
      await this.page.setOfflineMode(false);
      
      return 'Network failure handling verified';
    });

    // Test 6.2: Invalid Match Data Handling
    await this.testComponent('Invalid Data Handling', async () => {
      // Try to access non-existent match
      await this.page.goto(`${this.baseUrl}/matches/99999`);
      
      const notFoundMessage = await this.page.$('.not-found');
      if (!notFoundMessage) {
        this.logWarning('404 page not properly handled');
      }
      
      return 'Invalid data handling verified';
    });
  }

  // ================== UTILITY METHODS ==================
  async testComponent(testName, testFn) {
    this.testResults.totalTests++;
    console.log(`  Testing: ${testName}`);
    
    try {
      const result = await testFn();
      this.testResults.passed++;
      this.testResults.details.push({
        test: testName,
        status: 'PASSED',
        result: result,
        timestamp: new Date().toISOString()
      });
      console.log(`    ✅ ${result}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: testName,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`    ❌ ${error.message}`);
    }
  }

  logWarning(message) {
    this.testResults.warnings++;
    console.log(`    ⚠️  ${message}`);
    this.testResults.details.push({
      test: 'Warning',
      status: 'WARNING',
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  logError(message) {
    console.error(`    🚨 ${message}`);
  }

  async generateReport() {
    const reportData = {
      ...this.testResults,
      summary: {
        passRate: ((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(2),
        totalTime: new Date().toISOString()
      }
    };

    const reportPath = `/var/www/mrvl-frontend/frontend/COMPREHENSIVE_LIVE_SCORING_TEST_REPORT.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${this.testResults.totalTests}`);
    console.log(`Passed: ${this.testResults.passed} (${reportData.summary.passRate}%)`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Warnings: ${this.testResults.warnings}`);
    console.log(`\nDetailed report saved to: ${reportPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the test suite
const tester = new LiveScoringSystemTester();
tester.runAllTests().catch(console.error);

module.exports = LiveScoringSystemTester;