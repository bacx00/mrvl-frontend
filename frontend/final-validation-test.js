#!/usr/bin/env node

/**
 * FINAL MATCH COMMENT SYSTEM VALIDATION
 * 
 * Tests the actual HTTP endpoints to ensure the 500 error is fixed
 */

const https = require('https');

function makeRequest(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'MRVL-Test-Client',
        ...headers
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testMatchComments() {
  console.log('🔍 FINAL VALIDATION: Match Comment System');
  console.log('=========================================\n');

  try {
    // Test 1: GET comments (should work)
    console.log('1️⃣  Testing GET /api/matches/6/comments...');
    const getResponse = await makeRequest('GET', 'https://staging.mrvl.net/api/matches/6/comments');
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Body: ${getResponse.body.substring(0, 100)}...`);
    
    if (getResponse.status === 200) {
      console.log('   ✅ GET endpoint works correctly!\n');
    } else {
      console.log('   ❌ GET endpoint failed!\n');
    }

    // Test 2: OPTIONS preflight for POST (CORS check)
    console.log('2️⃣  Testing OPTIONS /api/matches/6/comments...');
    const optionsResponse = await makeRequest('OPTIONS', 'https://staging.mrvl.net/api/matches/6/comments', {
      'Origin': 'https://staging.mrvl.net',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type,Authorization'
    });
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers: ${JSON.stringify(optionsResponse.headers['access-control-allow-methods'] || 'none')}`);
    
    if (optionsResponse.status === 200 || optionsResponse.status === 204) {
      console.log('   ✅ CORS preflight works correctly!\n');
    } else {
      console.log('   ⚠️  CORS preflight may have issues, but this is common\n');
    }

    // Test 3: POST without auth (should return 401, not 405/500)
    console.log('3️⃣  Testing POST /api/matches/6/comments (no auth)...');
    const postResponse = await makeRequest('POST', 'https://staging.mrvl.net/api/matches/6/comments', {}, {
      content: 'Test comment'
    });
    console.log(`   Status: ${postResponse.status}`);
    console.log(`   Body: ${postResponse.body.substring(0, 200)}...`);
    
    if (postResponse.status === 401) {
      console.log('   ✅ POST endpoint exists and correctly returns 401 (Unauthorized)!');
      console.log('   ✅ The 500 error "POST method not supported" is FIXED!\n');
    } else if (postResponse.status === 405) {
      console.log('   ❌ POST endpoint still returns 405 (Method Not Allowed)');
      console.log('   ❌ The route may not be properly configured\n');
    } else if (postResponse.status === 500) {
      console.log('   ❌ POST endpoint still returns 500 (Internal Server Error)');
      console.log('   ❌ There may be other issues\n');
    } else {
      console.log(`   ⚠️  Unexpected status code: ${postResponse.status}\n`);
    }

  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
  }

  console.log('📋 VALIDATION SUMMARY');
  console.log('===================');
  console.log('The key fix was adding this line to routes/api.php:');
  console.log('Route::middleware(\'auth:api\')->post(\'/matches/{match}/comments\', [MatchController::class, \'storeComment\']);');
  console.log('');
  console.log('This should resolve the 500 error:');
  console.log('"The POST method is not supported for route api/matches/6/comments"');
  console.log('');
  console.log('Now the endpoint should return 401 (Unauthorized) instead of 500 for unauthenticated requests.');
}

testMatchComments();