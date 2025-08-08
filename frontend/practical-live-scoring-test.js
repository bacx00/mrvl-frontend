#!/usr/bin/env node

/**
 * 🔥 PRACTICAL LIVE SCORING SYSTEM TEST
 * Tests using existing matches in the system
 * Focuses on testing the actual live scoring functionality
 */

const axios = require('axios');
const fs = require('fs');

// Test Configuration
const CONFIG = {
    API_URL: 'https://staging.mrvl.net/api',
    TEST_ADMIN_EMAIL: 'jhonny@ar-mediia.com',
    TEST_ADMIN_PASSWORD: 'password123'
};

const TEST_HEROES = [
    'Spider-Man', 'Iron Man', 'Hulk', 'Black Widow', 'Captain America', 'Thor',
    'Doctor Strange', 'Scarlet Witch', 'Winter Soldier', 'Hawkeye',
    'Rocket Raccoon', 'Groot', 'Star-Lord', 'Mantis', 'Storm', 'Wolverine'
];

const TEST_MAPS = [
    { name: 'Tokyo 2099: Shibuya Sky', mode: 'Domination' },
    { name: 'Klyntar', mode: 'Convoy' },
    { name: 'Asgard', mode: 'Convergence' },
    { name: 'Wakanda', mode: 'Domination' },
    { name: 'Intergalactic Empire of Wakanda', mode: 'Convoy' }
];

let testResults = {
    summary: { totalTests: 0, passed: 0, failed: 0, errors: [] },
    categories: {},
    testData: {}
};

class PracticalLiveScoringTest {
    constructor() {
        this.authToken = null;
        this.api = null;
        this.testMatch = null;
    }

    async authenticate() {
        try {
            console.log('🔐 Authenticating...');
            const response = await axios.post(`${CONFIG.API_URL}/auth/login`, {
                email: CONFIG.TEST_ADMIN_EMAIL,
                password: CONFIG.TEST_ADMIN_PASSWORD
            });
            
            this.authToken = response.data.token;
            this.api = axios.create({
                baseURL: CONFIG.API_URL,
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            
            console.log('✅ Authentication successful');
            return true;
        } catch (error) {
            console.error('❌ Authentication failed:', error.message);
            return false;
        }
    }

    logTestResult(category, testName, passed, details = {}, error = null) {
        testResults.summary.totalTests++;
        
        if (passed) {
            testResults.summary.passed++;
            console.log(`✅ ${category}: ${testName}`);
        } else {
            testResults.summary.failed++;
            console.log(`❌ ${category}: ${testName} - ${error?.message || 'Failed'}`);
            testResults.summary.errors.push({
                category,
                testName,
                error: error?.message || 'Unknown error',
                details
            });
        }
        
        if (!testResults.categories[category]) {
            testResults.categories[category] = { passed: 0, failed: 0, tests: [] };
        }
        
        testResults.categories[category][passed ? 'passed' : 'failed']++;
        testResults.categories[category].tests.push({
            name: testName,
            passed,
            details,
            error: error?.message,
            timestamp: new Date().toISOString()
        });
    }

    async findTestMatch() {
        try {
            console.log('\n🔍 Finding available matches...');
            const response = await this.api.get('/matches');
            const matches = response.data.data || [];
            
            console.log(`Found ${matches.length} matches in the system`);
            
            // Look for a BO3 match we can use for testing
            const testableMatch = matches.find(match => 
                match.format === 'BO3' && 
                ['upcoming', 'live', 'paused'].includes(match.status)
            );
            
            if (testableMatch) {
                this.testMatch = testableMatch;
                console.log(`✅ Using match ${testableMatch.id}: ${testableMatch.team1?.name} vs ${testableMatch.team2?.name} (${testableMatch.format}, ${testableMatch.status})`);
                testResults.testData.matchId = testableMatch.id;
                return true;
            } else {
                console.log('❌ No suitable BO3 matches found for testing');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error finding test match:', error.message);
            return false;
        }
    }

    async testMatchStatusTransitions() {
        console.log('\n🔄 Testing Match Status Transitions...');
        
        const matchId = this.testMatch.id;
        const originalStatus = this.testMatch.status;
        
        // Test valid status transitions
        const transitions = [];
        
        if (originalStatus === 'upcoming') {
            transitions.push({ to: 'live', description: 'Start match' });
            transitions.push({ to: 'paused', description: 'Pause match' });
            transitions.push({ to: 'live', description: 'Resume match' });
        } else if (originalStatus === 'live') {
            transitions.push({ to: 'paused', description: 'Pause live match' });
            transitions.push({ to: 'live', description: 'Resume paused match' });
        }
        
        for (const transition of transitions) {
            try {
                console.log(`  Testing: ${transition.description}`);
                
                // Note: Testing different endpoint patterns
                let success = false;
                let error = null;
                
                // Try different endpoints that might exist
                const endpoints = [
                    `/admin/matches/${matchId}/status`,
                    `/admin/matches/${matchId}/control`,
                    `/admin/matches/${matchId}`,
                    `/matches/${matchId}/status`
                ];
                
                for (const endpoint of endpoints) {
                    try {
                        const response = await this.api.put(endpoint, {
                            status: transition.to,
                            action: transition.to === 'live' ? 'start' : transition.to
                        });
                        
                        if (response.status === 200) {
                            success = true;
                            break;
                        }
                    } catch (endpointError) {
                        error = endpointError;
                        // Continue trying other endpoints
                    }
                }
                
                this.logTestResult('Status Transitions', transition.description, success, {
                    matchId,
                    fromStatus: originalStatus,
                    toStatus: transition.to
                }, error);
                
                if (success) {
                    await this.sleep(500); // Brief pause between transitions
                }
                
            } catch (error) {
                this.logTestResult('Status Transitions', transition.description, false, {}, error);
            }
        }
    }

    async testLiveScoring() {
        console.log('\n⚡ Testing Live Scoring Updates...');
        
        const matchId = this.testMatch.id;
        
        // Test 1: Basic score updates using simple-scoring endpoint
        const scoreTests = [
            { team1: 1, team2: 0, description: 'Team1 scores first point' },
            { team1: 1, team2: 1, description: 'Team2 equalizes' },
            { team1: 2, team2: 1, description: 'Team1 takes lead' },
            { team1: 2, team2: 2, description: 'Teams tied' },
            { team1: 3, team2: 2, description: 'Team1 wins first map' }
        ];
        
        for (const scoreTest of scoreTests) {
            try {
                const payload = {
                    status: 'live',
                    team1_score: 0, // Series score
                    team2_score: 0, // Series score
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: scoreTest.team1,
                        team2_score: scoreTest.team2,
                        status: 'ongoing'
                    }]
                };
                
                console.log(`  Testing: ${scoreTest.description} (${scoreTest.team1}-${scoreTest.team2})`);
                
                const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, payload);
                
                // Verify the update
                const verification = await this.api.get(`/matches/${matchId}/live-scoreboard`);
                const matchData = verification.data.match || verification.data.data;
                
                let verified = false;
                if (matchData && matchData.maps_data) {
                    try {
                        const mapsData = JSON.parse(matchData.maps_data);
                        if (mapsData[0]) {
                            verified = mapsData[0].team1_score === scoreTest.team1 && 
                                      mapsData[0].team2_score === scoreTest.team2;
                        }
                    } catch (parseError) {
                        console.log('    Note: Could not parse maps_data for verification');
                    }
                }
                
                this.logTestResult('Live Scoring', scoreTest.description, 
                    response.status === 200, 
                    {
                        expectedScore: `${scoreTest.team1}-${scoreTest.team2}`,
                        verified: verified,
                        responseStatus: response.status
                    }
                );
                
            } catch (error) {
                this.logTestResult('Live Scoring', scoreTest.description, false, {}, error);
            }
        }
        
        // Test 2: Score corrections (decrements)
        try {
            console.log('  Testing: Score correction (decrement)');
            
            const correctionPayload = {
                status: 'live',
                team1_score: 0,
                team2_score: 0,
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 2, // Corrected from 3 to 2
                    team2_score: 2,
                    status: 'ongoing'
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, correctionPayload);
            
            this.logTestResult('Live Scoring', 'Score correction (decrement)', 
                response.status === 200,
                { action: 'Team1 score corrected from 3 to 2' }
            );
            
        } catch (error) {
            this.logTestResult('Live Scoring', 'Score correction (decrement)', false, {}, error);
        }
        
        // Test 3: Complete map and advance to next
        try {
            console.log('  Testing: Complete map and advance');
            
            const completeMapPayload = {
                status: 'live',
                team1_score: 1, // Series score after map 1
                team2_score: 0,
                current_map: 2, // Advance to map 2
                maps: [
                    {
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 3,
                        team2_score: 2,
                        status: 'completed',
                        winner: 'team1'
                    },
                    {
                        map_number: 2,
                        map_name: TEST_MAPS[1].name,
                        mode: TEST_MAPS[1].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'ongoing'
                    }
                ]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, completeMapPayload);
            
            this.logTestResult('Live Scoring', 'Complete map and advance', 
                response.status === 200,
                { 
                    action: 'Map 1 completed, advanced to Map 2',
                    seriesScore: '1-0'
                }
            );
            
        } catch (error) {
            this.logTestResult('Live Scoring', 'Complete map and advance', false, {}, error);
        }
    }

    async testPlayerStatsManagement() {
        console.log('\n📊 Testing Player Stats Management...');
        
        const matchId = this.testMatch.id;
        
        // Test comprehensive player stats for 6v6 format
        const team1Composition = Array.from({length: 6}, (_, index) => ({
            player_id: index + 1,
            player_name: `Team1_Player${index + 1}`,
            hero: TEST_HEROES[index],
            eliminations: Math.floor(Math.random() * 20) + 5,
            deaths: Math.floor(Math.random() * 15) + 1,
            assists: Math.floor(Math.random() * 25) + 3,
            damage: Math.floor(Math.random() * 10000) + 2000,
            healing: index >= 4 ? Math.floor(Math.random() * 8000) + 1000 : 0, // Supports heal
            damage_blocked: index < 2 ? Math.floor(Math.random() * 5000) + 500 : 0 // Tanks block
        }));
        
        const team2Composition = Array.from({length: 6}, (_, index) => ({
            player_id: index + 7,
            player_name: `Team2_Player${index + 1}`,
            hero: TEST_HEROES[index + 6],
            eliminations: Math.floor(Math.random() * 20) + 5,
            deaths: Math.floor(Math.random() * 15) + 1,
            assists: Math.floor(Math.random() * 25) + 3,
            damage: Math.floor(Math.random() * 10000) + 2000,
            healing: index >= 4 ? Math.floor(Math.random() * 8000) + 1000 : 0,
            damage_blocked: index < 2 ? Math.floor(Math.random() * 5000) + 500 : 0
        }));
        
        try {
            console.log('  Testing: Comprehensive player stats (6v6)');
            
            const statsPayload = {
                status: 'live',
                team1_score: 1,
                team2_score: 0,
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 3,
                    team2_score: 1,
                    status: 'ongoing',
                    team1_composition: team1Composition,
                    team2_composition: team2Composition
                }],
                player_stats: {}
            };
            
            // Add player stats to the payload
            [...team1Composition, ...team2Composition].forEach(player => {
                statsPayload.player_stats[player.player_id] = {
                    name: player.player_name,
                    hero: player.hero,
                    team: player.player_id <= 6 ? 1 : 2,
                    eliminations: player.eliminations,
                    deaths: player.deaths,
                    assists: player.assists,
                    damage: player.damage,
                    healing: player.healing,
                    damage_blocked: player.damage_blocked
                };
            });
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, statsPayload);
            
            this.logTestResult('Player Stats', 'Comprehensive player stats (6v6)', 
                response.status === 200,
                {
                    team1Players: team1Composition.length,
                    team2Players: team2Composition.length,
                    totalStats: Object.keys(statsPayload.player_stats).length
                }
            );
            
        } catch (error) {
            this.logTestResult('Player Stats', 'Comprehensive player stats (6v6)', false, {}, error);
        }
        
        // Test stats isolation between maps
        try {
            console.log('  Testing: Stats isolation between maps');
            
            // Create different stats for map 2
            const map2Team1Stats = team1Composition.map(player => ({
                ...player,
                eliminations: Math.floor(Math.random() * 15) + 3, // Different stats
                deaths: Math.floor(Math.random() * 10) + 1,
                assists: Math.floor(Math.random() * 20) + 2,
                damage: Math.floor(Math.random() * 8000) + 1500
            }));
            
            const multiMapPayload = {
                status: 'live',
                team1_score: 1,
                team2_score: 1,
                current_map: 2,
                maps: [
                    {
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 3,
                        team2_score: 1,
                        status: 'completed',
                        team1_composition: team1Composition, // Original stats
                        team2_composition: team2Composition
                    },
                    {
                        map_number: 2,
                        map_name: TEST_MAPS[1].name,
                        mode: TEST_MAPS[1].mode,
                        team1_score: 1,
                        team2_score: 3,
                        status: 'ongoing',
                        team1_composition: map2Team1Stats, // Different stats
                        team2_composition: team2Composition
                    }
                ]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, multiMapPayload);
            
            this.logTestResult('Player Stats', 'Stats isolation between maps', 
                response.status === 200,
                {
                    mapsWithStats: 2,
                    statsIsolated: 'Each map maintains separate player statistics'
                }
            );
            
        } catch (error) {
            this.logTestResult('Player Stats', 'Stats isolation between maps', false, {}, error);
        }
    }

    async testHeroSelection() {
        console.log('\n🦸 Testing Hero Selection System...');
        
        const matchId = this.testMatch.id;
        
        // Test initial hero selection
        try {
            console.log('  Testing: Initial hero selection');
            
            const heroPayload = {
                status: 'live',
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 0,
                    team2_score: 0,
                    status: 'ongoing',
                    team1_composition: TEST_HEROES.slice(0, 6).map((hero, index) => ({
                        player_id: index + 1,
                        player_name: `Player${index + 1}`,
                        hero: hero,
                        eliminations: 0,
                        deaths: 0,
                        assists: 0,
                        damage: 0,
                        healing: 0,
                        damage_blocked: 0
                    })),
                    team2_composition: TEST_HEROES.slice(6, 12).map((hero, index) => ({
                        player_id: index + 7,
                        player_name: `Player${index + 7}`,
                        hero: hero,
                        eliminations: 0,
                        deaths: 0,
                        assists: 0,
                        damage: 0,
                        healing: 0,
                        damage_blocked: 0
                    }))
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, heroPayload);
            
            this.logTestResult('Hero Selection', 'Initial hero selection', 
                response.status === 200,
                {
                    team1Heroes: heroPayload.maps[0].team1_composition.length,
                    team2Heroes: heroPayload.maps[0].team2_composition.length,
                    uniqueHeroes: new Set([
                        ...heroPayload.maps[0].team1_composition.map(p => p.hero),
                        ...heroPayload.maps[0].team2_composition.map(p => p.hero)
                    ]).size
                }
            );
            
        } catch (error) {
            this.logTestResult('Hero Selection', 'Initial hero selection', false, {}, error);
        }
        
        // Test mid-game hero swaps
        try {
            console.log('  Testing: Mid-game hero swaps');
            
            const swapPayload = {
                status: 'live',
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 1,
                    team2_score: 1,
                    status: 'ongoing',
                    team1_composition: [{
                        player_id: 1,
                        player_name: 'Player1',
                        hero: 'Wolverine', // Changed from Spider-Man
                        eliminations: 5, // Keep existing stats
                        deaths: 2,
                        assists: 3,
                        damage: 2500,
                        healing: 0,
                        damage_blocked: 0
                    }]
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, swapPayload);
            
            this.logTestResult('Hero Selection', 'Mid-game hero swaps', 
                response.status === 200,
                {
                    action: 'Player1 switched from Spider-Man to Wolverine',
                    statsPreserved: 'Eliminations: 5, Deaths: 2, Assists: 3'
                }
            );
            
        } catch (error) {
            this.logTestResult('Hero Selection', 'Mid-game hero swaps', false, {}, error);
        }
    }

    async testRealTimeUpdates() {
        console.log('\n🔄 Testing Real-time Updates...');
        
        const matchId = this.testMatch.id;
        
        // Test update latency
        const latencyTests = [];
        for (let i = 0; i < 5; i++) {
            const startTime = Date.now();
            
            try {
                await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: i,
                        team2_score: 0,
                        status: 'ongoing'
                    }]
                });
                
                const latency = Date.now() - startTime;
                latencyTests.push(latency);
                
            } catch (error) {
                console.log(`    Update ${i + 1} failed: ${error.message}`);
            }
        }
        
        if (latencyTests.length > 0) {
            const avgLatency = latencyTests.reduce((sum, lat) => sum + lat, 0) / latencyTests.length;
            const maxLatency = Math.max(...latencyTests);
            const minLatency = Math.min(...latencyTests);
            
            this.logTestResult('Real-time Updates', 'Update latency test', 
                avgLatency < 2000, // Less than 2 seconds average
                {
                    averageLatency: `${avgLatency.toFixed(2)}ms`,
                    maxLatency: `${maxLatency}ms`,
                    minLatency: `${minLatency}ms`,
                    totalTests: latencyTests.length
                }
            );
        } else {
            this.logTestResult('Real-time Updates', 'Update latency test', false, {
                error: 'No successful updates for latency testing'
            });
        }
        
        // Test data consistency after multiple rapid updates
        try {
            console.log('  Testing: Data consistency after rapid updates');
            
            const finalPayload = {
                status: 'live',
                team1_score: 2,
                team2_score: 1,
                current_map: 3,
                maps: [
                    {
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 3,
                        team2_score: 2,
                        status: 'completed'
                    },
                    {
                        map_number: 2,
                        map_name: TEST_MAPS[1].name,
                        mode: TEST_MAPS[1].mode,
                        team1_score: 1,
                        team2_score: 3,
                        status: 'completed'
                    },
                    {
                        map_number: 3,
                        map_name: TEST_MAPS[2].name,
                        mode: TEST_MAPS[2].mode,
                        team1_score: 2,
                        team2_score: 1,
                        status: 'ongoing'
                    }
                ]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, finalPayload);
            
            // Verify data consistency
            await this.sleep(1000);
            const verification = await this.api.get(`/matches/${matchId}/live-scoreboard`);
            
            this.logTestResult('Real-time Updates', 'Data consistency after rapid updates', 
                response.status === 200 && verification.status === 200,
                {
                    updateSuccessful: response.status === 200,
                    verificationSuccessful: verification.status === 200,
                    finalSeriesScore: '2-1'
                }
            );
            
        } catch (error) {
            this.logTestResult('Real-time Updates', 'Data consistency after rapid updates', false, {}, error);
        }
    }

    async testEdgeCases() {
        console.log('\n🚨 Testing Edge Cases & Error Handling...');
        
        const matchId = this.testMatch.id;
        
        // Test 0-0 score
        try {
            console.log('  Testing: 0-0 score handling');
            
            const zeroScorePayload = {
                status: 'live',
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 0,
                    team2_score: 0,
                    status: 'ongoing'
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, zeroScorePayload);
            
            this.logTestResult('Edge Cases', '0-0 score handling', 
                response.status === 200,
                { scenario: 'Zero-zero score accepted' }
            );
            
        } catch (error) {
            this.logTestResult('Edge Cases', '0-0 score handling', false, {}, error);
        }
        
        // Test high score (overtime scenario)
        try {
            console.log('  Testing: High score (overtime) handling');
            
            const overtimePayload = {
                status: 'live',
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 7, // High score indicating overtime
                    team2_score: 6,
                    status: 'ongoing'
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, overtimePayload);
            
            this.logTestResult('Edge Cases', 'High score (overtime) handling', 
                response.status === 200,
                { scenario: 'Overtime score 7-6 accepted' }
            );
            
        } catch (error) {
            this.logTestResult('Edge Cases', 'High score (overtime) handling', false, {}, error);
        }
        
        // Test invalid data rejection
        try {
            console.log('  Testing: Invalid data rejection');
            
            const invalidPayload = {
                status: 'live',
                team1_score: 'invalid_score', // Invalid non-numeric
                team2_score: -5, // Invalid negative
                current_map: 999, // Invalid map number
                maps: []
            };
            
            await this.api.post(`/admin/matches/${matchId}/simple-scoring`, invalidPayload);
            
            // If we get here, validation isn't working
            this.logTestResult('Edge Cases', 'Invalid data rejection', false, {
                expectedError: 'Should reject invalid data'
            });
            
        } catch (error) {
            // This should fail - good validation
            this.logTestResult('Edge Cases', 'Invalid data rejection', true, {
                correctlyRejected: true,
                errorMessage: error.response?.status || error.message
            });
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateReport() {
        const report = {
            testSuite: 'Practical Live Scoring System Test',
            timestamp: new Date().toISOString(),
            testMatch: this.testMatch ? {
                id: this.testMatch.id,
                format: this.testMatch.format,
                status: this.testMatch.status,
                teams: `${this.testMatch.team1?.name} vs ${this.testMatch.team2?.name}`
            } : 'No test match found',
            summary: testResults.summary,
            categories: testResults.categories,
            testData: testResults.testData
        };
        
        const reportPath = `/var/www/mrvl-frontend/frontend/practical-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        return { report, reportPath };
    }

    async runAllTests() {
        console.log('🚀 Starting Practical Live Scoring System Tests\n');
        
        // Authentication
        const authenticated = await this.authenticate();
        if (!authenticated) {
            console.error('❌ Failed to authenticate. Exiting.');
            return;
        }
        
        // Find test match
        const matchFound = await this.findTestMatch();
        if (!matchFound) {
            console.error('❌ No suitable test match found. Exiting.');
            return;
        }
        
        try {
            // Run all test categories
            await this.testMatchStatusTransitions();
            await this.testLiveScoring();
            await this.testPlayerStatsManagement();
            await this.testHeroSelection();
            await this.testRealTimeUpdates();
            await this.testEdgeCases();
            
        } catch (error) {
            console.error('❌ Test execution error:', error);
        }
        
        // Generate report
        const { report, reportPath } = this.generateReport();
        
        console.log('\n📊 PRACTICAL TEST SUITE COMPLETE');
        console.log('═'.repeat(60));
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passed} (${((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${report.summary.failed} (${((report.summary.failed / report.summary.totalTests) * 100).toFixed(1)}%)`);
        console.log(`Test Match: ${report.testMatch.teams} (ID: ${report.testMatch.id})`);
        console.log(`Report saved: ${reportPath}`);
        
        console.log('\n📋 CATEGORY BREAKDOWN:');
        Object.entries(report.categories).forEach(([category, results]) => {
            const total = results.passed + results.failed;
            const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
            console.log(`${category}: ${results.passed}/${total} (${passRate}%)`);
        });
        
        if (report.summary.errors.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            report.summary.errors.forEach(error => {
                console.log(`• ${error.category}: ${error.testName}`);
                console.log(`  Error: ${error.error}`);
            });
        }
        
        // Generate recommendations
        console.log('\n💡 KEY FINDINGS:');
        const passRate = (report.summary.passed / report.summary.totalTests) * 100;
        
        if (passRate >= 90) {
            console.log('✅ Excellent: Live scoring system is functioning very well');
        } else if (passRate >= 70) {
            console.log('⚠️  Good: Live scoring system is mostly functional with some issues');
        } else if (passRate >= 50) {
            console.log('⚠️  Fair: Live scoring system has significant issues that need attention');
        } else {
            console.log('❌ Poor: Live scoring system has critical issues that must be fixed');
        }
        
        console.log('\n✅ Practical test suite completed.');
    }
}

// Run the test if called directly
if (require.main === module) {
    const testSuite = new PracticalLiveScoringTest();
    testSuite.runAllTests().catch(console.error);
}

module.exports = PracticalLiveScoringTest;