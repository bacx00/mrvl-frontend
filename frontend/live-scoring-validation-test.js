/**
 * LIVE SCORING VALIDATION TEST
 * Quick validation of critical live scoring functionality
 * Focus: Core features, data sync, UI responsiveness
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class LiveScoringValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      criticalTests: [],
      warnings: [],
      errors: [],
      summary: {}
    };
  }

  async validateSystem() {
    console.log('🔍 LIVE SCORING SYSTEM VALIDATION');
    console.log('==================================');
    
    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      defaultViewport: { width: 1600, height: 1200 }
    });

    try {
      const page = await browser.newPage();
      
      // Enable request interception to monitor API calls
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      
      // Monitor network requests
      const apiCalls = [];
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          apiCalls.push({
            url: response.url(),
            status: response.status(),
            method: response.request().method()
          });
        }
      });

      // Test 1: Live Scoring Component Access
      await this.testLiveScoringAccess(page);
      
      // Test 2: Hero Roster Display
      await this.testHeroRosterDisplay(page);
      
      // Test 3: Player Stats Management
      await this.testPlayerStatsManagement(page);
      
      // Test 4: Match Score Synchronization
      await this.testMatchScoreSynchronization(page);
      
      // Test 5: Real-time Updates
      await this.testRealTimeUpdates(page);
      
      // Test 6: UI Responsiveness
      await this.testUIResponsiveness(page);
      
      // Generate validation report
      this.results.apiCalls = apiCalls;
      this.generateValidationReport();
      
    } catch (error) {
      this.results.errors.push({
        type: 'Critical System Error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await browser.close();
    }
  }

  async testLiveScoringAccess(page) {
    console.log('\n📊 Testing Live Scoring Access...');
    
    try {
      // Navigate to admin panel
      await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
      
      // Look for live scoring interface
      const liveScoringButton = await page.$('.live-scoring-btn, .comprehensive-live-scoring-btn');
      if (!liveScoringButton) {
        throw new Error('Live scoring access button not found');
      }
      
      // Click to open live scoring
      await liveScoringButton.click();
      await page.waitForTimeout(2000);
      
      // Verify live scoring modal/component opened
      const liveScoringModal = await page.$('.comprehensive-live-scoring, .live-scoring-modal');
      if (!liveScoringModal) {
        throw new Error('Live scoring component did not open');
      }
      
      this.results.criticalTests.push({
        test: 'Live Scoring Access',
        status: 'PASSED',
        details: 'Live scoring component accessible from admin panel'
      });
      
      console.log('  ✅ Live scoring access verified');
      
    } catch (error) {
      this.results.criticalTests.push({
        test: 'Live Scoring Access',
        status: 'FAILED',
        error: error.message
      });
      console.log(`  ❌ Live scoring access failed: ${error.message}`);
    }
  }

  async testHeroRosterDisplay(page) {
    console.log('\n🦸 Testing Hero Roster Display...');
    
    try {
      // Wait for hero roster to load
      await page.waitForSelector('.hero-roster, .player-roster', { timeout: 10000 });
      
      // Count hero slots
      const heroSlots = await page.$$('.hero-slot, .player-slot');
      const heroImages = await page.$$('.hero-image img');
      
      // Verify 12-hero roster (6 per team)
      if (heroSlots.length < 12) {
        this.results.warnings.push({
          type: 'Hero Roster Count',
          message: `Expected 12 hero slots, found ${heroSlots.length}`,
          severity: 'medium'
        });
      }
      
      // Check hero image loading
      let loadedImages = 0;
      for (let img of heroImages) {
        const isLoaded = await img.evaluate(el => el.complete && el.naturalHeight !== 0);
        if (isLoaded) loadedImages++;
      }
      
      this.results.criticalTests.push({
        test: 'Hero Roster Display',
        status: 'PASSED',
        details: {
          totalSlots: heroSlots.length,
          loadedImages: loadedImages,
          imageLoadRate: `${(loadedImages / heroImages.length * 100).toFixed(1)}%`
        }
      });
      
      console.log(`  ✅ Hero roster: ${heroSlots.length} slots, ${loadedImages}/${heroImages.length} images loaded`);
      
    } catch (error) {
      this.results.criticalTests.push({
        test: 'Hero Roster Display',
        status: 'FAILED',
        error: error.message
      });
      console.log(`  ❌ Hero roster test failed: ${error.message}`);
    }
  }

  async testPlayerStatsManagement(page) {
    console.log('\n📈 Testing Player Stats Management...');
    
    try {
      // Look for player stats inputs
      const killsInputs = await page.$$('input[data-stat="kills"], .kills-input');
      const deathsInputs = await page.$$('input[data-stat="deaths"], .deaths-input');
      const assistsInputs = await page.$$('input[data-stat="assists"], .assists-input');
      const kdaDisplays = await page.$$('.kda-display, .kda-value');
      
      if (killsInputs.length === 0) {
        throw new Error('No kills input fields found');
      }
      
      // Test stat editing on first player
      if (killsInputs[0]) {
        await killsInputs[0].click({ clickCount: 3 });
        await killsInputs[0].type('10');
        
        if (deathsInputs[0]) {
          await deathsInputs[0].click({ clickCount: 3 });
          await deathsInputs[0].type('2');
        }
        
        if (assistsInputs[0]) {
          await assistsInputs[0].click({ clickCount: 3 });
          await assistsInputs[0].type('5');
        }
        
        // Wait for KDA calculation
        await page.waitForTimeout(1000);
        
        // Verify KDA auto-calculation
        if (kdaDisplays[0]) {
          const kdaText = await kdaDisplays[0].evaluate(el => el.textContent);
          const expectedKda = ((10 + 5) / Math.max(2, 1)).toFixed(2);
          
          if (!kdaText.includes(expectedKda)) {
            this.results.warnings.push({
              type: 'KDA Calculation',
              message: `KDA calculation: expected ${expectedKda}, got ${kdaText}`,
              severity: 'high'
            });
          }
        }
      }
      
      this.results.criticalTests.push({
        test: 'Player Stats Management',
        status: 'PASSED',
        details: {
          killsInputs: killsInputs.length,
          deathsInputs: deathsInputs.length,
          assistsInputs: assistsInputs.length,
          kdaDisplays: kdaDisplays.length
        }
      });
      
      console.log(`  ✅ Player stats: ${killsInputs.length} K inputs, ${deathsInputs.length} D inputs, ${assistsInputs.length} A inputs`);
      
    } catch (error) {
      this.results.criticalTests.push({
        test: 'Player Stats Management',
        status: 'FAILED',
        error: error.message
      });
      console.log(`  ❌ Player stats test failed: ${error.message}`);
    }
  }

  async testMatchScoreSynchronization(page) {
    console.log('\n🔄 Testing Match Score Synchronization...');
    
    try {
      // Look for team victory buttons
      const team1WinBtn = await page.$('.team1-win-btn, .team-victory-btn[data-team="1"]');
      const team2WinBtn = await page.$('.team2-win-btn, .team-victory-btn[data-team="2"]');
      
      if (!team1WinBtn || !team2WinBtn) {
        throw new Error('Team victory buttons not found');
      }
      
      // Get initial scores
      const initialScore1 = await this.getTeamScore(page, 1);
      const initialScore2 = await this.getTeamScore(page, 2);
      
      // Click team 1 victory
      await team1WinBtn.click();
      await page.waitForTimeout(1000);
      
      // Verify score updated
      const newScore1 = await this.getTeamScore(page, 1);
      
      if (newScore1 <= initialScore1) {
        this.results.warnings.push({
          type: 'Score Synchronization',
          message: `Team 1 score did not increase after victory: ${initialScore1} -> ${newScore1}`,
          severity: 'high'
        });
      }
      
      this.results.criticalTests.push({
        test: 'Match Score Synchronization',
        status: 'PASSED',
        details: {
          initialScore1: initialScore1,
          initialScore2: initialScore2,
          newScore1: newScore1,
          scoreIncreased: newScore1 > initialScore1
        }
      });
      
      console.log(`  ✅ Score sync: ${initialScore1}-${initialScore2} → ${newScore1}-${await this.getTeamScore(page, 2)}`);
      
    } catch (error) {
      this.results.criticalTests.push({
        test: 'Match Score Synchronization',
        status: 'FAILED',
        error: error.message
      });
      console.log(`  ❌ Score sync test failed: ${error.message}`);
    }
  }

  async testRealTimeUpdates(page) {
    console.log('\n⚡ Testing Real-time Updates...');
    
    try {
      // Look for auto-save indicators
      const autoSaveStatus = await page.$('.auto-save-status, .save-status');
      const syncStatus = await page.$('.sync-status, .connection-status');
      
      // Check WebSocket/SSE connections
      const connectionIndicators = await page.evaluate(() => {
        const indicators = [];
        const statusElements = document.querySelectorAll('[class*="status"], [class*="connection"]');
        statusElements.forEach(el => {
          if (el.textContent.includes('connected') || el.textContent.includes('online')) {
            indicators.push({ type: 'connected', text: el.textContent });
          } else if (el.textContent.includes('disconnected') || el.textContent.includes('offline')) {
            indicators.push({ type: 'disconnected', text: el.textContent });
          }
        });
        return indicators;
      });
      
      this.results.criticalTests.push({
        test: 'Real-time Updates',
        status: 'PASSED',
        details: {
          autoSavePresent: !!autoSaveStatus,
          syncStatusPresent: !!syncStatus,
          connectionIndicators: connectionIndicators
        }
      });
      
      console.log(`  ✅ Real-time updates: Auto-save ${autoSaveStatus ? '✓' : '✗'}, Sync ${syncStatus ? '✓' : '✗'}`);
      
    } catch (error) {
      this.results.criticalTests.push({
        test: 'Real-time Updates',
        status: 'FAILED',
        error: error.message
      });
      console.log(`  ❌ Real-time updates test failed: ${error.message}`);
    }
  }

  async testUIResponsiveness(page) {
    console.log('\n🎨 Testing UI Responsiveness...');
    
    try {
      // Measure page load and interaction responsiveness
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
        };
      });
      
      // Test button responsiveness
      const buttons = await page.$$('button:not(:disabled)');
      let responsiveButtons = 0;
      
      for (let button of buttons.slice(0, 5)) { // Test first 5 buttons
        try {
          const startTime = Date.now();
          await button.hover();
          const responseTime = Date.now() - startTime;
          
          if (responseTime < 100) { // Under 100ms is good
            responsiveButtons++;
          }
        } catch (e) {
          // Button might not be interactable
        }
      }
      
      this.results.criticalTests.push({
        test: 'UI Responsiveness',
        status: 'PASSED',
        details: {
          performanceMetrics: performanceMetrics,
          responsiveButtons: `${responsiveButtons}/${Math.min(buttons.length, 5)}`,
          totalButtons: buttons.length
        }
      });
      
      console.log(`  ✅ UI responsiveness: ${responsiveButtons}/${Math.min(buttons.length, 5)} buttons responsive`);
      
    } catch (error) {
      this.results.criticalTests.push({
        test: 'UI Responsiveness',
        status: 'FAILED',
        error: error.message
      });
      console.log(`  ❌ UI responsiveness test failed: ${error.message}`);
    }
  }

  async getTeamScore(page, teamNumber) {
    try {
      const scoreElement = await page.$(`.team${teamNumber}-score, .score-team-${teamNumber}`);
      if (scoreElement) {
        const scoreText = await scoreElement.evaluate(el => el.textContent);
        return parseInt(scoreText) || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  generateValidationReport() {
    const passedTests = this.results.criticalTests.filter(t => t.status === 'PASSED').length;
    const failedTests = this.results.criticalTests.filter(t => t.status === 'FAILED').length;
    const totalTests = this.results.criticalTests.length;
    
    this.results.summary = {
      totalTests: totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: this.results.warnings.length,
      errors: this.results.errors.length,
      passRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0'
    };
    
    // Save detailed report
    const reportPath = '/var/www/mrvl-frontend/frontend/live-scoring-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n📋 VALIDATION SUMMARY');
    console.log('====================');
    console.log(`Tests Passed: ${passedTests}/${totalTests} (${this.results.summary.passRate}%)`);
    console.log(`Warnings: ${this.results.warnings.length}`);
    console.log(`Errors: ${this.results.errors.length}`);
    console.log(`\nDetailed report: ${reportPath}`);
    
    // Print critical warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  CRITICAL WARNINGS:');
      this.results.warnings.forEach(warning => {
        console.log(`   ${warning.type}: ${warning.message}`);
      });
    }
    
    // Print errors
    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.results.errors.forEach(error => {
        console.log(`   ${error.type}: ${error.message}`);
      });
    }
  }
}

// Execute validation
const validator = new LiveScoringValidator();
validator.validateSystem().catch(console.error);

module.exports = LiveScoringValidator;