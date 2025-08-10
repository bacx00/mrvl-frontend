#!/usr/bin/env node
/**
 * MRVL Platform - Events & Brackets API Testing Suite
 * 
 * Tests the API endpoints for Events and Brackets functionality
 * without requiring authentication (testing public endpoints and structure)
 */

const axios = require('axios');
const fs = require('fs').promises;

class EventsBracketsAPITest {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.testResults = {
      publicEndpoints: [],
      eventEndpoints: [],
      bracketEndpoints: [],
      dataStructure: [],
      errors: []
    };
    this.summary = {
      total: 0,
      passed: 0,
      failed: 0
    };
  }

  async init() {
    console.log('🚀 Starting MRVL Events & Brackets API Testing Suite...\n');
    
    await this.testPublicEndpoints();
    await this.testEventEndpoints();
    await this.testBracketEndpoints();
    await this.testDataStructures();
    await this.generateReport();
  }

  async testPublicEndpoints() {
    console.log('🌐 Testing Public API Endpoints...\n');

    const publicEndpoints = [
      { url: '/events', name: 'Public Events List' },
      { url: '/brackets', name: 'Public Brackets List' },
      { url: '/rankings', name: 'Public Rankings' },
      { url: '/players', name: 'Public Players' },
      { url: '/teams', name: 'Public Teams' }
    ];

    for (const endpoint of publicEndpoints) {
      await this.testEndpoint(endpoint.url, endpoint.name, 'publicEndpoints');
    }

    console.log('✅ Public endpoints testing completed\n');
  }

  async testEventEndpoints() {
    console.log('📅 Testing Event-Related Endpoints...\n');

    const eventEndpoints = [
      { url: '/events', name: 'Events List' },
      { url: '/events/1', name: 'Single Event (may not exist)' },
      { url: '/public/events', name: 'Public Events Alternative' }
    ];

    for (const endpoint of eventEndpoints) {
      await this.testEndpoint(endpoint.url, endpoint.name, 'eventEndpoints');
    }

    // Try to get actual event IDs if events exist
    try {
      const response = await axios.get(`${this.baseURL}/events`);
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          const eventId = response.data[0].id;
          await this.testEndpoint(`/events/${eventId}`, `Actual Event (ID: ${eventId})`, 'eventEndpoints');
          
          // Test event-specific endpoints
          const eventSpecificEndpoints = [
            { url: `/events/${eventId}/bracket`, name: `Event ${eventId} Bracket` },
            { url: `/events/${eventId}/comprehensive-bracket`, name: `Event ${eventId} Comprehensive Bracket` },
            { url: `/events/${eventId}/bracket-visualization`, name: `Event ${eventId} Bracket Visualization` },
            { url: `/events/${eventId}/standings`, name: `Event ${eventId} Standings` }
          ];

          for (const endpoint of eventSpecificEndpoints) {
            await this.testEndpoint(endpoint.url, endpoint.name, 'bracketEndpoints');
          }
        }
      }
    } catch (error) {
      console.log('ℹ️  No events found or different response structure');
    }

    console.log('✅ Event endpoints testing completed\n');
  }

  async testBracketEndpoints() {
    console.log('🏆 Testing Bracket-Related Endpoints...\n');

    const bracketEndpoints = [
      { url: '/brackets', name: 'Brackets List' },
      { url: '/brackets/1', name: 'Single Bracket (may not exist)' },
      { url: '/live-matches', name: 'Live Matches' }
    ];

    for (const endpoint of bracketEndpoints) {
      await this.testEndpoint(endpoint.url, endpoint.name, 'bracketEndpoints');
    }

    console.log('✅ Bracket endpoints testing completed\n');
  }

  async testEndpoint(url, name, category, expectedStatus = [200, 404]) {
    this.summary.total++;
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseURL}${url}`);
      const responseTime = Date.now() - startTime;
      
      const result = {
        test: name,
        url: url,
        status: 'PASS',
        httpStatus: response.status,
        responseTime: responseTime,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        hasData: response.data !== null && response.data !== undefined
      };

      // Analyze response structure
      if (response.data) {
        result.dataStructure = this.analyzeDataStructure(response.data);
      }

      this.testResults[category].push(result);
      this.summary.passed++;

      console.log(`✅ ${name}: ${response.status} (${responseTime}ms)`);
      
    } catch (error) {
      const result = {
        test: name,
        url: url,
        status: error.response?.status === 404 ? 'EXPECTED' : 'FAIL',
        httpStatus: error.response?.status,
        error: error.response?.data || error.message,
        responseTime: 0
      };

      this.testResults[category].push(result);
      
      if (error.response?.status === 404 && expectedStatus.includes(404)) {
        result.status = 'EXPECTED';
        console.log(`ℹ️  ${name}: 404 (Expected - resource may not exist)`);
      } else {
        this.summary.failed++;
        console.log(`❌ ${name}: ${error.response?.status || 'ERROR'} - ${error.message}`);
      }
    }
  }

  async testDataStructures() {
    console.log('🔍 Testing Data Structures and Validation...\n');

    // Test data structure consistency
    const dataStructureTests = [
      {
        name: 'Events Data Structure',
        test: async () => {
          const response = await axios.get(`${this.baseURL}/events`);
          return this.validateEventStructure(response.data);
        }
      },
      {
        name: 'Brackets Data Structure',
        test: async () => {
          const response = await axios.get(`${this.baseURL}/brackets`);
          return this.validateBracketStructure(response.data);
        }
      }
    ];

    for (const test of dataStructureTests) {
      try {
        const result = await test.test();
        this.testResults.dataStructure.push({
          test: test.name,
          status: 'PASS',
          ...result
        });
        this.summary.passed++;
        console.log(`✅ ${test.name}: Valid structure`);
      } catch (error) {
        this.testResults.dataStructure.push({
          test: test.name,
          status: 'FAIL',
          error: error.message
        });
        this.summary.failed++;
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    console.log('✅ Data structure testing completed\n');
  }

  analyzeDataStructure(data) {
    if (Array.isArray(data)) {
      if (data.length > 0) {
        return {
          type: 'array',
          length: data.length,
          itemStructure: this.analyzeDataStructure(data[0])
        };
      } else {
        return {
          type: 'array',
          length: 0,
          empty: true
        };
      }
    } else if (typeof data === 'object' && data !== null) {
      return {
        type: 'object',
        keys: Object.keys(data),
        keyCount: Object.keys(data).length
      };
    } else {
      return {
        type: typeof data,
        value: data
      };
    }
  }

  validateEventStructure(data) {
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { valid: true, message: 'Empty events array' };
      }
      
      const firstEvent = data[0];
      const requiredFields = ['id', 'name'];
      const missingFields = requiredFields.filter(field => !(field in firstEvent));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      return {
        valid: true,
        sampleFields: Object.keys(firstEvent),
        eventCount: data.length
      };
    } else if (typeof data === 'object' && data !== null) {
      // Single event or wrapped response
      if (data.data && Array.isArray(data.data)) {
        return this.validateEventStructure(data.data);
      } else {
        return {
          valid: true,
          responseType: 'object',
          keys: Object.keys(data)
        };
      }
    }
    
    throw new Error('Invalid events data structure');
  }

  validateBracketStructure(data) {
    if (Array.isArray(data)) {
      return {
        valid: true,
        bracketCount: data.length,
        sampleFields: data.length > 0 ? Object.keys(data[0]) : []
      };
    } else if (typeof data === 'object' && data !== null) {
      return {
        valid: true,
        responseType: 'object',
        keys: Object.keys(data)
      };
    }
    
    throw new Error('Invalid brackets data structure');
  }

  async generateReport() {
    console.log('📊 Generating API Test Report...\n');

    const report = {
      testSuite: 'MRVL Events & Brackets API Testing',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.summary.total,
        passed: this.summary.passed,
        failed: this.summary.failed,
        successRate: this.summary.total > 0 ? Math.round((this.summary.passed / this.summary.total) * 100) : 0
      },
      results: this.testResults,
      analysis: this.generateAnalysis()
    };

    // Save JSON report
    const filename = `events-brackets-api-test-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlFilename = `events-brackets-api-test-${Date.now()}.html`;
    await fs.writeFile(htmlFilename, htmlReport);

    // Console summary
    console.log('📋 API TEST SUMMARY:');
    console.log('===================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`\nReports saved: ${filename}, ${htmlFilename}\n`);

    // Print detailed results
    console.log('📝 DETAILED RESULTS:');
    console.log('====================');
    
    this.printCategoryResults('Public Endpoints', this.testResults.publicEndpoints);
    this.printCategoryResults('Event Endpoints', this.testResults.eventEndpoints);
    this.printCategoryResults('Bracket Endpoints', this.testResults.bracketEndpoints);
    this.printCategoryResults('Data Structure', this.testResults.dataStructure);

    if (report.summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.printFailedTests();
    }

    return report;
  }

  printCategoryResults(category, results) {
    console.log(`\n${category}:`);
    results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : 
                    result.status === 'EXPECTED' ? 'ℹ️' : '❌';
      console.log(`  ${status} ${result.test} (${result.httpStatus || 'N/A'})`);
      
      if (result.responseTime) {
        console.log(`      Response time: ${result.responseTime}ms`);
      }
      
      if (result.dataStructure) {
        console.log(`      Data: ${result.dataStructure.type} with ${result.dataStructure.keyCount || result.dataStructure.length || 0} items`);
      }
    });
  }

  printFailedTests() {
    const allResults = [
      ...this.testResults.publicEndpoints,
      ...this.testResults.eventEndpoints,
      ...this.testResults.bracketEndpoints,
      ...this.testResults.dataStructure
    ];

    allResults
      .filter(result => result.status === 'FAIL')
      .forEach(result => {
        console.log(`  ❌ ${result.test}: ${result.error || 'Unknown error'}`);
      });
  }

  generateAnalysis() {
    const analysis = {
      endpointStatus: {
        working: [],
        notFound: [],
        errors: []
      },
      responseTypes: {},
      avgResponseTimes: {},
      recommendations: []
    };

    const allResults = [
      ...this.testResults.publicEndpoints,
      ...this.testResults.eventEndpoints,
      ...this.testResults.bracketEndpoints
    ];

    allResults.forEach(result => {
      if (result.status === 'PASS') {
        analysis.endpointStatus.working.push(result.test);
      } else if (result.httpStatus === 404) {
        analysis.endpointStatus.notFound.push(result.test);
      } else {
        analysis.endpointStatus.errors.push(result.test);
      }

      if (result.dataType) {
        analysis.responseTypes[result.dataType] = (analysis.responseTypes[result.dataType] || 0) + 1;
      }

      if (result.responseTime) {
        analysis.avgResponseTimes[result.test] = result.responseTime;
      }
    });

    // Generate recommendations
    if (analysis.endpointStatus.errors.length > 0) {
      analysis.recommendations.push({
        priority: 'HIGH',
        issue: `${analysis.endpointStatus.errors.length} endpoints returning errors`,
        action: 'Investigate and fix failing endpoints'
      });
    }

    const slowEndpoints = Object.entries(analysis.avgResponseTimes)
      .filter(([_, time]) => time > 1000)
      .map(([name]) => name);
    
    if (slowEndpoints.length > 0) {
      analysis.recommendations.push({
        priority: 'MEDIUM',
        issue: `${slowEndpoints.length} slow endpoints (>1s)`,
        action: 'Optimize response times for better user experience'
      });
    }

    return analysis;
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MRVL Events & Brackets API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af; }
        .section { margin: 20px 0; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .test-item { margin: 10px 0; padding: 10px; border-radius: 4px; border-left: 4px solid #e5e7eb; }
        .pass { background: #dcfce7; border-left-color: #16a34a; }
        .fail { background: #fef2f2; border-left-color: #dc2626; }
        .expected { background: #fef3c7; border-left-color: #f59e0b; }
        pre { background: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
        .recommendations { background: #fefce8; border: 1px solid #facc15; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .recommendation-item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MRVL Events & Brackets API Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>

    <div class="summary">
        <div class="stat-card">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.totalTests}</div>
        </div>
        <div class="stat-card">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #16a34a;">${report.summary.passed}</div>
        </div>
        <div class="stat-card">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #dc2626;">${report.summary.failed}</div>
        </div>
        <div class="stat-card">
            <h3>Success Rate</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.successRate}%</div>
        </div>
    </div>

    ${report.analysis.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>🔧 Recommendations</h2>
        ${report.analysis.recommendations.map(rec => `
            <div class="recommendation-item">
                <strong>${rec.priority} Priority:</strong> ${rec.issue}<br>
                <em>Action:</em> ${rec.action}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>📊 Test Results by Category</h2>
        ${this.generateHTMLResults(report.results)}
    </div>

    <div class="section">
        <h2>📈 Analysis</h2>
        <h3>Working Endpoints: ${report.analysis.endpointStatus.working.length}</h3>
        <h3>Not Found (404): ${report.analysis.endpointStatus.notFound.length}</h3>
        <h3>Errors: ${report.analysis.endpointStatus.errors.length}</h3>
        
        ${Object.keys(report.analysis.avgResponseTimes).length > 0 ? `
        <h3>Response Times</h3>
        <pre>${JSON.stringify(report.analysis.avgResponseTimes, null, 2)}</pre>
        ` : ''}
    </div>

    <div class="section">
        <h2>🔍 Raw Test Data</h2>
        <pre>${JSON.stringify(report.results, null, 2)}</pre>
    </div>
</body>
</html>`;
  }

  generateHTMLResults(results) {
    return Object.entries(results).map(([category, tests]) => `
      <div class="section">
        <h3>${category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
        ${tests.map(test => `
          <div class="test-item ${test.status.toLowerCase()}">
            <strong>${test.test}</strong><br>
            Status: ${test.status} (${test.httpStatus || 'N/A'})<br>
            ${test.responseTime ? `Response Time: ${test.responseTime}ms<br>` : ''}
            ${test.dataType ? `Data Type: ${test.dataType}<br>` : ''}
            ${test.error ? `Error: ${test.error}<br>` : ''}
            ${test.dataStructure ? `Structure: ${JSON.stringify(test.dataStructure)}<br>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }
}

// Run the API test suite
const apiTest = new EventsBracketsAPITest();
apiTest.init().catch(console.error);