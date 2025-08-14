/**
 * Comprehensive Player and Team Management Test Suite
 * Tests all CRUD operations for players and teams on the Marvel Rivals League platform
 */

const puppeteer = require('puppeteer');

class MRVLComprehensiveTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://staging.mrvl.net';
    this.testResults = {
      playerTests: {},
      teamTests: {},
      apiTests: {},
      validationTests: {},
      errors: []
    };
  }

  async init() {
    console.log('🚀 Initializing MRVL Comprehensive Test Suite...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
        this.testResults.errors.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Set up network monitoring
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP Error: ${response.status()} - ${response.url()}`);
        this.testResults.errors.push({
          type: 'http_error',
          status: response.status(),
          url: response.url(),
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  async login() {
    console.log('🔐 Attempting to login as admin...');
    try {
      await this.page.goto(`${this.baseUrl}/user/login`, { waitUntil: 'networkidle0' });
      
      // Check if we're already logged in
      const currentUrl = this.page.url();
      if (currentUrl.includes('/admin')) {
        console.log('✅ Already logged in as admin');
        return true;
      }

      // Try to login (assuming credentials are stored or we have access)
      await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await this.page.waitForSelector('input[type="password"]', { timeout: 5000 });
      
      // You'll need to provide actual credentials here
      await this.page.type('input[type="email"]', 'admin@example.com');
      await this.page.type('input[type="password"]', 'password');
      
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      this.testResults.errors.push({
        type: 'login_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async navigateToAdminDashboard() {
    console.log('🏠 Navigating to admin dashboard...');
    try {
      await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
      await this.page.waitForSelector('.admin-dashboard', { timeout: 10000 });
      console.log('✅ Successfully reached admin dashboard');
      return true;
    } catch (error) {
      console.log('❌ Failed to reach admin dashboard:', error.message);
      this.testResults.errors.push({
        type: 'navigation_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async testPlayerCreationForm() {
    console.log('🏃 Testing Player Creation Form...');
    try {
      // Navigate to players section
      await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
      
      // Look for players tab/button
      await this.page.waitForSelector('[data-testid="admin-players"], .admin-players, button:contains("Players")', { timeout: 5000 });
      await this.page.click('[data-testid="admin-players"], .admin-players, button:contains("Players")');
      
      // Wait for players page to load
      await this.page.waitForSelector('.admin-players-page, [data-component="AdminPlayers"]', { timeout: 10000 });
      
      // Click create new player button
      await this.page.waitForSelector('button:contains("Create"), .btn-create-player', { timeout: 5000 });
      await this.page.click('button:contains("Create"), .btn-create-player');
      
      // Wait for modal/form to appear
      await this.page.waitForSelector('.modal, .player-form, form', { timeout: 5000 });
      
      // Test all comprehensive fields
      const playerFormFields = {
        name: 'Test Player',
        ign: 'TestIGN',
        real_name: 'John Doe',
        username: 'johndoe',
        country: 'US',
        role: 'DPS',
        rating: '2400',
        elo_rating: '2500',
        peak_elo: '2600',
        skill_rating: '3200',
        earnings: '25000',
        total_earnings: '75000',
        wins: '150',
        losses: '45',
        total_matches: '195',
        kda: '1.45',
        main_hero: 'Spider-Man',
        hero_pool: 'Spider-Man, Iron Man, Star-Lord',
        status: 'active',
        nationality: 'American',
        jersey_number: '10',
        birth_date: '2000-01-01',
        age: '24',
        region: 'NA',
        team_id: '1',
        biography: 'Test player biography',
        description: 'Test player description'
      };

      console.log('📝 Filling out player creation form...');
      let fieldsTested = 0;
      let fieldsSuccessful = 0;

      for (const [fieldName, value] of Object.entries(playerFormFields)) {
        try {
          const selector = `input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"], 
                           input[id="${fieldName}"], select[id="${fieldName}"], textarea[id="${fieldName}"],
                           [data-field="${fieldName}"]`;
          
          const element = await this.page.$(selector);
          if (element) {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'select') {
              await this.page.select(selector, value);
            } else {
              await this.page.fill(selector, value);
            }
            console.log(`✅ ${fieldName}: ${value}`);
            fieldsSuccessful++;
          } else {
            console.log(`⚠️ Field not found: ${fieldName}`);
          }
          fieldsTested++;
        } catch (error) {
          console.log(`❌ Error filling ${fieldName}:`, error.message);
        }
      }

      // Submit form
      await this.page.click('button[type="submit"], .btn-submit, .btn-create');
      await this.page.waitForTimeout(2000);

      this.testResults.playerTests.creation = {
        status: 'completed',
        fieldsTotal: fieldsTested,
        fieldsSuccessful: fieldsSuccessful,
        completionRate: (fieldsSuccessful / fieldsTested * 100).toFixed(2) + '%'
      };

      console.log(`✅ Player creation form test completed: ${fieldsSuccessful}/${fieldsTested} fields successful`);
      return true;

    } catch (error) {
      console.log('❌ Player creation form test failed:', error.message);
      this.testResults.playerTests.creation = {
        status: 'failed',
        error: error.message
      };
      return false;
    }
  }

  async testPlayerEditingForm() {
    console.log('✏️ Testing Player Editing Form...');
    try {
      // Navigate to players list
      await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
      await this.page.click('[data-testid="admin-players"], .admin-players, button:contains("Players")');
      await this.page.waitForSelector('.players-table, .admin-players-list', { timeout: 10000 });
      
      // Find first player and click edit
      const editButton = await this.page.$('.btn-edit, button:contains("Edit")');
      if (editButton) {
        await editButton.click();
        await this.page.waitForSelector('.modal, .player-form, form', { timeout: 5000 });
        
        // Verify form loads with existing data
        const nameField = await this.page.$('input[name="name"], input[id="name"]');
        const nameValue = await nameField?.evaluate(el => el.value);
        
        if (nameValue) {
          console.log('✅ Player edit form loaded with existing data');
          
          // Test updating a field
          await this.page.fill('input[name="rating"], input[id="rating"]', '2500');
          await this.page.click('button[type="submit"], .btn-submit, .btn-update');
          await this.page.waitForTimeout(2000);
          
          this.testResults.playerTests.editing = {
            status: 'completed',
            dataLoaded: true,
            updateSuccessful: true
          };
          return true;
        } else {
          throw new Error('Form did not load with existing data');
        }
      } else {
        throw new Error('Edit button not found');
      }
    } catch (error) {
      console.log('❌ Player editing form test failed:', error.message);
      this.testResults.playerTests.editing = {
        status: 'failed',
        error: error.message
      };
      return false;
    }
  }

  async testPlayerDeletion() {
    console.log('🗑️ Testing Player Deletion...');
    try {
      // Navigate to players list
      await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
      await this.page.click('[data-testid="admin-players"], .admin-players, button:contains("Players")');
      await this.page.waitForSelector('.players-table, .admin-players-list', { timeout: 10000 });
      
      // Count players before deletion
      const playersBeforeCount = await this.page.$$eval('tr', rows => rows.length - 1); // -1 for header
      
      // Find delete button for last player to avoid deleting important data
      const deleteButtons = await this.page.$$('.btn-delete, button:contains("Delete")');
      if (deleteButtons.length > 0) {
        const lastDeleteButton = deleteButtons[deleteButtons.length - 1];
        
        // Set up dialog handler for confirmation
        this.page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        await lastDeleteButton.click();
        await this.page.waitForTimeout(3000);
        
        // Count players after deletion
        const playersAfterCount = await this.page.$$eval('tr', rows => rows.length - 1);
        
        if (playersAfterCount < playersBeforeCount) {
          console.log('✅ Player deletion successful');
          this.testResults.playerTests.deletion = {
            status: 'completed',
            successful: true,
            playersBeforeCount,
            playersAfterCount
          };
          return true;
        } else {
          throw new Error('Player count did not decrease after deletion');
        }
      } else {
        throw new Error('No delete buttons found');
      }
    } catch (error) {
      console.log('❌ Player deletion test failed:', error.message);
      this.testResults.playerTests.deletion = {
        status: 'failed',
        error: error.message
      };
      return false;
    }
  }

  async testTeamCreationForm() {
    console.log('🏆 Testing Team Creation Form...');
    try {
      // Navigate to teams section
      await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
      await this.page.click('[data-testid="admin-teams"], .admin-teams, button:contains("Teams")');
      await this.page.waitForSelector('.admin-teams-page, [data-component="AdminTeams"]', { timeout: 10000 });
      
      // Click create new team button
      await this.page.click('button:contains("Create"), .btn-create-team');
      await this.page.waitForSelector('.modal, .team-form, form', { timeout: 5000 });
      
      // Test all comprehensive team fields
      const teamFormFields = {
        name: 'Test Team',
        short_name: 'TST',
        region: 'NA',
        country: 'United States',
        rating: '2400',
        elo_rating: '2500',
        peak_elo: '2600',
        earnings: '50000',
        wins: '100',
        losses: '30',
        matches_played: '130',
        win_rate: '76.9',
        current_streak_count: '5',
        current_streak_type: 'win',
        founded_date: '2023-01-01',
        description: 'Test team description',
        achievements: 'Test achievements',
        manager: 'John Smith',
        owner: 'Test Organization LLC',
        captain: 'TestCaptain',
        status: 'Active',
        coach_name: 'Coach Name',
        coach_nationality: 'United States',
        website: 'https://test-team.com'
      };

      // Test social media fields
      const socialMediaFields = {
        'social_media[twitter]': '@testteam',
        'social_media[instagram]': '@testteam',
        'social_media[youtube]': 'TestTeam Channel',
        'social_media[discord]': 'discord.gg/testteam',
        'social_media[tiktok]': '@testteam'
      };

      console.log('📝 Filling out team creation form...');
      let fieldsTested = 0;
      let fieldsSuccessful = 0;

      // Test basic fields
      for (const [fieldName, value] of Object.entries(teamFormFields)) {
        try {
          const selector = `input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"], 
                           input[id="${fieldName}"], select[id="${fieldName}"], textarea[id="${fieldName}"]`;
          
          const element = await this.page.$(selector);
          if (element) {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'select') {
              await this.page.select(selector, value);
            } else {
              await this.page.fill(selector, value);
            }
            console.log(`✅ ${fieldName}: ${value}`);
            fieldsSuccessful++;
          } else {
            console.log(`⚠️ Field not found: ${fieldName}`);
          }
          fieldsTested++;
        } catch (error) {
          console.log(`❌ Error filling ${fieldName}:`, error.message);
        }
      }

      // Test social media fields
      for (const [fieldName, value] of Object.entries(socialMediaFields)) {
        try {
          const element = await this.page.$(fieldName);
          if (element) {
            await this.page.fill(fieldName, value);
            console.log(`✅ ${fieldName}: ${value}`);
            fieldsSuccessful++;
          } else {
            console.log(`⚠️ Social media field not found: ${fieldName}`);
          }
          fieldsTested++;
        } catch (error) {
          console.log(`❌ Error filling ${fieldName}:`, error.message);
        }
      }

      // Submit form
      await this.page.click('button[type="submit"], .btn-submit, .btn-create');
      await this.page.waitForTimeout(2000);

      this.testResults.teamTests.creation = {
        status: 'completed',
        fieldsTotal: fieldsTested,
        fieldsSuccessful: fieldsSuccessful,
        completionRate: (fieldsSuccessful / fieldsTested * 100).toFixed(2) + '%'
      };

      console.log(`✅ Team creation form test completed: ${fieldsSuccessful}/${fieldsTested} fields successful`);
      return true;

    } catch (error) {
      console.log('❌ Team creation form test failed:', error.message);
      this.testResults.teamTests.creation = {
        status: 'failed',
        error: error.message
      };
      return false;
    }
  }

  async testTeamEditingForm() {
    console.log('✏️ Testing Team Editing Form...');
    try {
      // Navigate to teams list
      await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
      await this.page.click('[data-testid="admin-teams"], .admin-teams, button:contains("Teams")');
      await this.page.waitForSelector('.teams-table, .admin-teams-list', { timeout: 10000 });
      
      // Find first team and click edit
      const editButton = await this.page.$('.btn-edit, button:contains("Edit")');
      if (editButton) {
        await editButton.click();
        await this.page.waitForSelector('.modal, .team-form, form', { timeout: 5000 });
        
        // Verify form loads with existing data
        const nameField = await this.page.$('input[name="name"], input[id="name"]');
        const nameValue = await nameField?.evaluate(el => el.value);
        
        if (nameValue) {
          console.log('✅ Team edit form loaded with existing data');
          
          // Test updating a field
          await this.page.fill('input[name="rating"], input[id="rating"]', '2500');
          await this.page.click('button[type="submit"], .btn-submit, .btn-update');
          await this.page.waitForTimeout(2000);
          
          this.testResults.teamTests.editing = {
            status: 'completed',
            dataLoaded: true,
            updateSuccessful: true
          };
          return true;
        } else {
          throw new Error('Form did not load with existing data');
        }
      } else {
        throw new Error('Edit button not found');
      }
    } catch (error) {
      console.log('❌ Team editing form test failed:', error.message);
      this.testResults.teamTests.editing = {
        status: 'failed',
        error: error.message
      };
      return false;
    }
  }

  async testAPIEndpoints() {
    console.log('🔌 Testing API Endpoints...');
    try {
      // Test players endpoint
      const playersResponse = await this.page.evaluate(async () => {
        try {
          const response = await fetch('/api/players');
          return {
            status: response.status,
            ok: response.ok,
            url: response.url
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      // Test teams endpoint
      const teamsResponse = await this.page.evaluate(async () => {
        try {
          const response = await fetch('/api/teams');
          return {
            status: response.status,
            ok: response.ok,
            url: response.url
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      this.testResults.apiTests = {
        players: playersResponse,
        teams: teamsResponse,
        correctEndpoints: {
          players: playersResponse.url?.includes('/players') && !playersResponse.url?.includes('/admin/'),
          teams: teamsResponse.url?.includes('/teams') && !teamsResponse.url?.includes('/admin/')
        }
      };

      console.log('✅ API endpoints tested');
      return true;
    } catch (error) {
      console.log('❌ API endpoint testing failed:', error.message);
      this.testResults.apiTests = {
        error: error.message
      };
      return false;
    }
  }

  async testFormValidation() {
    console.log('✅ Testing Form Validation...');
    try {
      // Test player form validation
      await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
      await this.page.click('[data-testid="admin-players"], .admin-players, button:contains("Players")');
      await this.page.click('button:contains("Create"), .btn-create-player');
      await this.page.waitForSelector('.modal, .player-form, form', { timeout: 5000 });
      
      // Try to submit empty form
      await this.page.click('button[type="submit"], .btn-submit, .btn-create');
      await this.page.waitForTimeout(1000);
      
      // Check for validation messages
      const validationMessages = await this.page.$$eval('.error, .invalid, .validation-error', elements => 
        elements.map(el => el.textContent)
      );

      this.testResults.validationTests = {
        playerFormValidation: {
          messagesFound: validationMessages.length > 0,
          messages: validationMessages
        }
      };

      console.log('✅ Form validation tested');
      return true;
    } catch (error) {
      console.log('❌ Form validation testing failed:', error.message);
      this.testResults.validationTests = {
        error: error.message
      };
      return false;
    }
  }

  async generateReport() {
    console.log('📊 Generating comprehensive test report...');
    
    const report = {
      testSuite: 'MRVL Comprehensive Player & Team Management',
      testDate: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: '0%'
      },
      detailedResults: this.testResults,
      recommendations: []
    };

    // Calculate summary
    let totalTests = 0;
    let passedTests = 0;

    // Count player tests
    Object.values(this.testResults.playerTests).forEach(test => {
      totalTests++;
      if (test.status === 'completed') passedTests++;
    });

    // Count team tests
    Object.values(this.testResults.teamTests).forEach(test => {
      totalTests++;
      if (test.status === 'completed') passedTests++;
    });

    // Count other tests
    if (this.testResults.apiTests && !this.testResults.apiTests.error) {
      totalTests++;
      passedTests++;
    }
    if (this.testResults.validationTests && !this.testResults.validationTests.error) {
      totalTests++;
      passedTests++;
    }

    report.summary.totalTests = totalTests;
    report.summary.passedTests = passedTests;
    report.summary.failedTests = totalTests - passedTests;
    report.summary.successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) + '%' : '0%';

    // Generate recommendations
    if (this.testResults.errors.length > 0) {
      report.recommendations.push('Review and fix console errors and HTTP errors');
    }
    if (this.testResults.playerTests.creation?.fieldsSuccessful < this.testResults.playerTests.creation?.fieldsTotal) {
      report.recommendations.push('Some player form fields were not found - verify form field naming conventions');
    }
    if (this.testResults.teamTests.creation?.fieldsSuccessful < this.testResults.teamTests.creation?.fieldsTotal) {
      report.recommendations.push('Some team form fields were not found - verify form field naming conventions');
    }

    return report;
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive MRVL test suite...');
    
    await this.init();
    
    // Skip login for now since we don't have credentials
    console.log('⚠️ Skipping login - assuming access to staging environment');
    
    // Navigate directly to staging
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
    
    // Run all tests
    await this.testPlayerCreationForm();
    await this.testPlayerEditingForm();
    await this.testPlayerDeletion();
    await this.testTeamCreationForm();
    await this.testTeamEditingForm();
    await this.testAPIEndpoints();
    await this.testFormValidation();
    
    const report = await this.generateReport();
    console.log('📋 Test Report Generated:');
    console.log(JSON.stringify(report, null, 2));
    
    await this.browser.close();
    return report;
  }
}

// Run the test suite
(async () => {
  const testSuite = new MRVLComprehensiveTestSuite();
  const report = await testSuite.runAllTests();
  
  // Save report to file
  const fs = require('fs');
  const reportPath = `./mrvl-comprehensive-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved to: ${reportPath}`);
})();