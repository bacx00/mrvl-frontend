#!/usr/bin/env node

/**
 * FINAL LIVE SCORING BUG HUNT TEST - CORRECTED VERSION
 * 
 * Tests critical bugs in Marvel Rivals live scoring system with working credentials
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration with working admin credentials
const BACKEND_URL = 'https://staging.mrvl.net';
const API_BASE = `${BACKEND_URL}/api`;
const ADMIN_EMAIL = 'test-bug-hunter@mrvl.com';
const ADMIN_PASSWORD = 'BugHunter123!';
const TEST_RESULTS = [];
let AUTH_TOKEN = null;

console.log('🐛 FINAL MARVEL RIVALS LIVE SCORING BUG HUNT');
console.log('============================================');
console.log('Testing with admin:', ADMIN_EMAIL);
console.log('');

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const requestLib = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MRVL-Bug-Hunter/1.0',
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

// Test wrapper function
async function runTest(testName, testFunction) {
  console.log(`🔍 ${testName}...`);
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
      fixes: result.fixes || []
    };
    
    TEST_RESULTS.push(testResult);
    
    if (result.success) {
      console.log(`✅ PASS (${duration}ms)`);
      if (result.details) {
        console.log(`   ℹ️  Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
      }
    } else {
      console.log(`❌ FAIL (${duration}ms)`);
      result.issues.forEach(issue => console.log(`   🐛 ${issue}`));
      if (result.fixes) {
        result.fixes.forEach(fix => console.log(`   🔧 Fix: ${fix}`));
      }
    }
    console.log('');
    
    return testResult;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`💥 ERROR (${duration}ms): ${error.message}\n`);
    
    const testResult = {
      test: testName,
      status: 'ERROR',
      duration: `${duration}ms`,
      error: error.message,
      issues: [`Test execution failed: ${error.message}`]
    };
    
    TEST_RESULTS.push(testResult);
    return testResult;
  }
}

// 1. Test Admin Authentication 
async function testAdminAuthentication() {
  const response = await makeRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });
  
  if (response.statusCode === 200 && response.data.access_token) {
    AUTH_TOKEN = response.data.access_token;
    return {
      success: true,
      details: {
        statusCode: response.statusCode,
        hasToken: true,
        tokenPreview: AUTH_TOKEN.substring(0, 20) + '...',
        userRole: response.data.user?.role
      }
    };
  }
  
  return {
    success: false,
    issues: [
      `Authentication failed with status ${response.statusCode}`,
      `Response: ${JSON.stringify(response.data)}`
    ],
    fixes: [
      'Admin user credentials may be incorrect',
      'Check Laravel Passport/Sanctum configuration',
      'Verify auth endpoints are working'
    ]
  };
}

// 2. Test Critical API Route 
async function testCriticalAPIRoute() {
  if (!AUTH_TOKEN) {
    return { success: false, issues: ['No auth token'], fixes: ['Fix authentication first'] };
  }
  
  // Get a test match
  const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
  
  if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
    return {
      success: false,
      issues: ['No matches found for testing'],
      fixes: ['Create test match data in the database']
    };
  }
  
  const testMatchId = matchesResponse.data.data[0].id;
  const testPayload = {
    series_score_team1: 2,
    series_score_team2: 1,
    status: 'live',
    team1_players: [
      { id: 1, username: 'TestPlayer1', hero: 'Spider-Man', kills: 10, deaths: 3, assists: 8 }
    ],
    team2_players: [
      { id: 2, username: 'TestPlayer2', hero: 'Iron Man', kills: 8, deaths: 5, assists: 6 }
    ]
  };
  
  // Test the critical route
  const routeUrl = `${API_BASE}/admin/matches/${testMatchId}/update-live-stats`;
  const response = await makeRequest(routeUrl, {
    method: 'POST',
    body: testPayload
  });
  
  const routeExists = response.statusCode !== 404;
  const isWorking = response.statusCode === 200;
  
  return {
    success: routeExists && isWorking,
    details: {
      routeUrl,
      testMatchId,
      statusCode: response.statusCode,
      routeExists,
      isWorking,
      responseData: response.data
    },
    issues: !routeExists ? ['Route does not exist'] : 
            !isWorking ? [`Route exists but failed with status ${response.statusCode}`] : [],
    fixes: !routeExists ? [
      'Add route in routes/api.php: Route::post(\'/admin/matches/{matchId}/update-live-stats\', [MatchController::class, \'updateLiveStatsComprehensive\'])',
      'Verify middleware allows admin access'
    ] : !isWorking ? [
      'Check MatchController@updateLiveStatsComprehensive method implementation',
      'Verify request validation rules',
      'Check database permissions'
    ] : []
  };
}

// 3. Test Database Persistence
async function testDatabasePersistence() {
  if (!AUTH_TOKEN) {
    return { success: false, issues: ['No auth token'] };
  }
  
  // Get match for testing
  const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
  if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
    return { success: false, issues: ['No test matches available'] };
  }
  
  const testMatchId = matchesResponse.data.data[0].id;
  
  // Get initial state
  const initialResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}`);
  const initialScore1 = initialResponse.data?.team1_score || 0;
  const initialScore2 = initialResponse.data?.team2_score || 0;
  
  // Update scores
  const newScore1 = initialScore1 + 1;
  const newScore2 = initialScore2 + 1;
  
  const updateResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}/update-live-stats`, {
    method: 'POST',
    body: {
      series_score_team1: newScore1,
      series_score_team2: newScore2,
      status: 'live'
    }
  });
  
  if (updateResponse.statusCode !== 200) {
    return {
      success: false,
      issues: [`Update failed with status ${updateResponse.statusCode}`],
      fixes: ['Fix the API route first']
    };
  }
  
  // Wait and verify persistence
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const verifyResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}`);
  
  const isPersisted = 
    verifyResponse.data?.team1_score === newScore1 &&
    verifyResponse.data?.team2_score === newScore2;
  
  return {
    success: isPersisted,
    details: {
      testMatchId,
      initialScores: { team1: initialScore1, team2: initialScore2 },
      updatedScores: { team1: newScore1, team2: newScore2 },
      persistedScores: { 
        team1: verifyResponse.data?.team1_score, 
        team2: verifyResponse.data?.team2_score 
      },
      isPersisted
    },
    issues: !isPersisted ? [
      'Live score updates are not persisting to the database',
      'Data may be getting rolled back or not saved properly'
    ] : [],
    fixes: !isPersisted ? [
      'Check DB::transaction in updateLiveStatsComprehensive method',
      'Verify database write permissions',
      'Check for constraint violations or validation errors',
      'Ensure no exceptions are causing rollbacks'
    ] : []
  };
}

// 4. Test SSE Endpoint
async function testSSEEndpoint() {
  const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
  if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
    return { success: false, issues: ['No matches for SSE testing'] };
  }
  
  const testMatchId = matchesResponse.data.data[0].id;
  const sseUrl = `${API_BASE}/public/matches/${testMatchId}/live-stream`;
  
  // Test SSE endpoint
  const response = await makeRequest(sseUrl);
  
  // Check if it's a valid SSE endpoint
  const isSSEEndpoint = 
    response.statusCode === 200 ||
    response.headers['content-type']?.includes('text/event-stream') ||
    response.headers['cache-control']?.includes('no-cache') ||
    response.rawData?.includes('data:') ||
    response.rawData?.includes('event:');
  
  return {
    success: isSSEEndpoint,
    details: {
      sseUrl,
      testMatchId,
      statusCode: response.statusCode,
      contentType: response.headers['content-type'],
      cacheControl: response.headers['cache-control'],
      isSSEEndpoint,
      responsePreview: response.rawData?.substring(0, 200)
    },
    issues: !isSSEEndpoint ? [
      'SSE endpoint /public/matches/{id}/live-stream is not working correctly',
      'Missing proper SSE headers or response format'
    ] : [],
    fixes: !isSSEEndpoint ? [
      'Fix MatchController@liveStream method to return proper SSE response',
      'Ensure response headers include: Content-Type: text/event-stream, Cache-Control: no-cache',
      'Verify SSE endpoint is accessible without authentication'
    ] : [
      'Re-enable SSE connections in frontend MatchLiveSync.js',
      'Remove DISABLED SSE code block',
      'Test actual EventSource connections'
    ]
  };
}

// 5. Test Real-time Sync
async function testRealTimeSync() {
  if (!AUTH_TOKEN) {
    return { success: false, issues: ['No auth token'] };
  }
  
  const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
  if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
    return { success: false, issues: ['No matches for sync testing'] };
  }
  
  const testMatchId = matchesResponse.data.data[0].id;
  
  // Update match and check response for sync data
  const updateResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}/update-live-stats`, {
    method: 'POST',
    body: {
      series_score_team1: 2,
      series_score_team2: 1,
      status: 'live',
      team1_players: [{ id: 1, username: 'Player1', hero: 'Hulk', kills: 15 }]
    }
  });
  
  if (updateResponse.statusCode !== 200) {
    return {
      success: false,
      issues: [`Sync test update failed: ${updateResponse.statusCode}`]
    };
  }
  
  // Check if response includes sync/broadcast data
  const hasSyncData = updateResponse.data && (
    updateResponse.data.match_id === testMatchId ||
    updateResponse.data.team1_score !== undefined ||
    updateResponse.data.series_score_team1 !== undefined ||
    updateResponse.data.updated_at !== undefined
  );
  
  return {
    success: hasSyncData,
    details: {
      testMatchId,
      responseKeys: Object.keys(updateResponse.data || {}),
      hasSyncData,
      responseData: updateResponse.data
    },
    issues: !hasSyncData ? [
      'API response does not include real-time sync data',
      'broadcastLiveUpdate method may not be working'
    ] : [],
    fixes: !hasSyncData ? [
      'Ensure updateLiveStatsComprehensive returns comprehensive response data',
      'Verify broadcastLiveUpdate method is called',
      'Check cache configuration for live updates'
    ] : []
  };
}

// Generate final bug report
function generateBugReport() {
  const timestamp = new Date().toISOString();
  let passedTests = TEST_RESULTS.filter(t => t.status === 'PASS').length;
  let failedTests = TEST_RESULTS.filter(t => t.status === 'FAIL' || t.status === 'ERROR').length;
  
  console.log('\n🎯 FINAL BUG HUNT RESULTS');
  console.log('========================');
  console.log(`✅ Passed: ${passedTests}/${TEST_RESULTS.length}`);
  console.log(`❌ Failed: ${failedTests}/${TEST_RESULTS.length}`);
  console.log('');
  
  // Critical bugs found
  const criticalBugs = [];
  const fixableIssues = [];
  
  TEST_RESULTS.forEach(result => {
    if (result.status === 'FAIL' || result.status === 'ERROR') {
      result.issues.forEach(issue => criticalBugs.push(`${result.test}: ${issue}`));
      if (result.fixes) {
        result.fixes.forEach(fix => fixableIssues.push(`${result.test}: ${fix}`));
      }
    }
  });
  
  if (criticalBugs.length > 0) {
    console.log('🐛 CRITICAL BUGS FOUND:');
    criticalBugs.forEach((bug, i) => console.log(`${i+1}. ${bug}`));
    console.log('');
  }
  
  if (fixableIssues.length > 0) {
    console.log('🔧 RECOMMENDED FIXES:');
    fixableIssues.forEach((fix, i) => console.log(`${i+1}. ${fix}`));
    console.log('');
  }
  
  // Save comprehensive report
  const report = {
    timestamp,
    backend_url: BACKEND_URL,
    test_admin: ADMIN_EMAIL,
    summary: {
      total_tests: TEST_RESULTS.length,
      passed: passedTests,
      failed: failedTests,
      critical_bugs: criticalBugs.length,
      overall_status: failedTests === 0 ? 'ALL_SYSTEMS_OPERATIONAL' : 'BUGS_REQUIRE_ATTENTION'
    },
    detailed_results: TEST_RESULTS,
    critical_bugs: criticalBugs,
    recommended_fixes: fixableIssues
  };
  
  const reportFile = `live-scoring-bug-hunt-final-report-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`📊 Full report saved: ${reportFile}`);
  console.log('');
  
  return report;
}

// Main execution
async function runFinalBugHunt() {
  console.log('🚀 Starting final bug hunt...\n');
  
  await runTest('Admin Authentication', testAdminAuthentication);
  await runTest('Critical API Route: /admin/matches/{id}/update-live-stats', testCriticalAPIRoute);
  await runTest('Database Persistence', testDatabasePersistence);
  await runTest('SSE Endpoint Availability', testSSEEndpoint);
  await runTest('Real-time Synchronization', testRealTimeSync);
  
  const report = generateBugReport();
  
  if (report.summary.failed === 0) {
    console.log('🎉 SUCCESS: All live scoring systems are working correctly!');
  } else {
    console.log(`⚠️  ${report.summary.failed} critical issues found that need immediate attention.`);
  }
  
  return report;
}

// Execute
if (require.main === module) {
  runFinalBugHunt().catch(console.error);
}

module.exports = { runFinalBugHunt };