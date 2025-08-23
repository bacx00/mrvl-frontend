#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for MRVL Tournament Platform
 * Tests Teams & Players API endpoints with proper authentication
 */

const https = require('https');
const http = require('http');
const querystring = require('querystring');

// Configuration
const BASE_URL = 'http://localhost:8000';
const API_BASE = BASE_URL + '/api';

// Test admin credentials - you may need to adjust these
const TEST_ADMIN = {
    email: 'admin@test.com', 
    password: 'password'
};

// HTTP client helper
function makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint.startsWith('http') ? endpoint : API_BASE + endpoint);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'MRVL-API-Test/1.0',
                ...headers
            }
        };

        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                let parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                } catch (e) {
                    parsedBody = body;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsedBody
                });
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

// Authentication helper
async function getAuthToken() {
    console.log('🔐 Authenticating as admin...');
    
    try {
        const response = await makeRequest('POST', '/auth/login', TEST_ADMIN);
        
        if (response.status === 200 && response.body.access_token) {
            console.log('✅ Authentication successful');
            return response.body.access_token;
        } else {
            console.log('❌ Authentication failed:', response.body);
            return null;
        }
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        return null;
    }
}

// Test result tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, details = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name} ${details}`);
    
    testResults.tests.push({ name, passed, details });
    if (passed) testResults.passed++;
    else testResults.failed++;
}

// Main testing function
async function runTests() {
    console.log('🚀 Starting MRVL Teams & Players API Testing...\n');
    
    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
        console.log('❌ Cannot proceed without authentication token');
        return;
    }
    
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    
    console.log('\n📋 Testing Admin API Endpoints...\n');
    
    // ========================================
    // 1. Test Teams API Endpoints
    // ========================================
    console.log('🏀 Testing Teams API...');
    
    // GET /api/admin/teams
    try {
        const response = await makeRequest('GET', '/admin/teams', null, authHeaders);
        const success = response.status === 200;
        logTest('GET /api/admin/teams', success, `Status: ${response.status}`);
        
        if (success && response.body.data) {
            console.log(`   Found ${response.body.data.length} teams`);
        }
    } catch (error) {
        logTest('GET /api/admin/teams', false, `Error: ${error.message}`);
    }
    
    // POST /api/admin/teams (Create Team)
    const testTeam = {
        name: 'Test Team API',
        short_name: 'TEST',
        region: 'NA',
        country: 'US',
        rating: 1500,
        earnings: 0,
        status: 'Active'
    };
    
    let createdTeamId = null;
    try {
        const response = await makeRequest('POST', '/admin/teams', testTeam, authHeaders);
        const success = response.status === 201 || response.status === 200;
        logTest('POST /api/admin/teams (Create)', success, `Status: ${response.status}`);
        
        if (success && response.body.data) {
            createdTeamId = response.body.data.id || response.body.id;
            console.log(`   Created team with ID: ${createdTeamId}`);
        } else if (response.body.message) {
            console.log(`   Response: ${response.body.message}`);
        }
    } catch (error) {
        logTest('POST /api/admin/teams (Create)', false, `Error: ${error.message}`);
    }
    
    // PUT /api/admin/teams/{id} (Update Team)
    if (createdTeamId) {
        const updateData = { ...testTeam, name: 'Updated Test Team API' };
        try {
            const response = await makeRequest('PUT', `/admin/teams/${createdTeamId}`, updateData, authHeaders);
            const success = response.status === 200;
            logTest('PUT /api/admin/teams/{id} (Update)', success, `Status: ${response.status}`);
        } catch (error) {
            logTest('PUT /api/admin/teams/{id} (Update)', false, `Error: ${error.message}`);
        }
        
        // GET /api/admin/teams/{id} (Show Team)
        try {
            const response = await makeRequest('GET', `/admin/teams/${createdTeamId}`, null, authHeaders);
            const success = response.status === 200;
            logTest('GET /api/admin/teams/{id} (Show)', success, `Status: ${response.status}`);
        } catch (error) {
            logTest('GET /api/admin/teams/{id} (Show)', false, `Error: ${error.message}`);
        }
    }
    
    // ========================================
    // 2. Test Players API Endpoints  
    // ========================================
    console.log('\n👤 Testing Players API...');
    
    // GET /api/admin/players
    try {
        const response = await makeRequest('GET', '/admin/players', null, authHeaders);
        const success = response.status === 200;
        logTest('GET /api/admin/players', success, `Status: ${response.status}`);
        
        if (success && response.body.data) {
            console.log(`   Found ${response.body.data.length} players`);
        }
    } catch (error) {
        logTest('GET /api/admin/players', false, `Error: ${error.message}`);
    }
    
    // POST /api/admin/players (Create Player)
    const testPlayer = {
        username: 'testplayer_api',
        real_name: 'Test Player API',
        team_id: createdTeamId, // Assign to our test team
        role: 'Duelist',
        region: 'NA',
        country: 'US',
        age: 25,
        rating: 1600,
        status: 'active'
    };
    
    let createdPlayerId = null;
    try {
        const response = await makeRequest('POST', '/admin/players', testPlayer, authHeaders);
        const success = response.status === 201 || response.status === 200;
        logTest('POST /api/admin/players (Create)', success, `Status: ${response.status}`);
        
        if (success && response.body.data) {
            createdPlayerId = response.body.data.id || response.body.id;
            console.log(`   Created player with ID: ${createdPlayerId}`);
        } else if (response.body.message) {
            console.log(`   Response: ${response.body.message}`);
        }
    } catch (error) {
        logTest('POST /api/admin/players (Create)', false, `Error: ${error.message}`);
    }
    
    // PUT /api/admin/players/{id} (Update Player)
    if (createdPlayerId) {
        const updateData = { ...testPlayer, real_name: 'Updated Test Player API' };
        try {
            const response = await makeRequest('PUT', `/admin/players/${createdPlayerId}`, updateData, authHeaders);
            const success = response.status === 200;
            logTest('PUT /api/admin/players/{id} (Update)', success, `Status: ${response.status}`);
        } catch (error) {
            logTest('PUT /api/admin/players/{id} (Update)', false, `Error: ${error.message}`);
        }
        
        // GET /api/admin/players/{id} (Show Player) 
        try {
            const response = await makeRequest('GET', `/admin/players/${createdPlayerId}`, null, authHeaders);
            const success = response.status === 200;
            logTest('GET /api/admin/players/{id} (Show)', success, `Status: ${response.status}`);
        } catch (error) {
            logTest('GET /api/admin/players/{id} (Show)', false, `Error: ${error.message}`);
        }
    }
    
    // ========================================
    // 3. Test Frontend API Endpoints (used by detail pages)
    // ========================================
    console.log('\n🌐 Testing Frontend Public APIs...');
    
    // GET /api/teams (public teams list)
    try {
        const response = await makeRequest('GET', '/teams', null, authHeaders);
        const success = response.status === 200;
        logTest('GET /api/teams (Public)', success, `Status: ${response.status}`);
    } catch (error) {
        logTest('GET /api/teams (Public)', false, `Error: ${error.message}`);
    }
    
    // GET /api/players (public players list)
    try {
        const response = await makeRequest('GET', '/players', null, authHeaders);
        const success = response.status === 200;
        logTest('GET /api/players (Public)', success, `Status: ${response.status}`);
    } catch (error) {
        logTest('GET /api/players (Public)', false, `Error: ${error.message}`);
    }
    
    // Test player detail endpoint
    if (createdPlayerId) {
        try {
            const response = await makeRequest('GET', `/public/player-profile/${createdPlayerId}`, null, authHeaders);
            const success = response.status === 200;
            logTest('GET /api/public/player-profile/{id}', success, `Status: ${response.status}`);
        } catch (error) {
            logTest('GET /api/public/player-profile/{id}', false, `Error: ${error.message}`);
        }
    }
    
    // ========================================
    // 4. Test Data Integrity & Relationships
    // ========================================
    console.log('\n🔗 Testing Data Relationships...');
    
    if (createdTeamId && createdPlayerId) {
        // Test if player is properly assigned to team
        try {
            const teamResponse = await makeRequest('GET', `/admin/teams/${createdTeamId}`, null, authHeaders);
            const playerResponse = await makeRequest('GET', `/admin/players/${createdPlayerId}`, null, authHeaders);
            
            const teamHasPlayer = teamResponse.body.data?.players?.some(p => p.id == createdPlayerId);
            const playerHasTeam = playerResponse.body.data?.team_id == createdTeamId;
            
            logTest('Player-Team Relationship', teamHasPlayer || playerHasTeam, 
                   `Team has player: ${!!teamHasPlayer}, Player has team: ${!!playerHasTeam}`);
        } catch (error) {
            logTest('Player-Team Relationship', false, `Error: ${error.message}`);
        }
    }
    
    // ========================================
    // 5. Cleanup Test Data
    // ========================================
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete test player
    if (createdPlayerId) {
        try {
            const response = await makeRequest('DELETE', `/admin/players/${createdPlayerId}`, null, authHeaders);
            const success = response.status === 200 || response.status === 204;
            logTest('DELETE /api/admin/players/{id}', success, `Status: ${response.status}`);
        } catch (error) {
            logTest('DELETE /api/admin/players/{id}', false, `Error: ${error.message}`);
        }
    }
    
    // Delete test team
    if (createdTeamId) {
        try {
            const response = await makeRequest('DELETE', `/admin/teams/${createdTeamId}`, null, authHeaders);
            const success = response.status === 200 || response.status === 204;
            logTest('DELETE /api/admin/teams/{id}', success, `Status: ${response.status}`);
        } catch (error) {
            logTest('DELETE /api/admin/teams/{id}', false, `Error: ${error.message}`);
        }
    }
    
    // ========================================
    // 6. Final Results
    // ========================================
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📋 Total: ${testResults.tests.length}`);
    console.log(`🎯 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
    }
    
    console.log('\n🏁 Testing Complete!');
}

// Run the tests
runTests().catch(console.error);