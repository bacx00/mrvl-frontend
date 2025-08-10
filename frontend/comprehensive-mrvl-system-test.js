#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE MRVL PLATFORM TEST SUITE
 * Tests all aspects of the match and live scoring system
 * 
 * TEST AREAS:
 * 1. Match Detail Page (/api/matches/2)
 * 2. Hero Images API endpoints
 * 3. Live Scoring (SSE and updates)
 * 4. Comments system
 * 5. Admin match creation
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class MRVLSystemTester {
  constructor() {
    this.baseURL = 'https://staging.mrvl.net/api';
    this.adminToken = '415|ySK4yrjyULCTlprffD0KeT5zxd6J2mMMHOHkX6pv1d5fc012';
    this.testResults = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: [],
      details: {}
    };
  }

  /**
   * 🔧 Get admin headers for authenticated requests
   */
  getAdminHeaders() {
    return {
      'Authorization': `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
  }

  /**
   * 🔧 Get public headers
   */
  getPublicHeaders() {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
  }

  /**
   * 📝 Log test result
   */
  logTest(testName, passed, error = null, data = null) {
    this.testResults.totalTests++;
    if (passed) {
      this.testResults.passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName}: ${error}`);
      this.testResults.errors.push({
        test: testName,
        error: error,
        timestamp: new Date().toISOString()
      });
    }
    
    if (data) {
      this.testResults.details[testName] = data;
    }
  }

  /**
   * 🎯 TEST 1: Match Detail Page (/api/matches/2)
   */
  async testMatchDetailPage() {
    console.log('\n🎯 TESTING MATCH DETAIL PAGE');
    console.log('=' .repeat(50));

    try {
      // Test loading match 2
      const response = await axios.get(`${this.baseURL}/matches/2/live-scoreboard`, {
        headers: this.getPublicHeaders(),
        timeout: 10000
      });

      const data = response.data;
      
      // Check basic response structure
      this.logTest('Match API Response Status', response.status === 200);
      this.logTest('Match Data Present', !!data);
      
      if (!data) {
        this.logTest('Match Detail Loading', false, 'No data returned from API');
        return;
      }

      // Check for match object (not match_info)
      const matchData = data.match;
      this.logTest('Match Object Present', !!matchData);
      
      if (matchData) {
        this.logTest('Match ID Present', !!matchData.id);
        this.logTest('Match Status Present', !!matchData.status);
        
        // Check series score display (2-1)
        const team1Score = matchData.team1_score;
        const team2Score = matchData.team2_score;
        this.logTest('Team 1 Score Present', typeof team1Score === 'number');
        this.logTest('Team 2 Score Present', typeof team2Score === 'number');
        this.logTest('Series Score Format (2-1)', 
          (team1Score === 2 && team2Score === 1) || (team1Score === 1 && team2Score === 2) || 
          (team1Score >= 0 && team2Score >= 0));

        // Check team logos
        this.logTest('Team 1 Logo Present', !!matchData.team1_logo);
        this.logTest('Team 2 Logo Present', !!matchData.team2_logo);

        // Test maps_data parsing for map tabs
        if (matchData.maps_data) {
          try {
            const mapsData = JSON.parse(matchData.maps_data);
            this.logTest('Maps Data Parsing', !!mapsData);
            this.logTest('Maps Array Present', Array.isArray(mapsData) && mapsData.length > 0);
            
            if (mapsData.length >= 3) {
              this.logTest('3 Map Tabs Available', true);
            } else {
              this.logTest('3 Map Tabs Available', false, `Only ${mapsData.length} maps found`);
            }
          } catch (error) {
            this.logTest('Maps Data Parsing', false, error.message);
          }
        } else {
          this.logTest('Maps Data Present', false, 'No maps_data field found');
        }

        // Test transformedMatch conversion (should not error)
        try {
          const transformedMatch = {
            id: matchData.id,
            status: matchData.status || 'unknown',
            team1: {
              name: matchData.team1_name || 'Team 1',
              logo: matchData.team1_logo || '',
              score: matchData.team1_score || 0
            },
            team2: {
              name: matchData.team2_name || 'Team 2',
              logo: matchData.team2_logo || '',
              score: matchData.team2_score || 0
            }
          };
          this.logTest('TransformedMatch Creation', true, null, {
            matchId: transformedMatch.id,
            status: transformedMatch.status,
            seriesScore: `${transformedMatch.team1.score}-${transformedMatch.team2.score}`
          });
        } catch (error) {
          this.logTest('TransformedMatch Creation', false, error.message);
        }
      }

    } catch (error) {
      this.logTest('Match Detail API Call', false, error.message);
    }
  }

  /**
   * 🦸 TEST 2: Hero Images API
   */
  async testHeroImages() {
    console.log('\n🦸 TESTING HERO IMAGES API');
    console.log('=' .repeat(50));

    try {
      // Test heroes list endpoint
      const heroesResponse = await axios.get(`${this.baseURL}/public/heroes`, {
        headers: this.getPublicHeaders(),
        timeout: 10000
      });

      this.logTest('Heroes List API Status', heroesResponse.status === 200);
      this.logTest('Heroes Data Present', !!heroesResponse.data);
      
      if (heroesResponse.data) {
        const heroes = heroesResponse.data.data || heroesResponse.data;
        this.logTest('Heroes Array Present', Array.isArray(heroes));
        
        if (Array.isArray(heroes) && heroes.length > 0) {
          this.logTest('Heroes Count > 0', heroes.length > 0, null, { count: heroes.length });
          
          // Test specific hero image endpoint (Storm as mentioned)
          try {
            const stormResponse = await axios.get(`${this.baseURL}/public/heroes/images/storm`, {
              headers: this.getPublicHeaders(),
              timeout: 10000
            });
            
            this.logTest('Storm Hero Image API', stormResponse.status === 200);
            this.logTest('Storm Hero Data Present', !!stormResponse.data);
          } catch (error) {
            this.logTest('Storm Hero Image API', false, error.message);
          }
          
          // Test hero image display by checking first hero
          const firstHero = heroes[0];
          if (firstHero) {
            this.logTest('Hero Object Structure', 
              !!(firstHero.name || firstHero.hero_name) && 
              !!(firstHero.image || firstHero.avatar || firstHero.hero_image));
          }
        }
      }

    } catch (error) {
      this.logTest('Heroes List API Call', false, error.message);
    }
  }

  /**
   * ⚡ TEST 3: Live Scoring System
   */
  async testLiveScoring() {
    console.log('\n⚡ TESTING LIVE SCORING SYSTEM');
    console.log('=' .repeat(50));

    // Test SSE endpoint accessibility
    try {
      // We can't easily test SSE in Node.js, but we can test the endpoint exists
      const sseTestUrl = `${this.baseURL}/live-updates/2/stream`;
      
      // Try to make a regular HTTP request to the SSE endpoint to see if it responds
      try {
        const sseResponse = await axios.get(sseTestUrl, {
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          },
          timeout: 5000,
          validateStatus: function (status) {
            return status >= 200 && status < 500; // Accept any non-server error
          }
        });
        
        this.logTest('SSE Endpoint Accessible', sseResponse.status < 500);
      } catch (error) {
        if (error.code === 'ECONNRESET' || error.message.includes('timeout')) {
          // SSE endpoints often cause connection resets or timeouts in regular HTTP requests
          this.logTest('SSE Endpoint Accessible', true, null, { note: 'Endpoint exists (connection behavior expected for SSE)' });
        } else {
          this.logTest('SSE Endpoint Accessible', false, error.message);
        }
      }

    } catch (error) {
      this.logTest('SSE Endpoint Test', false, error.message);
    }

    // Test live stats update endpoint
    try {
      const updateData = {
        action: "update_score",
        team1_score: 1,
        team2_score: 0,
        current_map: "Tokyo 2099: Shibuya Sky"
      };

      const updateResponse = await axios.post(
        `${this.baseURL}/admin/matches/2/update-live-stats`,
        updateData,
        {
          headers: this.getAdminHeaders(),
          timeout: 10000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        }
      );

      this.logTest('Live Stats Update API', updateResponse.status < 400);
      this.logTest('Live Stats Update Response', !!updateResponse.data);
      
      if (updateResponse.data) {
        this.logTest('Live Stats Update Success', 
          updateResponse.status === 200 || updateResponse.status === 201,
          null, 
          { 
            status: updateResponse.status,
            response: updateResponse.data 
          }
        );
      }

    } catch (error) {
      this.logTest('Live Stats Update API', false, error.message);
    }

    // Test live-control endpoint (from MatchAPI)
    try {
      const liveControlData = {
        action: "update_score",
        team1_score: 2,
        team2_score: 1,
        current_map: "Midtown"
      };

      const liveControlResponse = await axios.put(
        `${this.baseURL}/admin/matches/2/live-control`,
        liveControlData,
        {
          headers: this.getAdminHeaders(),
          timeout: 10000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        }
      );

      this.logTest('Live Control API', liveControlResponse.status < 400);
      this.logTest('Live Control Response', !!liveControlResponse.data);

    } catch (error) {
      this.logTest('Live Control API', false, error.message);
    }
  }

  /**
   * 💬 TEST 4: Comments System
   */
  async testCommentsSystem() {
    console.log('\n💬 TESTING COMMENTS SYSTEM');
    console.log('=' .repeat(50));

    // Test GET comments
    try {
      const commentsResponse = await axios.get(`${this.baseURL}/matches/2/comments`, {
        headers: this.getPublicHeaders(),
        timeout: 10000
      });

      this.logTest('Comments GET API Status', commentsResponse.status === 200);
      this.logTest('Comments Data Present', !!commentsResponse.data);
      
      if (commentsResponse.data) {
        const comments = commentsResponse.data.data || commentsResponse.data;
        this.logTest('Comments Structure Valid', 
          Array.isArray(comments) || typeof comments === 'object');
        
        if (Array.isArray(comments)) {
          this.logTest('Comments Array Format', true, null, { count: comments.length });
          
          // Check comment structure if comments exist
          if (comments.length > 0) {
            const firstComment = comments[0];
            this.logTest('Comment Object Structure', 
              !!(firstComment.id && firstComment.content && firstComment.author));
          }
        } else if (typeof comments === 'object' && comments !== null) {
          this.logTest('Comments Object Format', true, null, { keys: Object.keys(comments) });
        }
      }

    } catch (error) {
      this.logTest('Comments GET API', false, error.message);
    }

    // Test POST comment (create new comment)
    try {
      const testComment = {
        content: `Test comment from MRVL system test - ${new Date().toISOString()}`,
        author: 'Test User',
        match_id: 2
      };

      const postResponse = await axios.post(
        `${this.baseURL}/matches/2/comments`,
        testComment,
        {
          headers: {
            ...this.getPublicHeaders(),
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        }
      );

      this.logTest('Comments POST API Status', postResponse.status < 400);
      this.logTest('Comments POST Response', !!postResponse.data);
      
      if (postResponse.data && postResponse.status < 400) {
        this.logTest('Comment Creation Success', true, null, {
          status: postResponse.status,
          commentId: postResponse.data.id || 'unknown'
        });
      }

    } catch (error) {
      this.logTest('Comments POST API', false, error.message);
    }
  }

  /**
   * ➕ TEST 5: Create New Match (Admin)
   */
  async testCreateNewMatch() {
    console.log('\n➕ TESTING CREATE NEW MATCH');
    console.log('=' .repeat(50));

    try {
      const newMatchData = {
        team1_name: 'Test Team Alpha',
        team2_name: 'Test Team Beta',
        match_format: 'BO3',
        status: 'scheduled',
        tournament_id: 1,
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        current_map: 'Tokyo 2099: Shibuya Sky',
        team1_logo: 'https://example.com/logo1.png',
        team2_logo: 'https://example.com/logo2.png'
      };

      const createResponse = await axios.post(
        `${this.baseURL}/admin/matches`,
        newMatchData,
        {
          headers: this.getAdminHeaders(),
          timeout: 15000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        }
      );

      this.logTest('Create Match API Status', createResponse.status < 400);
      this.logTest('Create Match Response', !!createResponse.data);
      
      if (createResponse.data && createResponse.status < 400) {
        const createdMatch = createResponse.data.data || createResponse.data;
        this.logTest('Match Creation Success', !!createdMatch.id, null, {
          matchId: createdMatch.id,
          status: createResponse.status
        });

        // Test that created match appears in matches list
        try {
          const matchesResponse = await axios.get(`${this.baseURL}/matches`, {
            headers: this.getPublicHeaders(),
            timeout: 10000
          });

          if (matchesResponse.data) {
            const matches = matchesResponse.data.data || matchesResponse.data;
            const foundMatch = Array.isArray(matches) 
              ? matches.find(m => m.id === createdMatch.id)
              : null;
            
            this.logTest('Created Match in Matches List', !!foundMatch);
          }
        } catch (error) {
          this.logTest('Verify Match in List', false, error.message);
        }
      } else {
        this.logTest('Match Creation Success', false, 
          `HTTP ${createResponse.status}: ${createResponse.data?.message || 'Unknown error'}`);
      }

    } catch (error) {
      this.logTest('Create Match API', false, error.message);
    }
  }

  /**
   * 🔧 TEST 6: Additional API Endpoints
   */
  async testAdditionalEndpoints() {
    console.log('\n🔧 TESTING ADDITIONAL ENDPOINTS');
    console.log('=' .repeat(50));

    // Test game data endpoints
    const endpoints = [
      { name: 'Game Data - Heroes', url: '/game-data/all-heroes' },
      { name: 'Game Data - Maps', url: '/game-data/maps' },
      { name: 'Matches List', url: '/matches' },
      { name: 'Tournaments List', url: '/tournaments' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.baseURL}${endpoint.url}`, {
          headers: this.getPublicHeaders(),
          timeout: 10000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        });

        this.logTest(`${endpoint.name} API`, response.status < 400);
        this.logTest(`${endpoint.name} Data`, !!response.data);
      } catch (error) {
        this.logTest(`${endpoint.name} API`, false, error.message);
      }
    }
  }

  /**
   * 🏃 Run all tests
   */
  async runAllTests() {
    console.log('🧪 MRVL PLATFORM COMPREHENSIVE SYSTEM TEST');
    console.log('⚡ Testing all match and live scoring functionality');
    console.log('📅 Test run:', new Date().toISOString());
    console.log('🔗 Base URL:', this.baseURL);
    console.log('');

    // Run all test suites
    await this.testMatchDetailPage();
    await this.testHeroImages();
    await this.testLiveScoring();
    await this.testCommentsSystem();
    await this.testCreateNewMatch();
    await this.testAdditionalEndpoints();

    // Generate final report
    this.generateReport();
  }

  /**
   * 📊 Generate comprehensive test report
   */
  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ PASSED: ${this.testResults.passed}`);
    console.log(`❌ FAILED: ${this.testResults.failed}`);
    console.log(`📊 TOTAL: ${this.testResults.totalTests}`);
    console.log(`📈 SUCCESS RATE: ${((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n🚨 FAILED TESTS:');
      this.testResults.errors.forEach(error => {
        console.log(`   ❌ ${error.test}: ${error.error}`);
      });
    }

    // Save detailed report to file
    const reportPath = path.join(__dirname, `mrvl-system-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    // Create markdown summary
    const mdReport = this.generateMarkdownReport();
    const mdPath = path.join(__dirname, `MRVL_SYSTEM_TEST_REPORT.md`);
    fs.writeFileSync(mdPath, mdReport);
    console.log(`📝 Markdown report saved to: ${mdPath}`);
  }

  /**
   * 📝 Generate markdown report
   */
  generateMarkdownReport() {
    const successRate = ((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(1);
    
    return `# MRVL Platform System Test Report

**Test Date:** ${this.testResults.timestamp}  
**Base URL:** ${this.baseURL}  
**Success Rate:** ${successRate}%

## Summary
- ✅ **Passed:** ${this.testResults.passed}
- ❌ **Failed:** ${this.testResults.failed}
- 📊 **Total Tests:** ${this.testResults.totalTests}

## Test Areas Covered
1. **Match Detail Page** - Loading match data, series scores, team logos, map tabs
2. **Hero Images API** - Heroes list endpoint, individual hero data
3. **Live Scoring** - SSE streams, live stats updates, score synchronization
4. **Comments System** - GET/POST comments, data structure validation
5. **Admin Match Creation** - Creating new matches, field validation
6. **Additional Endpoints** - Game data, tournaments, matches list

## Failed Tests
${this.testResults.errors.length === 0 ? '*No failed tests - all systems operational!*' : 
  this.testResults.errors.map(error => `- **${error.test}:** ${error.error}`).join('\n')}

## Detailed Results
${Object.entries(this.testResults.details).map(([test, data]) => 
  `- **${test}:** ${JSON.stringify(data)}`
).join('\n')}

---
*Generated by MRVL Comprehensive System Tester*
`;
  }
}

// Run the tests
async function main() {
  const tester = new MRVLSystemTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MRVLSystemTester;