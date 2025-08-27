// Manual Mention Functionality Test
// This script should be run in the browser console while on the news creation form

class ManualMentionTester {
  constructor() {
    this.results = {
      apiTests: {},
      fieldTests: {},
      consoleTests: [],
      interactions: {}
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    this.results.consoleTests.push({ timestamp, type, message: logMessage });
  }

  async testAPIEndpoints() {
    this.log('🧪 Testing API Endpoints...', 'info');
    
    try {
      // Test popular mentions API
      this.log('Testing popular mentions endpoint...', 'info');
      const popularResponse = await fetch('http://localhost:8000/api/public/mentions/popular?limit=6');
      const popularData = await popularResponse.json();
      
      this.results.apiTests.popular = {
        success: popularResponse.ok,
        status: popularResponse.status,
        dataCount: popularData.data?.length || 0,
        data: popularData
      };
      
      this.log(`Popular mentions API: ${popularResponse.ok ? 'PASS' : 'FAIL'} (${popularData.data?.length || 0} results)`, popularResponse.ok ? 'success' : 'error');
      
      // Test search mentions API
      this.log('Testing search mentions endpoint...', 'info');
      const searchResponse = await fetch('http://localhost:8000/api/public/mentions/search?q=test&type=all&limit=8');
      const searchData = await searchResponse.json();
      
      this.results.apiTests.search = {
        success: searchResponse.ok,
        status: searchResponse.status,
        dataCount: searchData.data?.length || 0,
        data: searchData
      };
      
      this.log(`Search mentions API: ${searchResponse.ok ? 'PASS' : 'FAIL'} (${searchData.data?.length || 0} results)`, searchResponse.ok ? 'success' : 'error');
      
      return true;
    } catch (error) {
      this.log(`API test error: ${error.message}`, 'error');
      return false;
    }
  }

  async testFieldMentions(fieldName, fieldSelector) {
    this.log(`🎯 Testing mention dropdown in ${fieldName} field...`, 'info');
    
    try {
      const field = document.querySelector(fieldSelector);
      if (!field) {
        this.log(`${fieldName} field not found with selector: ${fieldSelector}`, 'error');
        return { success: false, error: 'Field not found' };
      }
      
      // Clear field and focus
      field.value = '';
      field.focus();
      
      // Create and dispatch input event for @
      this.log(`Typing @ in ${fieldName} field...`, 'info');
      field.value = '@';
      
      const inputEvent = new Event('input', { bubbles: true });
      field.dispatchEvent(inputEvent);
      
      // Wait a moment for dropdown to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for dropdown
      const dropdowns = [
        '.mention-dropdown',
        '[class*="mention"]',
        '[class*="dropdown"]',
        '[style*="position: fixed"]',
        '[style*="z-index"]'
      ];
      
      let dropdown = null;
      for (const selector of dropdowns) {
        dropdown = document.querySelector(selector);
        if (dropdown && dropdown.offsetParent !== null) {
          break;
        }
      }
      
      const dropdownVisible = dropdown && dropdown.offsetParent !== null;
      
      const result = {
        success: dropdownVisible,
        fieldName: fieldName,
        dropdownFound: !!dropdown,
        dropdownVisible: dropdownVisible,
        fieldSelector: fieldSelector
      };
      
      if (dropdownVisible) {
        this.log(`${fieldName} mention dropdown appeared: PASS`, 'success');
        
        // Test search functionality
        field.value = '@test';
        const searchEvent = new Event('input', { bubbles: true });
        field.dispatchEvent(searchEvent);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for mention items
        const mentionItems = dropdown.querySelectorAll('[class*="mention"], [onClick], [onMouseOver]');
        result.mentionItemCount = mentionItems.length;
        
        this.log(`Found ${mentionItems.length} mention items`, 'info');
        
        // Test selection if items found
        if (mentionItems.length > 0) {
          const firstItem = mentionItems[0];
          firstItem.click();
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          result.selectionTest = field.value.includes('@') && field.value.length > 1;
          this.log(`Selection test: ${result.selectionTest ? 'PASS' : 'FAIL'}`, result.selectionTest ? 'success' : 'warning');
        }
      } else {
        this.log(`${fieldName} mention dropdown did not appear: FAIL`, 'error');
      }
      
      this.results.fieldTests[fieldName] = result;
      return result;
      
    } catch (error) {
      this.log(`${fieldName} test error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testAllFormFields() {
    this.log('📝 Testing all form fields for mention functionality...', 'info');
    
    const fields = [
      { name: 'Title', selector: 'input[name="title"]' },
      { name: 'Excerpt', selector: 'textarea[name="excerpt"]' },
      { name: 'Content', selector: 'textarea[name="content"]' }
    ];
    
    for (const field of fields) {
      await this.testFieldMentions(field.name, field.selector);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
    }
  }

  detectConsoleDebugLogs() {
    this.log('🔍 Setting up console debug log detection...', 'info');
    
    // Override console methods to catch mention-related logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const mentionKeywords = ['[Mention]', 'mention', 'dropdown', 'autocomplete'];
    
    console.log = (...args) => {
      const message = args.join(' ');
      if (mentionKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
        this.results.consoleTests.push({
          type: 'detected',
          message: message,
          timestamp: Date.now()
        });
      }
      originalLog.apply(console, args);
    };
    
    // Store original methods for cleanup
    this.originalConsole = { log: originalLog, error: originalError, warn: originalWarn };
  }

  checkFormStructure() {
    this.log('🏗️ Analyzing form structure...', 'info');
    
    const structure = {
      titleField: !!document.querySelector('input[name="title"]'),
      excerptField: !!document.querySelector('textarea[name="excerpt"]'),
      contentField: !!document.querySelector('textarea[name="content"]'),
      mentionComponents: {
        mentionDropdown: !!document.querySelector('[class*="mention"]'),
        dropdownElements: document.querySelectorAll('[class*="dropdown"]').length,
        textareaRefs: document.querySelectorAll('textarea[ref], input[ref]').length
      },
      formElement: !!document.querySelector('form'),
      submitButton: !!document.querySelector('button[type="submit"]')
    };
    
    this.results.formStructure = structure;
    
    Object.entries(structure).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        this.log(`${key}: ${value ? 'FOUND' : 'NOT FOUND'}`, value ? 'success' : 'warning');
      }
    });
  }

  async runManualTest() {
    this.log('🚀 Starting manual mention functionality test...', 'info');
    
    // Check if we're on the right page
    if (!window.location.href.includes('localhost:3000')) {
      this.log('Please run this test on localhost:3000 (React frontend)', 'error');
      return;
    }
    
    try {
      this.detectConsoleDebugLogs();
      this.checkFormStructure();
      await this.testAPIEndpoints();
      await this.testAllFormFields();
      
      this.generateSummary();
      
    } catch (error) {
      this.log(`Test execution error: ${error.message}`, 'error');
    }
  }

  generateSummary() {
    const duration = Date.now() - this.startTime;
    
    this.log('📊 Generating test summary...', 'info');
    
    const summary = {
      testDuration: `${Math.round(duration / 1000)}s`,
      apiTestsPassed: Object.values(this.results.apiTests).filter(test => test.success).length,
      apiTestsTotal: Object.keys(this.results.apiTests).length,
      fieldTestsPassed: Object.values(this.results.fieldTests).filter(test => test.success).length,
      fieldTestsTotal: Object.keys(this.results.fieldTests).length,
      consoleLogsDetected: this.results.consoleTests.length,
      overallStatus: 'PENDING'
    };
    
    // Determine overall status
    const criticalFailures = summary.apiTestsPassed === 0 || summary.fieldTestsPassed === 0;
    if (criticalFailures) {
      summary.overallStatus = 'CRITICAL_FAILURES';
    } else if (summary.fieldTestsPassed === summary.fieldTestsTotal) {
      summary.overallStatus = 'ALL_TESTS_PASSED';
    } else {
      summary.overallStatus = 'PARTIAL_SUCCESS';
    }
    
    this.log(`\n🎯 TEST SUMMARY:`, 'info');
    this.log(`Duration: ${summary.testDuration}`, 'info');
    this.log(`API Tests: ${summary.apiTestsPassed}/${summary.apiTestsTotal}`, 'info');
    this.log(`Field Tests: ${summary.fieldTestsPassed}/${summary.fieldTestsTotal}`, 'info');
    this.log(`Console Logs: ${summary.consoleLogsDetected}`, 'info');
    this.log(`Overall Status: ${summary.overallStatus}`, summary.overallStatus === 'ALL_TESTS_PASSED' ? 'success' : 'warning');
    
    this.results.summary = summary;
    
    // Log detailed results to console for inspection
    console.table(this.results.fieldTests);
    console.table(this.results.apiTests);
    
    return this.results;
  }

  // Helper method to manually test specific functionality
  async testSpecificField(fieldName) {
    const selectors = {
      'title': 'input[name="title"]',
      'excerpt': 'textarea[name="excerpt"]',
      'content': 'textarea[name="content"]'
    };
    
    if (!selectors[fieldName.toLowerCase()]) {
      this.log(`Unknown field: ${fieldName}`, 'error');
      return;
    }
    
    await this.testFieldMentions(fieldName, selectors[fieldName.toLowerCase()]);
  }
}

// Make it available globally
window.MentionTester = ManualMentionTester;

// Auto-run if we detect we're on a news form page
if (document.querySelector('input[name="title"]') && document.querySelector('textarea[name="content"]')) {
  console.log('🎯 News form detected! Starting automatic test...');
  const tester = new ManualMentionTester();
  tester.runManualTest();
} else {
  console.log('ℹ️ To run the mention test manually, use: new MentionTester().runManualTest()');
}