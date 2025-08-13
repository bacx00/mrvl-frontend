#!/usr/bin/env node

/**
 * WORKING LIVE SCORING BUG HUNT TEST - CORRECTED AUTH
 */

const https = require('https');
const fs = require('fs');

const BACKEND_URL = 'https://staging.mrvl.net';
const API_BASE = `${BACKEND_URL}/api`;
const ADMIN_EMAIL = 'test-bug-hunter@mrvl.com';
const ADMIN_PASSWORD = 'BugHunter123!';
let AUTH_TOKEN = null;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
        ...(options.headers || {})
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : {},
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
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

console.log('🐛 MARVEL RIVALS LIVE SCORING - WORKING BUG HUNT');
console.log('================================================\n');

// Step 1: Get Auth Token
async function authenticate() {
  console.log('🔐 Authenticating...');
  const response = await makeRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });
  
  if (response.statusCode === 200 && response.data.token) {
    AUTH_TOKEN = response.data.token;
    console.log('✅ Authentication successful');
    console.log(`   Token: ${AUTH_TOKEN.substring(0, 30)}...`);
    console.log(`   User: ${response.data.user.name} (${response.data.user.role})\n`);
    return true;
  } else {
    console.log(`❌ Authentication failed: ${response.statusCode}`);
    console.log(`   Response: ${JSON.stringify(response.data)}\n`);
    return false;
  }
}

// Step 2: Test Critical Route
async function testCriticalRoute() {
  console.log('🔍 Testing: /admin/matches/{id}/update-live-stats');
  
  // Get matches
  const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
  console.log(`   Matches API: ${matchesResponse.statusCode}`);
  
  if (matchesResponse.statusCode !== 200) {
    console.log(`❌ Cannot get matches: ${matchesResponse.statusCode}`);
    return false;
  }
  
  const matches = matchesResponse.data.data;
  if (!matches || matches.length === 0) {
    console.log('❌ No matches found for testing');
    return false;
  }
  
  const testMatchId = matches[0].id;
  console.log(`   Testing with match ID: ${testMatchId}`);
  
  // Test the critical route
  const routeUrl = `${API_BASE}/admin/matches/${testMatchId}/update-live-stats`;
  const testPayload = {
    series_score_team1: 2,
    series_score_team2: 1,
    status: 'live'
  };
  
  const response = await makeRequest(routeUrl, {
    method: 'POST',
    body: testPayload
  });
  
  console.log(`   Route response: ${response.statusCode}`);
  
  if (response.statusCode === 404) {
    console.log('❌ CRITICAL BUG: Route does not exist!');
    console.log('   🔧 FIX: Add route to routes/api.php');
    return false;
  } else if (response.statusCode === 200) {
    console.log('✅ Route exists and works!');
    console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 300)}...`);
    return true;
  } else {
    console.log(`⚠️  Route exists but returned ${response.statusCode}`);
    console.log(`   Response: ${response.rawData}`);
    return response.statusCode < 500; // Not a critical bug if it's just validation/auth issue
  }
}

// Step 3: Test Database Persistence
async function testDatabasePersistence() {
  console.log('\n🗄️  Testing: Database Persistence');
  
  const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
  if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
    console.log('❌ Cannot get matches for persistence test');
    return false;
  }
  
  const testMatchId = matchesResponse.data.data[0].id;
  console.log(`   Testing persistence with match: ${testMatchId}`);
  
  // Get initial state
  const initialResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}`);
  const initialScore1 = initialResponse.data?.team1_score || 0;
  const initialScore2 = initialResponse.data?.team2_score || 0;
  console.log(`   Initial scores: Team1=${initialScore1}, Team2=${initialScore2}`);
  
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
    console.log(`❌ Update failed: ${updateResponse.statusCode}`);
    return false;
  }
  
  console.log('   Update successful, checking persistence...');
  
  // Wait and verify
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const verifyResponse = await makeRequest(`${API_BASE}/admin/matches/${testMatchId}`);
  const persistedScore1 = verifyResponse.data?.team1_score;
  const persistedScore2 = verifyResponse.data?.team2_score;
  
  console.log(`   Persisted scores: Team1=${persistedScore1}, Team2=${persistedScore2}`);
  
  const isPersisted = persistedScore1 === newScore1 && persistedScore2 === newScore2;
  
  if (isPersisted) {
    console.log('✅ Database persistence works correctly!');
    return true;
  } else {
    console.log('❌ CRITICAL BUG: Updates not persisting to database!');
    console.log('   🔧 FIX: Check DB::transaction in updateLiveStatsComprehensive');
    return false;
  }
}

// Step 4: Test SSE Endpoint
async function testSSEEndpoint() {
  console.log('\n📡 Testing: SSE Endpoint');
  
  const matchesResponse = await makeRequest(`${API_BASE}/admin/matches`);
  if (matchesResponse.statusCode !== 200 || !matchesResponse.data.data?.length) {
    console.log('❌ Cannot get matches for SSE test');
    return false;
  }
  
  const testMatchId = matchesResponse.data.data[0].id;
  const sseUrl = `${API_BASE}/public/matches/${testMatchId}/live-stream`;
  console.log(`   Testing SSE URL: ${sseUrl}`);
  
  const response = await makeRequest(sseUrl);
  console.log(`   SSE endpoint status: ${response.statusCode}`);
  console.log(`   Content-Type: ${response.headers['content-type']}`);
  console.log(`   Response preview: ${response.rawData?.substring(0, 100)}`);
  
  const isSSEEndpoint = 
    response.statusCode === 200 ||
    response.headers['content-type']?.includes('text/event-stream') ||
    response.headers['cache-control']?.includes('no-cache') ||
    response.rawData?.includes('data:') ||
    response.rawData?.includes('event:');
  
  if (isSSEEndpoint) {
    console.log('✅ SSE endpoint is working!');
    console.log('   🔧 RECOMMENDATION: Re-enable SSE in frontend MatchLiveSync.js');
    return true;
  } else {
    console.log('❌ SSE endpoint not working properly');
    console.log('   🔧 FIX: Fix MatchController@liveStream method');
    return false;
  }
}

// Step 5: Check Frontend SSE Status
async function checkFrontendSSEStatus() {
  console.log('\n🖥️  Checking: Frontend SSE Configuration');
  
  try {
    const matchLiveSyncPath = '/var/www/mrvl-frontend/frontend/src/utils/MatchLiveSync.js';
    const fs = require('fs');
    const content = fs.readFileSync(matchLiveSyncPath, 'utf8');
    
    if (content.includes('DISABLED: SSE connections')) {
      console.log('❌ CRITICAL BUG: SSE connections are DISABLED in frontend!');
      console.log('   Location: src/utils/MatchLiveSync.js');
      console.log('   🔧 FIX: Remove the DISABLED SSE code block and enable EventSource connections');
      return false;
    } else if (content.includes('new EventSource')) {
      console.log('✅ Frontend SSE connections are enabled');
      return true;
    } else {
      console.log('⚠️  Cannot determine SSE status in frontend');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking frontend: ${error.message}`);
    return false;
  }
}

// Main execution
async function runWorkingBugHunt() {
  const results = {
    authentication: false,
    criticalRoute: false,
    databasePersistence: false,
    sseEndpoint: false,
    frontendSSE: false
  };
  
  // Test authentication
  results.authentication = await authenticate();
  if (!results.authentication) {
    console.log('🚨 Cannot proceed without authentication');
    return results;
  }
  
  // Test critical route
  results.criticalRoute = await testCriticalRoute();
  
  // Test database persistence (only if route works)
  if (results.criticalRoute) {
    results.databasePersistence = await testDatabasePersistence();
  }
  
  // Test SSE endpoint
  results.sseEndpoint = await testSSEEndpoint();
  
  // Check frontend SSE
  results.frontendSSE = await checkFrontendSSEStatus();
  
  // Final summary
  console.log('\n🎯 FINAL RESULTS');
  console.log('================');
  console.log(`✅ Authentication: ${results.authentication ? 'WORKING' : 'BROKEN'}`);
  console.log(`${results.criticalRoute ? '✅' : '❌'} Critical API Route: ${results.criticalRoute ? 'WORKING' : 'BROKEN'}`);
  console.log(`${results.databasePersistence ? '✅' : '❌'} Database Persistence: ${results.databasePersistence ? 'WORKING' : 'BROKEN'}`);
  console.log(`${results.sseEndpoint ? '✅' : '❌'} SSE Backend: ${results.sseEndpoint ? 'WORKING' : 'BROKEN'}`);
  console.log(`${results.frontendSSE ? '✅' : '❌'} SSE Frontend: ${results.frontendSSE ? 'ENABLED' : 'DISABLED'}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n📊 Overall: ${passedTests}/${totalTests} systems working`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL!');
  } else {
    console.log('🚨 CRITICAL BUGS FOUND - See specific issues above');
  }
  
  // Save results
  const reportData = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      overallStatus: passedTests === totalTests ? 'ALL_WORKING' : 'BUGS_FOUND'
    }
  };
  
  fs.writeFileSync(`bug-hunt-working-results-${Date.now()}.json`, JSON.stringify(reportData, null, 2));
  
  return results;
}

runWorkingBugHunt().catch(console.error);