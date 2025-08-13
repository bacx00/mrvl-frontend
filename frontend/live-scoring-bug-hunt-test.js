#!/usr/bin/env node

/**
 * COMPREHENSIVE LIVE SCORING BUG HUNT TEST
 * 
 * This script tests all identified critical bugs in the Marvel Rivals live scoring system:
 * 1. API route existence and functionality
 * 2. Database persistence of live updates  
 * 3. SSE connection availability
 * 4. Data synchronization between components
 * 
 * Created by Bug Hunter Specialist
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const BACKEND_URL = 'https://staging.mrvl.net';  // Backend URL
const API_BASE = `${BACKEND_URL}/api`;
const TEST_RESULTS = [];

// Test authentication token (you may need to update this)
let AUTH_TOKEN = null;

console.log('🐛 MARVEL RIVALS LIVE SCORING BUG HUNT TEST');
console.log('=================================================');
console.log('Backend URL:', BACKEND_URL);
console.log('Starting comprehensive bug detection...\n');

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const requestLib = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MRVL-Bug-Hunter-Test/1.0',
        ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
        ...(options.headers || {})
      }
    };

    const req = requestLib.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test function wrapper
async function runTest(testName, testFunction) {
  console.log(`🔍 Testing: ${testName}`);
  const startTime = Date.now();
  
  try {
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    const testResult = {
      test: testName,
      status: result.success ? 'PASS' : 'FAIL',
      duration: `${duration}ms`,
      details: result.details || {},
      issues: result.issues || [],
      recommendations: result.recommendations || []
    };
    
    TEST_RESULTS.push(testResult);
    
    if (result.success) {
      console.log(`✅ PASS: ${testName} (${duration}ms)`);
    } else {
      console.log(`❌ FAIL: ${testName} (${duration}ms)`);
      if (result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.join(', ')}`);
      }
    }
    console.log('');
    
    return testResult;
  } catch (error) {
    const duration = Date.now() - startTime;
    const testResult = {
      test: testName,
      status: 'ERROR',
      duration: `${duration}ms`,
      error: error.message,
      issues: [`Test execution failed: ${error.message}`],
      recommendations: ['Review test implementation and network connectivity']
    };
    
    TEST_RESULTS.push(testResult);
    console.log(`💥 ERROR: ${testName} - ${error.message} (${duration}ms)\n`);
    return testResult;
  }
}

// BUG TEST 1: Check if admin login works and get auth token
async function testAdminAuthentication() {
  try {
    const response = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'admin@admin.com',
        password: 'password123'
      }
    });
    
    if (response.statusCode === 200 && response.data.access_token) {
      AUTH_TOKEN = response.data.access_token;
      return {
        success: true,
        details: {
          statusCode: response.statusCode,
          hasToken: !!AUTH_TOKEN,
          tokenLength: AUTH_TOKEN ? AUTH_TOKEN.length : 0
        }
      };
    }
    
    return {
      success: false,
      issues: [`Authentication failed - Status: ${response.statusCode}`],
      details: response.data,
      recommendations: [
        'Verify admin credentials exist in database',
        'Check if auth/login endpoint is working',
        'Verify Laravel Passport/Sanctum configuration'
      ]
    };
  } catch (error) {
    return {
      success: false,
      issues: [`Authentication request failed: ${error.message}`],
      recommendations: [
        'Check backend server availability',
        'Verify API endpoint exists'
      ]
    };
  }
}

// BUG TEST 2: Check if the missing API route exists
async function testUpdateLiveStatsRoute() {
  if (!AUTH_TOKEN) {
    return {
      success: false,
      issues: ['No authentication token available'],
      recommendations: ['Fix authentication first']
    };
  }
  
  // First get a match ID to test with
  const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`, {
    method: 'GET'
  });
  
  if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data || matchesResponse.data.data.length === 0) {
    return {
      success: false,
      issues: ['No matches available for testing'],
      recommendations: ['Create test match data in database']
    };
  }
  
  const testMatchId = matchesResponse.data.data[0].id;
  const testUrl = `${API_BASE}/admin/matches/${testMatchId}/update-live-stats`;
  
  const response = await makeRequest(testUrl, {
    method: 'POST',
    body: {
      series_score_team1: 1,
      series_score_team2: 0,
      status: 'live',
      team1_players: [],
      team2_players: []
    }
  });
  
  const routeExists = response.statusCode !== 404;
  const isWorking = response.statusCode === 200 || response.statusCode === 422; // 422 = validation error is OK
  
  return {
    success: routeExists,
    details: {
      statusCode: response.statusCode,
      routeExists,
      isWorking,
      testMatchId,
      testUrl,
      response: response.data
    },
    issues: routeExists ? [] : ['API route /admin/matches/{id}/update-live-stats does not exist or is not accessible'],
    recommendations: routeExists ? [] : [
      'Verify route is defined in routes/api.php',
      'Check middleware permissions for admin routes',
      'Ensure MatchController@updateLiveStatsComprehensive method exists'
    ]
  };
}

// BUG TEST 3: Test database persistence 
async function testDatabasePersistence() {
  if (!AUTH_TOKEN) {
    return {
      success: false,
      issues: ['No authentication token available'],
      recommendations: ['Fix authentication first']
    };
  }
  
  try {
    // Get a match ID
    const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
    if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
      return {
        success: false,
        issues: ['No matches available for testing database persistence']
      };
    }
    
    const testMatchId = matchesResponse.data.data[0].id;
    const initialScore = { team1: 0, team2: 0 };
    const updatedScore = { team1: 2, team2: 1 };
    
    // Get initial state
    const initialResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}`);
    if (initialResponse.statusCode === 200) {
      initialScore.team1 = initialResponse.data.team1_score || 0;
      initialScore.team2 = initialResponse.data.team2_score || 0;
    }
    
    // Update scores
    const updateResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}/update-live-stats`, {
      method: 'POST',
      body: {
        series_score_team1: updatedScore.team1,
        series_score_team2: updatedScore.team2,
        status: 'live'
      }
    });
    
    if (updateResponse.statusCode !== 200) {
      return {
        success: false,
        issues: [`Update request failed with status ${updateResponse.statusCode}`],
        details: updateResponse.data
      };
    }
    
    // Wait a moment for database write
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify persistence by fetching data again
    const verifyResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}`);
    
    if (verifyResponse.statusCode !== 200) {
      return {
        success: false,
        issues: ['Could not verify data persistence - fetch failed'],
        details: verifyResponse
      };
    }
    
    const isPersisted = 
      verifyResponse.data.team1_score === updatedScore.team1 &&
      verifyResponse.data.team2_score === updatedScore.team2;
    
    return {
      success: isPersisted,
      details: {
        testMatchId,
        initialScores: initialScore,
        updatedScores: updatedScore,
        persistedScores: {
          team1: verifyResponse.data.team1_score,
          team2: verifyResponse.data.team2_score
        },
        isPersisted
      },
      issues: isPersisted ? [] : ['Live score updates are not persisting to database'],
      recommendations: isPersisted ? [] : [
        'Check database write permissions',
        'Verify updateLiveStatsComprehensive method actually saves to database',
        'Check for database transaction rollbacks',
        'Review database constraints that might prevent updates'
      ]
    };
  } catch (error) {
    return {
      success: false,
      issues: [`Database persistence test failed: ${error.message}`]
    };
  }
}

// BUG TEST 4: Test SSE endpoint availability
async function testSSEEndpoints() {
  try {
    // Get a match ID for testing
    const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
    if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
      return {
        success: false,
        issues: ['No matches available for SSE testing']
      };
    }
    
    const testMatchId = matchesResponse.data.data[0].id;
    const sseUrl = `${API_BASE}/public/matches/${testMatchId}/live-stream`;
    
    // Test if SSE endpoint exists (we can't fully test SSE connection in Node.js easily, but we can check if endpoint responds)
    const response = await makeRequest(sseUrl);
    
    // SSE endpoints typically return 200 or specific SSE headers
    const isSSEEndpoint = 
      response.statusCode === 200 ||
      response.headers['content-type']?.includes('text/event-stream') ||
      response.headers['cache-control']?.includes('no-cache');
    
    return {
      success: isSSEEndpoint,
      details: {
        testMatchId,
        sseUrl,
        statusCode: response.statusCode,
        headers: response.headers,
        isSSEEndpoint
      },
      issues: isSSEEndpoint ? [] : [
        'SSE endpoint /public/matches/{id}/live-stream is not working correctly',
        'SSE connections are disabled in frontend'
      ],
      recommendations: [
        isSSEEndpoint ? 
          'Re-enable SSE connections in MatchLiveSync.js' : 
          'Fix SSE endpoint implementation in MatchController@liveStream',
        'Test actual SSE connection with browser or specialized tool',
        'Verify server supports SSE (Server-Sent Events)'
      ]
    };
  } catch (error) {
    return {
      success: false,
      issues: [`SSE endpoint test failed: ${error.message}`]
    };
  }
}

// BUG TEST 5: Test real-time synchronization functionality
async function testRealTimeSynchronization() {
  // This tests if the broadcastLiveUpdate functionality is working
  if (!AUTH_TOKEN) {
    return {
      success: false,
      issues: ['No authentication token available']
    };
  }
  
  try {
    const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
    if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
      return {
        success: false,
        issues: ['No matches available for real-time sync testing']
      };
    }
    
    const testMatchId = matchesResponse.data.data[0].id;
    
    // Update match and check if broadcast cache is created
    const updateResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}/update-live-stats`, {
      method: 'POST',
      body: {
        series_score_team1: 1,
        series_score_team2: 1,
        status: 'live'
      }
    });
    
    if (updateResponse.statusCode !== 200) {
      return {
        success: false,
        issues: [`Update for sync test failed: ${updateResponse.statusCode}`],
        details: updateResponse.data
      };
    }
    
    // The broadcastLiveUpdate method should store update in cache
    // We can't easily test cache directly, but we can verify the response includes sync data
    const hasSyncData = updateResponse.data && (
      updateResponse.data.match_id === testMatchId ||
      updateResponse.data.team1_score !== undefined ||
      updateResponse.data.series_score_team1 !== undefined
    );
    
    return {
      success: hasSyncData,
      details: {
        testMatchId,
        updateResponse: updateResponse.data,
        hasSyncData
      },
      issues: hasSyncData ? [] : [
        'Real-time synchronization data not included in API response',
        'broadcastLiveUpdate method may not be working correctly'
      ],
      recommendations: [
        'Verify broadcastLiveUpdate method is called in updateLiveStatsComprehensive',
        'Check cache configuration and permissions',
        'Test with actual SSE connection to verify real-time updates'
      ]
    };
  } catch (error) {
    return {
      success: false,
      issues: [`Real-time sync test failed: ${error.message}`]
    };
  }
}

// Generate comprehensive bug report
function generateBugReport() {
  console.log('\n🐛 BUG HUNT SUMMARY REPORT');
  console.log('============================');
  
  let criticalIssues = 0;
  let totalTests = TEST_RESULTS.length;
  let passedTests = TEST_RESULTS.filter(t => t.status === 'PASS').length;
  
  TEST_RESULTS.forEach(result => {
    if (result.status === 'FAIL' || result.status === 'ERROR') {
      criticalIssues++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} PASSED`);
  console.log(`🚨 Critical Issues Found: ${criticalIssues}`);
  
  console.log('\n🔍 DETAILED FINDINGS:');
  console.log('=====================');
  
  TEST_RESULTS.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.test}`);
    console.log(`   Status: ${result.status} (${result.duration})`);
    
    if (result.issues && result.issues.length > 0) {
      console.log(`   🐛 Issues:`);
      result.issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      console.log(`   💡 Recommendations:`);
      result.recommendations.forEach(rec => console.log(`      - ${rec}`));
    }
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
  });
  
  // Save detailed report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      criticalIssues,
      overallStatus: criticalIssues === 0 ? 'ALL_TESTS_PASSED' : 'BUGS_FOUND'
    },
    tests: TEST_RESULTS,
    environment: {
      backendUrl: BACKEND_URL,
      nodeVersion: process.version,
      testRunner: 'MRVL Bug Hunter Specialist'
    }
  };
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `live-scoring-bug-hunt-report-${timestamp}.json`;
  
  try {
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    console.log(`\n📋 Detailed report saved: ${reportFile}`);
  } catch (error) {
    console.log(`\n❌ Could not save report file: ${error.message}`);
  }
  
  return reportData;
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting bug hunt tests...\n');
  
  // Run all bug tests
  await runTest('Admin Authentication', testAdminAuthentication);
  await runTest('API Route: /admin/matches/{id}/update-live-stats', testUpdateLiveStatsRoute);
  await runTest('Database Persistence of Live Updates', testDatabasePersistence);  
  await runTest('SSE Endpoint Availability', testSSEEndpoints);
  await runTest('Real-time Synchronization', testRealTimeSynchronization);
  
  // Generate comprehensive report
  const report = generateBugReport();
  
  console.log('\n✨ Bug hunt complete!');
  console.log('\n🎯 KEY FINDINGS FOR MARVEL RIVALS LIVE SCORING:');
  console.log('================================================');
  
  if (report.summary.criticalIssues === 0) {
    console.log('🎉 No critical bugs found! The live scoring system appears to be working correctly.');
  } else {
    console.log(`🐛 Found ${report.summary.criticalIssues} critical issues that need immediate attention:`);
    
    // Highlight the most important bugs
    const failedTests = TEST_RESULTS.filter(t => t.status === 'FAIL' || t.status === 'ERROR');
    failedTests.forEach(test => {
      console.log(`\n❌ ${test.test}:`);
      test.issues.forEach(issue => console.log(`   • ${issue}`));
    });
  }
  
  return report;
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAdminAuthentication,
  testUpdateLiveStatsRoute,
  testDatabasePersistence,
  testSSEEndpoints,
  testRealTimeSynchronization
};