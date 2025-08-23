#!/usr/bin/env node

const { RealTimeProfileTester } = require('./realtime-profile-update-test');
const { WebSocketProfileTester } = require('./websocket-profile-test');
const { ProfileLiveIndicatorTester } = require('./profile-live-indicator-test');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Test Runner for Real-Time Profile Updates
 * Runs all profile real-time functionality tests and generates combined report
 */

class ProfileRealTimeTestSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testSuites: {},
      overallSummary: {},
      errors: []
    };
  }

  async runAllTests() {
    console.log('🎮 Starting Comprehensive Profile Real-Time Test Suite...');
    console.log('================================================================');
    
    try {
      // Test 1: Live Indicator Tests (fastest)
      console.log('\n🎯 Running Live Indicator Tests...');
      const indicatorTester = new ProfileLiveIndicatorTester();
      this.results.testSuites.liveIndicators = await indicatorTester.runAllTests();
      
      // Test 2: WebSocket Tests
      console.log('\n🌐 Running WebSocket Communication Tests...');
      const websocketTester = new WebSocketProfileTester();
      this.results.testSuites.websocket = await websocketTester.runAllTests();
      
      // Test 3: Full Real-Time Profile Tests (most comprehensive)
      console.log('\n🔄 Running Full Real-Time Profile Tests...');
      const profileTester = new RealTimeProfileTester();
      this.results.testSuites.realTimeProfile = await profileTester.runAllTests();
      
      // Generate comprehensive summary
      this.generateOverallSummary();
      
      // Generate combined report
      await this.generateCombinedReport();
      
      console.log('\n🏁 All tests completed!');
      this.printSummary();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error.message);
      this.results.errors.push(`Test suite error: ${error.message}`);
      return this.results;
    }
  }

  generateOverallSummary() {
    const suites = this.results.testSuites;
    const summary = {
      totalSuites: Object.keys(suites).length,
      passedSuites: 0,
      totalTests: 0,
      passedTests: 0,
      features: {
        liveIndicators: false,
        websocketSupport: false,
        pollingFallback: false,
        realTimeUpdates: false,
        timestampUpdates: false,
        multiClientSync: false
      }
    };

    Object.values(suites).forEach(suite => {
      if (suite.summary?.overallPassed) {
        summary.passedSuites++;
      }
      
      summary.totalTests += suite.summary?.totalTests || 0;
      summary.passedTests += suite.summary?.passedTests || 0;
    });

    // Analyze specific features
    if (suites.liveIndicators?.summary?.overallPassed) {
      summary.features.liveIndicators = true;
      summary.features.timestampUpdates = suites.liveIndicators.tests.timestampUpdates?.passed || false;
    }

    if (suites.websocket) {
      summary.features.websocketSupport = suites.websocket.tests.websocketConnection?.websocketAvailable || false;
      summary.features.pollingFallback = suites.websocket.tests.pollingFallback?.passed || false;
      summary.features.multiClientSync = suites.websocket.tests.realTimeSync?.passed || false;
    }

    if (suites.realTimeProfile?.summary?.overallPassed) {
      summary.features.realTimeUpdates = true;
    }

    summary.overallPassed = summary.passedSuites === summary.totalSuites;
    summary.successRate = summary.totalTests > 0 ? (summary.passedTests / summary.totalTests) * 100 : 0;

    this.results.overallSummary = summary;
  }

  async generateCombinedReport() {
    const reportData = {
      ...this.results,
      metadata: {
        testDuration: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Save detailed JSON report
    const jsonReportPath = path.join(__dirname, `profile-realtime-test-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Generate human-readable HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlReportPath = path.join(__dirname, `profile-realtime-test-report-${Date.now()}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`📄 Detailed report saved: ${jsonReportPath}`);
    console.log(`🌐 HTML report saved: ${htmlReportPath}`);
  }

  generateHTMLReport(data) {
    const { overallSummary, testSuites } = data;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile Real-Time Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status-passed { color: #22c55e; font-weight: bold; }
        .status-failed { color: #ef4444; font-weight: bold; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .test-section { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 6px; }
        .test-details { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .feature-status { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin: 2px; }
        .feature-enabled { background: #dcfce7; color: #166534; }
        .feature-disabled { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Profile Real-Time Test Report</h1>
            <p>Generated: ${new Date(data.timestamp).toLocaleString()}</p>
            <h2 class="${overallSummary.overallPassed ? 'status-passed' : 'status-failed'}">
                Overall Status: ${overallSummary.overallPassed ? '✅ PASSED' : '❌ FAILED'}
            </h2>
            <p>Success Rate: ${overallSummary.successRate.toFixed(1)}%</p>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>Test Suites</h3>
                <p><strong>${overallSummary.passedSuites}</strong> / ${overallSummary.totalSuites} passed</p>
            </div>
            <div class="summary-card">
                <h3>Individual Tests</h3>
                <p><strong>${overallSummary.passedTests}</strong> / ${overallSummary.totalTests} passed</p>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <p><strong>${overallSummary.successRate.toFixed(1)}%</strong></p>
            </div>
        </div>

        <div class="test-section">
            <h3>🔧 Feature Status</h3>
            <div>
                ${Object.entries(overallSummary.features).map(([feature, enabled]) => 
                  `<span class="feature-status ${enabled ? 'feature-enabled' : 'feature-disabled'}">
                     ${feature}: ${enabled ? '✅' : '❌'}
                   </span>`
                ).join('')}
            </div>
        </div>

        ${Object.entries(testSuites).map(([suiteName, suite]) => `
          <div class="test-section">
              <h3>${suiteName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
              <p class="${suite.summary?.overallPassed ? 'status-passed' : 'status-failed'}">
                  Status: ${suite.summary?.overallPassed ? '✅ PASSED' : '❌ FAILED'}
              </p>
              ${suite.summary ? `
                <p>Tests: ${suite.summary.passedTests || 0} / ${suite.summary.totalTests || 0} passed</p>
              ` : ''}
              
              ${suite.tests ? Object.entries(suite.tests).map(([testName, test]) => `
                <div class="test-details">
                    <h4>${testName}</h4>
                    <p class="${test.passed ? 'status-passed' : 'status-failed'}">
                        ${test.passed ? '✅ PASSED' : '❌ FAILED'}
                    </p>
                    ${test.details ? `<p><small>${test.details}</small></p>` : ''}
                    ${test.error ? `<p style="color: #ef4444;"><small>Error: ${test.error}</small></p>` : ''}
                </div>
              `).join('') : ''}
          </div>
        `).join('')}

        <div class="test-section">
            <h3>📊 Performance Metrics</h3>
            ${testSuites.realTimeProfile?.performance ? `
              <div class="test-details">
                  <p>Load Time: ${testSuites.realTimeProfile.performance.loadTime}ms</p>
                  <p>Action Duration: ${testSuites.realTimeProfile.performance.actionDuration}ms</p>
                  <p>JS Heap Used: ${Math.round(testSuites.realTimeProfile.performance.jsHeapUsedSize / 1024 / 1024)}MB</p>
              </div>
            ` : '<p>No performance metrics available</p>'}
        </div>

        <div class="test-section">
            <h3>🔗 Real-Time Features Summary</h3>
            <ul>
                <li><strong>Live Indicators:</strong> ${overallSummary.features.liveIndicators ? '✅ Working' : '❌ Not working'}</li>
                <li><strong>30-Second Polling:</strong> ${testSuites.realTimeProfile?.tests?.pollingMechanism?.passed ? '✅ Working' : '❌ Not working'}</li>
                <li><strong>Activity Context Triggers:</strong> ${testSuites.realTimeProfile?.tests?.activityTriggers?.passed ? '✅ Working' : '❌ Not working'}</li>
                <li><strong>Timestamp Updates:</strong> ${overallSummary.features.timestampUpdates ? '✅ Working' : '❌ Not working'}</li>
                <li><strong>WebSocket Support:</strong> ${overallSummary.features.websocketSupport ? '✅ Available' : '❌ Not available'}</li>
                <li><strong>Polling Fallback:</strong> ${overallSummary.features.pollingFallback ? '✅ Working' : '❌ Not working'}</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
  }

  printSummary() {
    const { overallSummary } = this.results;
    
    console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('=====================================');
    console.log(`Overall Status: ${overallSummary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Test Suites: ${overallSummary.passedSuites}/${overallSummary.totalSuites} passed`);
    console.log(`Individual Tests: ${overallSummary.passedTests}/${overallSummary.totalTests} passed`);
    console.log(`Success Rate: ${overallSummary.successRate.toFixed(1)}%`);
    
    console.log('\n🔧 FEATURE STATUS:');
    Object.entries(overallSummary.features).forEach(([feature, enabled]) => {
      console.log(`  ${feature}: ${enabled ? '✅' : '❌'}`);
    });

    console.log('\n📈 RECOMMENDATIONS:');
    if (!overallSummary.features.websocketSupport && overallSummary.features.pollingFallback) {
      console.log('  • WebSocket not available, but polling fallback is working ✅');
    }
    if (!overallSummary.features.liveIndicators) {
      console.log('  • Consider adding visual live update indicators 🎨');
    }
    if (!overallSummary.features.timestampUpdates) {
      console.log('  • Timestamp updates may not be working correctly ⏰');
    }
    if (overallSummary.successRate < 80) {
      console.log('  • Review failed tests and improve real-time functionality 🔧');
    }
  }
}

// Command line execution
async function runProfileRealTimeTests() {
  const testSuite = new ProfileRealTimeTestSuite();
  const results = await testSuite.runAllTests();
  
  process.exit(results.overallSummary?.overallPassed ? 0 : 1);
}

// Export for use in other scripts
module.exports = { ProfileRealTimeTestSuite };

// Run if called directly
if (require.main === module) {
  runProfileRealTimeTests().catch(console.error);
}