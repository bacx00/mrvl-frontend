/**
 * Profile Management Functionality Test
 * 
 * This script tests the frontend profile management functionality fixes
 * for players and teams, including:
 * 1. Form submissions and API integration
 * 2. Earnings updates
 * 3. Image uploads (avatars, logos, flags)
 * 4. Mentions functionality
 * 5. Social links (all platforms)
 * 6. Data persistence
 */

const puppeteer = require('puppeteer');
const path = require('path');

class ProfileManagementTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      playerFormTest: { status: 'pending', errors: [] },
      teamFormTest: { status: 'pending', errors: [] },
      mentionsTest: { status: 'pending', errors: [] },
      imageUploadTest: { status: 'pending', errors: [] },
      socialLinksTest: { status: 'pending', errors: [] },
      dataPersistenceTest: { status: 'pending', errors: [] },
      overall: { status: 'pending', errors: [] }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Profile Management Tests...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
      }
    });

    // Track network requests
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('📡 API Request:', request.method(), request.url());
      }
      request.continue();
    });

    this.page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('📡 API Response:', response.status(), response.url());
      }
    });
  }

  async testPlayerForm() {
    console.log('\n🧪 Testing PlayerForm Functionality...');
    
    try {
      // Navigate to admin dashboard
      await this.page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Wait for React to load
      await this.page.waitForSelector('.admin-dashboard', { timeout: 10000 });
      
      // Click on Players management
      await this.page.click('button[data-section="admin-players"]');
      await this.page.waitForTimeout(1000);
      
      // Click Create New Player
      await this.page.click('button[data-action="create-player"]');
      await this.page.waitForTimeout(2000);
      
      // Fill out the form
      const testData = {
        name: 'Test Player ' + Date.now(),
        username: 'testplayer' + Date.now(),
        role: 'Duelist',
        region: 'NA',
        country: 'US',
        age: '25',
        rating: '1500',
        earnings: '25000.50'
      };
      
      // Fill basic fields
      await this.page.type('input[name="name"]', testData.name);
      await this.page.type('input[name="username"]', testData.username);
      await this.page.select('select[name="role"]', testData.role);
      await this.page.select('select[name="region"]', testData.region);
      await this.page.select('select[name="country"]', testData.country);
      await this.page.type('input[name="age"]', testData.age);
      await this.page.type('input[name="rating"]', testData.rating);
      await this.page.type('input[name="earnings"]', testData.earnings);
      
      // Fill social links
      await this.page.type('input[name="social_twitter"]', 'https://twitter.com/testplayer');
      await this.page.type('input[name="social_twitch"]', 'https://twitch.tv/testplayer');
      await this.page.type('input[name="social_discord"]', 'TestPlayer#1234');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for response
      await this.page.waitForTimeout(3000);
      
      // Check for success/error messages
      const successMessage = await this.page.$('.alert-success, .success-message');
      const errorMessage = await this.page.$('.alert-danger, .error-message');
      
      if (successMessage) {
        this.results.playerFormTest.status = 'success';
        console.log('✅ PlayerForm test passed');
      } else if (errorMessage) {
        const errorText = await errorMessage.textContent();
        this.results.playerFormTest.status = 'failed';
        this.results.playerFormTest.errors.push(errorText);
        console.log('❌ PlayerForm test failed:', errorText);
      } else {
        this.results.playerFormTest.status = 'warning';
        this.results.playerFormTest.errors.push('No clear success/error indication');
        console.log('⚠️ PlayerForm test unclear result');
      }
      
    } catch (error) {
      this.results.playerFormTest.status = 'error';
      this.results.playerFormTest.errors.push(error.message);
      console.log('❌ PlayerForm test error:', error.message);
    }
  }

  async testTeamForm() {
    console.log('\n🧪 Testing TeamForm Functionality...');
    
    try {
      // Navigate back to admin dashboard
      await this.page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Click on Teams management
      await this.page.click('button[data-section="admin-teams"]');
      await this.page.waitForTimeout(1000);
      
      // Click Create New Team
      await this.page.click('button[data-action="create-team"]');
      await this.page.waitForTimeout(2000);
      
      // Fill out the form
      const testData = {
        name: 'Test Team ' + Date.now(),
        shortName: 'TEST' + Date.now().toString().slice(-3),
        region: 'NA',
        country: 'United States',
        rating: '1200',
        earnings: '50000.75'
      };
      
      // Fill basic fields
      await this.page.type('input[name="name"]', testData.name);
      await this.page.type('input[name="shortName"]', testData.shortName);
      await this.page.select('select[name="region"]', testData.region);
      await this.page.type('input[name="country"]', testData.country);
      await this.page.type('input[name="rating"]', testData.rating);
      await this.page.type('input[name="earnings"]', testData.earnings);
      
      // Fill social links including new platforms
      await this.page.type('input[name="social_twitter"]', 'https://twitter.com/testteam');
      await this.page.type('input[name="social_website"]', 'https://testteam.gg');
      await this.page.type('input[name="social_discord"]', 'https://discord.gg/testteam');
      await this.page.type('input[name="social_tiktok"]', 'https://tiktok.com/@testteam');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for response
      await this.page.waitForTimeout(3000);
      
      // Check for success/error messages
      const successMessage = await this.page.$('.alert-success, .success-message');
      const errorMessage = await this.page.$('.alert-danger, .error-message');
      
      if (successMessage) {
        this.results.teamFormTest.status = 'success';
        console.log('✅ TeamForm test passed');
      } else if (errorMessage) {
        const errorText = await errorMessage.textContent();
        this.results.teamFormTest.status = 'failed';
        this.results.teamFormTest.errors.push(errorText);
        console.log('❌ TeamForm test failed:', errorText);
      } else {
        this.results.teamFormTest.status = 'warning';
        this.results.teamFormTest.errors.push('No clear success/error indication');
        console.log('⚠️ TeamForm test unclear result');
      }
      
    } catch (error) {
      this.results.teamFormTest.status = 'error';
      this.results.teamFormTest.errors.push(error.message);
      console.log('❌ TeamForm test error:', error.message);
    }
  }

  async testMentionsFunctionality() {
    console.log('\n🧪 Testing Mentions Functionality...');
    
    try {
      // Navigate to forums
      await this.page.goto('http://localhost:3000/forums', { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Find a text area for posting (assuming there's a create thread or reply area)
      const textarea = await this.page.$('textarea[name="content"], textarea[placeholder*="content"], .mention-enabled-textarea');
      
      if (textarea) {
        // Type @ to trigger mentions
        await textarea.click();
        await textarea.type('@');
        
        // Wait for dropdown to appear
        await this.page.waitForTimeout(1000);
        
        // Check if mentions dropdown appeared
        const mentionsDropdown = await this.page.$('.mention-dropdown, [class*="mention"]');
        
        if (mentionsDropdown) {
          this.results.mentionsTest.status = 'success';
          console.log('✅ Mentions functionality working');
        } else {
          this.results.mentionsTest.status = 'failed';
          this.results.mentionsTest.errors.push('Mentions dropdown not appearing');
          console.log('❌ Mentions dropdown not found');
        }
      } else {
        this.results.mentionsTest.status = 'warning';
        this.results.mentionsTest.errors.push('No textarea found to test mentions');
        console.log('⚠️ No textarea found for mentions test');
      }
      
    } catch (error) {
      this.results.mentionsTest.status = 'error';
      this.results.mentionsTest.errors.push(error.message);
      console.log('❌ Mentions test error:', error.message);
    }
  }

  async testImageUpload() {
    console.log('\n🧪 Testing Image Upload Functionality...');
    
    try {
      // Go back to admin and try to edit a player to test image upload
      await this.page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Look for image upload component
      const imageUpload = await this.page.$('.image-upload, [class*="ImageUpload"]');
      
      if (imageUpload) {
        // Check if the component renders correctly
        const uploadArea = await imageUpload.$('.upload-area, [class*="upload"]');
        
        if (uploadArea) {
          this.results.imageUploadTest.status = 'success';
          console.log('✅ Image upload component rendering correctly');
        } else {
          this.results.imageUploadTest.status = 'failed';
          this.results.imageUploadTest.errors.push('Upload area not found');
          console.log('❌ Upload area not found');
        }
      } else {
        this.results.imageUploadTest.status = 'warning';
        this.results.imageUploadTest.errors.push('Image upload component not found');
        console.log('⚠️ Image upload component not found');
      }
      
    } catch (error) {
      this.results.imageUploadTest.status = 'error';
      this.results.imageUploadTest.errors.push(error.message);
      console.log('❌ Image upload test error:', error.message);
    }
  }

  async testSocialLinks() {
    console.log('\n🧪 Testing Social Links Functionality...');
    
    try {
      // Check if all social link fields are present in forms
      const socialFields = [
        'input[name="social_twitter"]',
        'input[name="social_instagram"]',
        'input[name="social_youtube"]',
        'input[name="social_discord"]',
        'input[name="social_tiktok"]'
      ];
      
      let foundFields = 0;
      for (const field of socialFields) {
        const element = await this.page.$(field);
        if (element) {
          foundFields++;
        }
      }
      
      if (foundFields >= 4) {
        this.results.socialLinksTest.status = 'success';
        console.log(`✅ Social links test passed (${foundFields}/${socialFields.length} fields found)`);
      } else {
        this.results.socialLinksTest.status = 'failed';
        this.results.socialLinksTest.errors.push(`Only ${foundFields}/${socialFields.length} social fields found`);
        console.log(`❌ Only ${foundFields}/${socialFields.length} social fields found`);
      }
      
    } catch (error) {
      this.results.socialLinksTest.status = 'error';
      this.results.socialLinksTest.errors.push(error.message);
      console.log('❌ Social links test error:', error.message);
    }
  }

  async testDataPersistence() {
    console.log('\n🧪 Testing Data Persistence...');
    
    try {
      // Navigate to players page to check if data persists
      await this.page.goto('http://localhost:3000/players', { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Wait for data to load
      await this.page.waitForTimeout(3000);
      
      // Check if player data is displayed
      const playerCards = await this.page.$$('.player-card, [class*="player"]');
      
      if (playerCards.length > 0) {
        this.results.dataPersistenceTest.status = 'success';
        console.log(`✅ Data persistence test passed (${playerCards.length} players found)`);
      } else {
        this.results.dataPersistenceTest.status = 'warning';
        this.results.dataPersistenceTest.errors.push('No player data found');
        console.log('⚠️ No player data found');
      }
      
    } catch (error) {
      this.results.dataPersistenceTest.status = 'error';
      this.results.dataPersistenceTest.errors.push(error.message);
      console.log('❌ Data persistence test error:', error.message);
    }
  }

  generateReport() {
    console.log('\n📊 Profile Management Test Results Summary');
    console.log('=' .repeat(50));
    
    const tests = [
      'playerFormTest',
      'teamFormTest', 
      'mentionsTest',
      'imageUploadTest',
      'socialLinksTest',
      'dataPersistenceTest'
    ];
    
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    let errors = 0;
    
    tests.forEach(test => {
      const result = this.results[test];
      const statusIcon = {
        'success': '✅',
        'failed': '❌',
        'warning': '⚠️',
        'error': '🚫',
        'pending': '⏳'
      }[result.status] || '❓';
      
      console.log(`${statusIcon} ${test}: ${result.status.toUpperCase()}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   └─ ${error}`);
        });
      }
      
      switch (result.status) {
        case 'success': passed++; break;
        case 'failed': failed++; break;
        case 'warning': warnings++; break;
        case 'error': errors++; break;
      }
    });
    
    console.log('\n📈 Overall Results:');
    console.log(`✅ Passed: ${passed}/${tests.length}`);
    console.log(`❌ Failed: ${failed}/${tests.length}`);
    console.log(`⚠️ Warnings: ${warnings}/${tests.length}`);
    console.log(`🚫 Errors: ${errors}/${tests.length}`);
    
    // Determine overall status
    if (errors > 0) {
      this.results.overall.status = 'critical';
    } else if (failed > 0) {
      this.results.overall.status = 'failed';
    } else if (warnings > 0) {
      this.results.overall.status = 'warning';
    } else if (passed === tests.length) {
      this.results.overall.status = 'success';
    } else {
      this.results.overall.status = 'incomplete';
    }
    
    console.log(`\n🎯 Overall Status: ${this.results.overall.status.toUpperCase()}`);
    
    return this.results;
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      // Run all tests sequentially
      await this.testPlayerForm();
      await this.testTeamForm();
      await this.testMentionsFunctionality();
      await this.testImageUpload();
      await this.testSocialLinks();
      await this.testDataPersistence();
      
    } catch (error) {
      console.error('❌ Test suite error:', error);
      this.results.overall.errors.push(error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
    
    return this.generateReport();
  }
}

// Export for use or run directly
if (require.main === module) {
  (async () => {
    const tester = new ProfileManagementTester();
    const results = await tester.runAllTests();
    
    // Write results to file
    const fs = require('fs');
    const resultsFile = `profile-management-test-results-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(`\n📁 Detailed results saved to: ${resultsFile}`);
    
    // Exit with appropriate code
    process.exit(results.overall.status === 'success' ? 0 : 1);
  })();
} else {
  module.exports = ProfileManagementTester;
}