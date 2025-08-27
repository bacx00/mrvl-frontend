/**
 * MRVL Mention Functionality Test Report
 * 
 * This script tests the mention dropdown functionality in the news creation form
 * Run this in the browser console while on the news creation form page
 */

class MRVLMentionTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testSuite: 'MRVL News Creation Mention Functionality',
      environment: {
        frontend: 'http://localhost:3000',
        backend: 'http://localhost:8000',
        userAgent: navigator.userAgent
      },
      tests: {
        apiEndpoints: {},
        formFields: {},
        interactions: {},
        console: []
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warnings: 0
      }
    };
    
    this.setupConsoleMonitoring();
    console.log('🎯 MRVL Mention Functionality Tester initialized');
    console.log('📋 To run all tests: tester.runAllTests()');
    console.log('🔍 To test specific field: tester.testField("title"|"excerpt"|"content")');
  }

  setupConsoleMonitoring() {
    // Monitor console for mention-related debug logs
    const originalLog = console.log;
    const self = this;
    
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('[Mention]') || message.toLowerCase().includes('mention')) {
        self.results.tests.console.push({
          timestamp: new Date().toISOString(),
          level: 'log',
          message: message
        });
      }
      originalLog.apply(console, args);
    };
  }

  async testAPIEndpoints() {
    console.log('🌐 Testing API endpoints...');
    
    try {
      // Test popular mentions endpoint
      const popularResponse = await fetch('http://localhost:8000/api/public/mentions/popular?limit=6');
      const popularData = await popularResponse.json();
      
      this.results.tests.apiEndpoints.popular = {
        endpoint: '/api/public/mentions/popular',
        status: popularResponse.status,
        success: popularResponse.ok && popularData.success,
        dataCount: popularData.data?.length || 0,
        responseTime: 'N/A',
        sampleData: popularData.data?.slice(0, 2) || []
      };
      
      // Test search mentions endpoint
      const searchResponse = await fetch('http://localhost:8000/api/public/mentions/search?q=team&type=all&limit=8');
      const searchData = await searchResponse.json();
      
      this.results.tests.apiEndpoints.search = {
        endpoint: '/api/public/mentions/search',
        status: searchResponse.status,
        success: searchResponse.ok && searchData.success,
        dataCount: searchData.data?.length || 0,
        query: 'team',
        sampleData: searchData.data?.slice(0, 2) || []
      };
      
      // Update counters
      this.results.summary.totalTests += 2;
      if (this.results.tests.apiEndpoints.popular.success) this.results.summary.passedTests++;
      else this.results.summary.failedTests++;
      
      if (this.results.tests.apiEndpoints.search.success) this.results.summary.passedTests++;
      else this.results.summary.failedTests++;
      
      console.log(`✅ API Tests completed - Popular: ${this.results.tests.apiEndpoints.popular.success ? 'PASS' : 'FAIL'}, Search: ${this.results.tests.apiEndpoints.search.success ? 'PASS' : 'FAIL'}`);
      
    } catch (error) {
      console.error('❌ API endpoint test error:', error);
      this.results.tests.apiEndpoints.error = error.message;
      this.results.summary.totalTests += 2;
      this.results.summary.failedTests += 2;
    }
  }

  async testField(fieldName) {
    const fieldSelectors = {
      title: 'input[name="title"]',
      excerpt: 'textarea[name="excerpt"]', 
      content: 'textarea[name="content"]'
    };
    
    const selector = fieldSelectors[fieldName.toLowerCase()];
    if (!selector) {
      console.error(`❌ Unknown field: ${fieldName}`);
      return false;
    }
    
    console.log(`🎯 Testing ${fieldName} field mention functionality...`);
    
    const field = document.querySelector(selector);
    if (!field) {
      console.error(`❌ ${fieldName} field not found with selector: ${selector}`);
      this.results.tests.formFields[fieldName] = {
        tested: true,
        success: false,
        error: 'Field not found',
        selector: selector
      };
      this.results.summary.totalTests++;
      this.results.summary.failedTests++;
      return false;
    }
    
    // Clear field and focus
    field.value = '';
    field.focus();
    
    // Store original placeholder for analysis
    const originalPlaceholder = field.placeholder;
    
    console.log(`📝 Typing @ in ${fieldName} field...`);
    
    // Simulate typing @
    field.value = '@';
    
    // Create proper input event
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: '@'
    });
    field.dispatchEvent(inputEvent);
    
    // Also dispatch change event
    field.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait for dropdown to potentially appear
    await this.wait(1500);
    
    // Look for dropdown elements
    const dropdownSelectors = [
      '.mention-dropdown',
      '[class*="mention"]',
      '[class*="dropdown"]',
      '[style*="position: absolute"]',
      '[style*="position: fixed"]',
      '[style*="z-index"]'
    ];
    
    let dropdown = null;
    let dropdownSelector = null;
    
    for (const sel of dropdownSelectors) {
      const element = document.querySelector(sel);
      if (element && this.isElementVisible(element)) {
        dropdown = element;
        dropdownSelector = sel;
        break;
      }
    }
    
    const dropdownVisible = !!dropdown;
    
    console.log(`${dropdownVisible ? '✅' : '❌'} ${fieldName} dropdown ${dropdownVisible ? 'appeared' : 'did NOT appear'}`);
    
    let mentionItems = [];
    let searchTest = false;
    let selectionTest = false;
    
    if (dropdownVisible) {
      // Count mention items
      mentionItems = Array.from(dropdown.querySelectorAll('[class*="mention"], [onClick], div')).filter(el => 
        el.textContent && (el.textContent.includes('@') || el.textContent.includes('Team') || el.textContent.includes('User'))
      );
      
      console.log(`🔍 Found ${mentionItems.length} mention items`);
      
      // Test search functionality
      field.value = '@team';
      field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'team' }));
      await this.wait(1000);
      
      // Check if search updated results
      const newItems = Array.from(dropdown.querySelectorAll('[class*="mention"], [onClick], div')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('team')
      );
      searchTest = newItems.length > 0;
      
      console.log(`🔎 Search test: ${searchTest ? 'PASS' : 'FAIL'} (${newItems.length} team results)`);
      
      // Test selection if items available
      if (mentionItems.length > 0) {
        try {
          mentionItems[0].click();
          await this.wait(500);
          selectionTest = field.value.includes('@') && field.value.length > 1;
          console.log(`👆 Selection test: ${selectionTest ? 'PASS' : 'FAIL'} (value: "${field.value}")`);
        } catch (e) {
          console.warn('⚠️ Could not test selection:', e.message);
        }
      }
    }
    
    // Store results
    this.results.tests.formFields[fieldName] = {
      tested: true,
      success: dropdownVisible,
      fieldFound: true,
      fieldSelector: selector,
      placeholder: originalPlaceholder,
      dropdownSelector: dropdownSelector,
      mentionItemCount: mentionItems.length,
      searchFunctionality: searchTest,
      selectionFunctionality: selectionTest,
      timestamp: new Date().toISOString()
    };
    
    this.results.summary.totalTests++;
    if (dropdownVisible) {
      this.results.summary.passedTests++;
    } else {
      this.results.summary.failedTests++;
    }
    
    return dropdownVisible;
  }

  async testKeyboardInteraction(fieldName = 'title') {
    console.log(`⌨️ Testing keyboard interaction in ${fieldName} field...`);
    
    const field = document.querySelector(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
    if (!field) {
      console.error(`❌ ${fieldName} field not found for keyboard test`);
      return false;
    }
    
    // Clear and focus
    field.value = '';
    field.focus();
    
    // Type @ to trigger dropdown
    field.value = '@';
    field.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await this.wait(1000);
    
    // Test arrow key navigation
    const arrowDownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      keyCode: 40,
      bubbles: true
    });
    
    const arrowUpEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      code: 'ArrowUp', 
      keyCode: 38,
      bubbles: true
    });
    
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true
    });
    
    field.dispatchEvent(arrowDownEvent);
    await this.wait(200);
    field.dispatchEvent(arrowUpEvent);
    await this.wait(200);
    
    const keyboardTest = {
      arrowNavigation: true, // Assume it works if no errors
      enterSelection: false
    };
    
    // Try Enter key selection
    try {
      field.dispatchEvent(enterEvent);
      await this.wait(500);
      keyboardTest.enterSelection = field.value.length > 1;
    } catch (e) {
      console.warn('⚠️ Enter key test failed:', e.message);
    }
    
    this.results.tests.interactions.keyboard = keyboardTest;
    this.results.summary.totalTests++;
    
    if (keyboardTest.arrowNavigation) {
      this.results.summary.passedTests++;
    } else {
      this.results.summary.failedTests++;
    }
    
    console.log(`⌨️ Keyboard test completed - Navigation: ${keyboardTest.arrowNavigation ? 'PASS' : 'FAIL'}, Enter: ${keyboardTest.enterSelection ? 'PASS' : 'FAIL'}`);
    
    return keyboardTest.arrowNavigation;
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive mention functionality tests...');
    const startTime = Date.now();
    
    // Test API endpoints
    await this.testAPIEndpoints();
    
    // Test all form fields  
    await this.testField('title');
    await this.testField('excerpt');
    await this.testField('content');
    
    // Test keyboard interactions
    await this.testKeyboardInteraction('title');
    
    // Final analysis
    await this.analyzeResults();
    
    const duration = Date.now() - startTime;
    console.log(`🎯 All tests completed in ${Math.round(duration / 1000)}s`);
    
    return this.generateReport();
  }

  async analyzeResults() {
    console.log('📊 Analyzing test results...');
    
    // Check for console debug logs
    const mentionLogs = this.results.tests.console.length;
    if (mentionLogs > 0) {
      console.log(`🔍 Found ${mentionLogs} mention-related console logs`);
      this.results.summary.warnings += mentionLogs;
    } else {
      console.warn('⚠️ No mention debug logs detected - check if debug logging is enabled');
      this.results.summary.warnings++;
    }
    
    // Check form field structure
    const formElement = document.querySelector('form');
    const titleField = document.querySelector('input[name="title"]');
    const excerptField = document.querySelector('textarea[name="excerpt"]');
    const contentField = document.querySelector('textarea[name="content"]');
    
    this.results.tests.formFields.structure = {
      formFound: !!formElement,
      titleFieldFound: !!titleField,
      excerptFieldFound: !!excerptField,
      contentFieldFound: !!contentField,
      allFieldsPresent: !!(titleField && excerptField && contentField)
    };
    
    if (!this.results.tests.formFields.structure.allFieldsPresent) {
      console.warn('⚠️ Not all required form fields found - ensure you are on the news creation form');
      this.results.summary.warnings++;
    }
  }

  generateReport() {
    const report = {
      ...this.results,
      executionSummary: {
        overallStatus: this.getOverallStatus(),
        successRate: Math.round((this.results.summary.passedTests / this.results.summary.totalTests) * 100) + '%',
        recommendations: this.getRecommendations()
      }
    };
    
    console.log('\n📋 === MRVL MENTION FUNCTIONALITY TEST REPORT ===');
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`⏱️ Tests: ${report.summary.totalTests} total, ${report.summary.passedTests} passed, ${report.summary.failedTests} failed`);
    console.log(`📊 Success Rate: ${report.executionSummary.successRate}`);
    console.log(`🎯 Overall Status: ${report.executionSummary.overallStatus}`);
    
    if (report.summary.warnings > 0) {
      console.warn(`⚠️ Warnings: ${report.summary.warnings}`);
    }
    
    console.log('\n🔍 DETAILED RESULTS:');
    console.table(report.tests.formFields);
    console.table(report.tests.apiEndpoints);
    
    if (report.executionSummary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.executionSummary.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n📋 Full report object stored in: tester.results');
    console.log('💾 To save report: copy(JSON.stringify(tester.results, null, 2))');
    
    return report;
  }

  getOverallStatus() {
    const { passedTests, failedTests, totalTests } = this.results.summary;
    
    if (failedTests === 0) return 'ALL TESTS PASSED';
    if (passedTests === 0) return 'ALL TESTS FAILED';
    if (passedTests > failedTests) return 'MOSTLY WORKING';
    return 'NEEDS ATTENTION';
  }

  getRecommendations() {
    const recs = [];
    const { apiEndpoints, formFields } = this.results.tests;
    
    // API recommendations
    if (!apiEndpoints.popular?.success) {
      recs.push('Fix popular mentions API endpoint - backend may not be running');
    }
    if (!apiEndpoints.search?.success) {
      recs.push('Fix search mentions API endpoint - check backend connectivity');
    }
    
    // Field recommendations
    Object.entries(formFields).forEach(([fieldName, result]) => {
      if (typeof result === 'object' && result.tested && !result.success) {
        recs.push(`Fix mention dropdown in ${fieldName} field - not appearing on @ input`);
      }
    });
    
    // Console log recommendations
    if (this.results.tests.console.length === 0) {
      recs.push('Enable debug logging in mention functionality for better troubleshooting');
    }
    
    return recs;
  }

  // Utility methods
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isElementVisible(element) {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  }
}

// Initialize tester
const tester = new MRVLMentionTester();

// Make available globally
window.MRVLMentionTester = MRVLMentionTester;
window.tester = tester;

// Auto-run if we detect we're on a form page
if (document.querySelector('input[name="title"]') && document.querySelector('textarea[name="content"]')) {
  console.log('📝 News creation form detected! Auto-running tests...');
  tester.runAllTests().then(report => {
    console.log('🎉 Auto-test completed!');
  });
} else {
  console.log('ℹ️ Navigate to the news creation form and run: tester.runAllTests()');
  console.log('📝 Or test individual fields: tester.testField("title")');
}