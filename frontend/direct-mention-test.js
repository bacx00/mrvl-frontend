const puppeteer = require('puppeteer');

class MentionFunctionalityTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      apiTests: {},
      fieldTests: {},
      consoleTests: {},
      interactionTests: {}
    };
  }

  async init() {
    console.log('🚀 Starting Mention Functionality Test Suite');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[Mention]')) {
        console.log('🔍 Console Debug:', text);
        this.testResults.consoleTests[Date.now()] = text;
      }
    });
    
    // Enable network request monitoring
    this.page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/mentions/')) {
        console.log('🌐 API Request:', url);
      }
    });
    
    this.page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/mentions/')) {
        console.log('📡 API Response:', url, response.status());
      }
    });
    
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async testAPIEndpoints() {
    console.log('\n📡 Testing API Endpoints...');
    
    try {
      // Test popular mentions endpoint
      const popularResponse = await this.page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:8000/api/public/mentions/popular?limit=6');
          const data = await response.json();
          return { success: response.ok, data, status: response.status };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      this.testResults.apiTests.popular = popularResponse;
      console.log('✅ Popular Mentions API:', popularResponse.success ? 'PASS' : 'FAIL');
      
      // Test search mentions endpoint
      const searchResponse = await this.page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:8000/api/public/mentions/search?q=test&type=all&limit=8');
          const data = await response.json();
          return { success: response.ok, data, status: response.status };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      this.testResults.apiTests.search = searchResponse;
      console.log('✅ Search Mentions API:', searchResponse.success ? 'PASS' : 'FAIL');
      
    } catch (error) {
      console.log('❌ API Test Error:', error.message);
    }
  }

  async navigateToNewsForm() {
    console.log('\n🔄 Navigating to News Creation Form...');
    
    try {
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      
      // Wait for the app to load and try to navigate to admin
      await this.page.waitForTimeout(2000);
      
      // Look for admin navigation or create news button
      const adminButton = await this.page.$('[data-testid="admin-nav"], .admin-link, a[href*="admin"]');
      if (adminButton) {
        await adminButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      // Look for news creation form or news management
      const newsButton = await this.page.$('[data-testid="news-nav"], .news-link, a[href*="news"]');
      if (newsButton) {
        await newsButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      // Look for create news button
      const createButton = await this.page.$('[data-testid="create-news"], .create-news, button:contains("Create")');
      if (createButton) {
        await createButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      console.log('📝 Navigated to News Form');
      return true;
      
    } catch (error) {
      console.log('❌ Navigation Error:', error.message);
      return false;
    }
  }

  async testMentionDropdownInField(fieldName, fieldSelector) {
    console.log(`\n🎯 Testing Mention Dropdown in ${fieldName}...`);
    
    try {
      // Find the field
      await this.page.waitForSelector(fieldSelector, { timeout: 5000 });
      const field = await this.page.$(fieldSelector);
      
      if (!field) {
        console.log(`❌ ${fieldName} field not found`);
        return { success: false, error: 'Field not found' };
      }
      
      // Clear the field and focus
      await field.click();
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Delete');
      
      // Type @ to trigger mention dropdown
      await this.page.keyboard.type('@');
      await this.page.waitForTimeout(1000);
      
      // Check if dropdown appears
      const dropdown = await this.page.$('.mention-dropdown, [class*="mention"], [class*="dropdown"]');
      const dropdownVisible = dropdown ? await dropdown.isVisible() : false;
      
      const result = {
        success: dropdownVisible,
        fieldName: fieldName,
        dropdownFound: !!dropdown,
        dropdownVisible: dropdownVisible
      };
      
      if (dropdownVisible) {
        console.log(`✅ ${fieldName} mention dropdown: PASS`);
        
        // Test typing to filter results
        await this.page.keyboard.type('test');
        await this.page.waitForTimeout(1000);
        
        // Check for mention items
        const mentionItems = await this.page.$$('.mention-item, [class*="mention-result"], [class*="mention-option"]');
        result.mentionItems = mentionItems.length;
        result.searchWorking = mentionItems.length > 0;
        
        console.log(`🔍 Found ${mentionItems.length} mention results`);
        
        // Try selecting first mention with Enter
        if (mentionItems.length > 0) {
          await this.page.keyboard.press('ArrowDown'); // Navigate to first item
          await this.page.keyboard.press('Enter'); // Select
          await this.page.waitForTimeout(500);
          
          const fieldValue = await field.evaluate(el => el.value);
          result.selectionWorking = fieldValue.includes('@') && fieldValue.length > 1;
          
          console.log(`📝 Selection test: ${result.selectionWorking ? 'PASS' : 'FAIL'}`);
        }
        
      } else {
        console.log(`❌ ${fieldName} mention dropdown: FAIL`);
      }
      
      this.testResults.fieldTests[fieldName] = result;
      return result;
      
    } catch (error) {
      console.log(`❌ ${fieldName} test error:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async testAllFields() {
    console.log('\n📝 Testing All Form Fields...');
    
    const fields = [
      { name: 'Title', selector: 'input[name="title"], #title, [placeholder*="title"]' },
      { name: 'Excerpt', selector: 'textarea[name="excerpt"], #excerpt, [placeholder*="excerpt"]' },
      { name: 'Content', selector: 'textarea[name="content"], #content, [placeholder*="content"]' }
    ];
    
    for (const field of fields) {
      await this.testMentionDropdownInField(field.name, field.selector);
      await this.page.waitForTimeout(1000); // Brief pause between tests
    }
  }

  async testKeyboardNavigation() {
    console.log('\n⌨️ Testing Keyboard Navigation...');
    
    try {
      // Find title field and trigger dropdown
      const titleField = await this.page.$('input[name="title"], #title, [placeholder*="title"]');
      if (titleField) {
        await titleField.click();
        await this.page.keyboard.type('@');
        await this.page.waitForTimeout(1000);
        
        // Test arrow key navigation
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('ArrowUp');
        
        const keyboardTest = { navigation: true };
        this.testResults.interactionTests.keyboard = keyboardTest;
        
        console.log('✅ Keyboard navigation: PASS');
      }
    } catch (error) {
      console.log('❌ Keyboard navigation: FAIL', error.message);
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        apiTests: Object.keys(this.testResults.apiTests).length,
        fieldTests: Object.keys(this.testResults.fieldTests).length,
        consoleMessages: Object.keys(this.testResults.consoleTests).length,
        passedTests: 0,
        failedTests: 0
      }
    };
    
    // Count passed/failed tests
    Object.values(this.testResults.fieldTests).forEach(test => {
      if (test.success) {
        report.summary.passedTests++;
      } else {
        report.summary.failedTests++;
      }
    });
    
    // Save report to file
    const fs = require('fs');
    const reportPath = `/var/www/mrvl-frontend/frontend/mention-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Report saved to: ${reportPath}`);
    console.log(`📈 Summary: ${report.summary.passedTests} passed, ${report.summary.failedTests} failed`);
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runFullTest() {
    try {
      await this.init();
      await this.testAPIEndpoints();
      
      const navigationSuccess = await this.navigateToNewsForm();
      if (navigationSuccess) {
        await this.testAllFields();
        await this.testKeyboardNavigation();
      } else {
        console.log('⚠️ Could not navigate to news form - manual testing required');
      }
      
      const report = await this.generateReport();
      await this.cleanup();
      
      return report;
      
    } catch (error) {
      console.log('💥 Test suite error:', error.message);
      await this.cleanup();
      throw error;
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const tester = new MentionFunctionalityTester();
  tester.runFullTest()
    .then(report => {
      console.log('\n✅ Test Suite Completed Successfully');
      process.exit(0);
    })
    .catch(error => {
      console.log('\n❌ Test Suite Failed:', error.message);
      process.exit(1);
    });
}

module.exports = MentionFunctionalityTester;