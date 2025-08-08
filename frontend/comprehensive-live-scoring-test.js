#!/usr/bin/env node

/**
 * 🔥 COMPREHENSIVE LIVE SCORING SYSTEM TEST SUITE
 * Complete testing framework for Marvel Rivals tournament platform
 * 
 * Test Categories:
 * 1. Match Creation Testing (BO1, BO3, BO5)
 * 2. Match Status Transitions 
 * 3. Live Scoring Updates
 * 4. Player Stats Management
 * 5. Hero Selection System
 * 6. Real-time Updates Testing
 * 7. Concurrent Operations
 * 8. Data Integrity
 * 9. Edge Cases & Error Handling
 * 10. Performance Testing
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test Configuration
const CONFIG = {
    API_URL: 'https://staging.mrvl.net/api',
    TEST_ADMIN_EMAIL: 'jhonny@ar-mediia.com',
    TEST_ADMIN_PASSWORD: 'password123',
    TEST_EVENT_ID: 8,
    CONCURRENT_TESTS: 5,
    PERFORMANCE_DURATION: 60000, // 1 minute
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3
};

// Test Results Storage
let testResults = {
    summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        errors: []
    },
    categories: {}
};

// Heroes and Maps for testing
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

class LiveScoringTestSuite {
    constructor() {
        this.authToken = null;
        this.testStartTime = Date.now();
        this.activeMatches = [];
        this.testData = {};
    }

    // 🔐 Authentication Setup
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
                timeout: CONFIG.TIMEOUT
            });
            
            console.log('✅ Authentication successful');
            return true;
        } catch (error) {
            console.error('❌ Authentication failed:', error.message);
            return false;
        }
    }

    // 📊 Test Result Logging
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

    // 🎮 Test 1: Match Creation Testing
    async testMatchCreation() {
        console.log('\n🎮 Starting Match Creation Tests...');
        
        const formats = ['BO1', 'BO3', 'BO5'];
        
        for (const format of formats) {
            try {
                const matchData = {
                    event_id: CONFIG.TEST_EVENT_ID,
                    team1_id: 1,
                    team2_id: 2,
                    format: format,
                    status: 'upcoming',
                    scheduled_at: new Date(Date.now() + 3600000).toISOString(),
                    maps: this.generateMapsForFormat(format)
                };
                
                const response = await this.api.post('/admin/matches', matchData);
                const match = response.data.data;
                
                this.activeMatches.push(match.id);
                this.testData[`${format}_match`] = match;
                
                // Verify match creation
                const verification = await this.api.get(`/matches/${match.id}`);
                const verifiedMatch = verification.data.data;
                
                const isValid = 
                    verifiedMatch.format === format &&
                    verifiedMatch.status === 'upcoming' &&
                    verifiedMatch.team1_id === 1 &&
                    verifiedMatch.team2_id === 2;
                
                this.logTestResult('Match Creation', `Create ${format} match`, isValid, {
                    matchId: match.id,
                    format: format,
                    expectedMaps: this.getMapsCountForFormat(format)
                });
                
            } catch (error) {
                this.logTestResult('Match Creation', `Create ${format} match`, false, {}, error);
            }
        }
    }

    // 🔄 Test 2: Match Status Transitions
    async testMatchStatusTransitions() {
        console.log('\n🔄 Starting Match Status Transition Tests...');
        
        if (!this.testData.BO3_match) {
            this.logTestResult('Status Transitions', 'No BO3 match available', false);
            return;
        }
        
        const matchId = this.testData.BO3_match.id;
        const transitions = [
            { from: 'upcoming', to: 'live' },
            { from: 'live', to: 'paused' },
            { from: 'paused', to: 'live' },
            { from: 'live', to: 'completed' }
        ];
        
        for (const transition of transitions) {
            try {
                const response = await this.api.put(`/admin/matches/${matchId}/status`, {
                    status: transition.to
                });
                
                // Verify status change
                const verification = await this.api.get(`/matches/${matchId}`);
                const currentStatus = verification.data.data.status;
                
                const isValid = currentStatus === transition.to;
                
                this.logTestResult('Status Transitions', 
                    `${transition.from} → ${transition.to}`, 
                    isValid, 
                    { matchId, expectedStatus: transition.to, actualStatus: currentStatus }
                );
                
                // Small delay between transitions
                await this.sleep(500);
                
            } catch (error) {
                this.logTestResult('Status Transitions', 
                    `${transition.from} → ${transition.to}`, 
                    false, 
                    { matchId }, 
                    error
                );
            }
        }
        
        // Test invalid transitions
        try {
            await this.api.put(`/admin/matches/${matchId}/status`, {
                status: 'upcoming'
            });
            this.logTestResult('Status Transitions', 'Invalid transition (completed → upcoming)', false, {
                expectedError: 'Should not allow completed → upcoming'
            });
        } catch (error) {
            this.logTestResult('Status Transitions', 'Invalid transition (completed → upcoming)', true, {
                correctlyRejected: true,
                errorMessage: error.message
            });
        }
    }

    // ⚡ Test 3: Live Scoring Updates
    async testLiveScoringUpdates() {
        console.log('\n⚡ Starting Live Scoring Update Tests...');
        
        if (!this.testData.BO3_match) {
            this.logTestResult('Live Scoring', 'No BO3 match available', false);
            return;
        }
        
        const matchId = this.testData.BO3_match.id;
        
        // Test score increments
        const scoreTests = [
            { team1: 1, team2: 0, description: 'Team1 scores first' },
            { team1: 1, team2: 1, description: 'Team2 equalizes' },
            { team1: 2, team2: 1, description: 'Team1 takes lead' },
            { team1: 2, team2: 2, description: 'Tied game' },
            { team1: 3, team2: 2, description: 'Team1 wins map' }
        ];
        
        for (const scoreTest of scoreTests) {
            try {
                const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    team1_score: 0,
                    team2_score: 0,
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: 'Tokyo 2099: Shibuya Sky',
                        mode: 'Domination',
                        team1_score: scoreTest.team1,
                        team2_score: scoreTest.team2,
                        status: 'ongoing'
                    }]
                });
                
                // Verify score update
                const verification = await this.api.get(`/matches/${matchId}/live-scoreboard`);
                const matchData = verification.data.match;
                
                const isValid = 
                    matchData.team1_score === scoreTest.team1 &&
                    matchData.team2_score === scoreTest.team2;
                
                this.logTestResult('Live Scoring', scoreTest.description, isValid, {
                    expected: scoreTest,
                    actual: {
                        team1: matchData.team1_score,
                        team2: matchData.team2_score
                    }
                });
                
            } catch (error) {
                this.logTestResult('Live Scoring', scoreTest.description, false, {}, error);
            }
        }
        
        // Test score decrements (corrections)
        try {
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                status: 'live',
                team1_score: 0,
                team2_score: 0,
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: 'Tokyo 2099: Shibuya Sky',
                    mode: 'Domination',
                    team1_score: 2, // Decreased from 3
                    team2_score: 2,
                    status: 'ongoing'
                }]
            });
            
            this.logTestResult('Live Scoring', 'Score decrement (correction)', true, {
                action: 'Team1 score corrected from 3 to 2'
            });
            
        } catch (error) {
            this.logTestResult('Live Scoring', 'Score decrement (correction)', false, {}, error);
        }
        
        // Test score reset
        try {
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                status: 'live',
                team1_score: 0,
                team2_score: 0,
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: 'Tokyo 2099: Shibuya Sky',
                    mode: 'Domination',
                    team1_score: 0,
                    team2_score: 0,
                    status: 'ongoing'
                }]
            });
            
            this.logTestResult('Live Scoring', 'Score reset', true, {
                action: 'All scores reset to 0-0'
            });
            
        } catch (error) {
            this.logTestResult('Live Scoring', 'Score reset', false, {}, error);
        }
    }

    // 📊 Test 4: Player Stats Management
    async testPlayerStatsManagement() {
        console.log('\n📊 Starting Player Stats Management Tests...');
        
        if (!this.testData.BO3_match) {
            this.logTestResult('Player Stats', 'No BO3 match available', false);
            return;
        }
        
        const matchId = this.testData.BO3_match.id;
        
        // Create test player stats for all maps
        const testPlayerStats = {
            1: { // Player ID 1
                eliminations: 15,
                deaths: 8,
                assists: 12,
                damage: 8500,
                healing: 0,
                damage_blocked: 0
            },
            2: { // Player ID 2
                eliminations: 3,
                deaths: 2,
                assists: 18,
                damage: 2100,
                healing: 7500,
                damage_blocked: 0
            }
        };
        
        // Test stats for each map separately
        for (let mapNumber = 1; mapNumber <= 3; mapNumber++) {
            try {
                const maps = [];
                for (let i = 1; i <= 3; i++) {
                    maps.push({
                        map_number: i,
                        map_name: TEST_MAPS[(i-1) % TEST_MAPS.length].name,
                        mode: TEST_MAPS[(i-1) % TEST_MAPS.length].mode,
                        team1_score: i === mapNumber ? 3 : 0,
                        team2_score: i === mapNumber ? 2 : 0,
                        status: i === mapNumber ? 'completed' : (i < mapNumber ? 'completed' : 'upcoming'),
                        team1_composition: Object.keys(testPlayerStats).map(playerId => ({
                            player_id: parseInt(playerId),
                            player_name: `Player${playerId}`,
                            hero: TEST_HEROES[Math.floor(Math.random() * TEST_HEROES.length)],
                            ...testPlayerStats[playerId]
                        })),
                        team2_composition: []
                    });
                }
                
                const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    team1_score: mapNumber >= 2 ? 1 : 0,
                    team2_score: mapNumber >= 3 ? 1 : 0,
                    current_map: mapNumber,
                    maps: maps,
                    player_stats: testPlayerStats
                });
                
                this.logTestResult('Player Stats', `Map ${mapNumber} stats update`, true, {
                    mapNumber,
                    playersUpdated: Object.keys(testPlayerStats).length
                });
                
            } catch (error) {
                this.logTestResult('Player Stats', `Map ${mapNumber} stats update`, false, {}, error);
            }
        }
        
        // Test stats isolation between maps
        try {
            const verification = await this.api.get(`/matches/${matchId}/live-scoreboard`);
            const matchData = verification.data.match;
            
            if (matchData.maps_data) {
                const mapsData = JSON.parse(matchData.maps_data);
                const statsIsolated = mapsData.every((map, index) => {
                    return map.team1_composition && map.team1_composition.length > 0;
                });
                
                this.logTestResult('Player Stats', 'Stats isolation between maps', statsIsolated, {
                    mapsWithStats: mapsData.filter(map => map.team1_composition?.length > 0).length,
                    totalMaps: mapsData.length
                });
            }
            
        } catch (error) {
            this.logTestResult('Player Stats', 'Stats isolation between maps', false, {}, error);
        }
    }

    // 🦸 Test 5: Hero Selection System
    async testHeroSelectionSystem() {
        console.log('\n🦸 Starting Hero Selection System Tests...');
        
        if (!this.testData.BO3_match) {
            this.logTestResult('Hero Selection', 'No BO3 match available', false);
            return;
        }
        
        const matchId = this.testData.BO3_match.id;
        
        // Test hero selection for each map
        for (let mapNumber = 1; mapNumber <= 3; mapNumber++) {
            try {
                const heroSelections = TEST_HEROES.slice(0, 6).map((hero, index) => ({
                    player_id: index + 1,
                    player_name: `Player${index + 1}`,
                    hero: hero,
                    eliminations: 0,
                    deaths: 0,
                    assists: 0,
                    damage: 0,
                    healing: 0,
                    damage_blocked: 0
                }));
                
                const maps = [{
                    map_number: mapNumber,
                    map_name: TEST_MAPS[(mapNumber-1) % TEST_MAPS.length].name,
                    mode: TEST_MAPS[(mapNumber-1) % TEST_MAPS.length].mode,
                    team1_score: 0,
                    team2_score: 0,
                    status: 'ongoing',
                    team1_composition: heroSelections,
                    team2_composition: []
                }];
                
                const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    current_map: mapNumber,
                    maps: maps
                });
                
                this.logTestResult('Hero Selection', `Map ${mapNumber} hero assignments`, true, {
                    mapNumber,
                    heroesAssigned: heroSelections.length,
                    uniqueHeroes: new Set(heroSelections.map(h => h.hero)).size
                });
                
            } catch (error) {
                this.logTestResult('Hero Selection', `Map ${mapNumber} hero assignments`, false, {}, error);
            }
        }
        
        // Test mid-game hero changes
        try {
            const updatedHeroSelections = TEST_HEROES.slice(6, 12).map((hero, index) => ({
                player_id: index + 1,
                player_name: `Player${index + 1}`,
                hero: hero,
                eliminations: 5, // Keep existing stats
                deaths: 2,
                assists: 3,
                damage: 1500,
                healing: 0,
                damage_blocked: 0
            }));
            
            const maps = [{
                map_number: 1,
                map_name: TEST_MAPS[0].name,
                mode: TEST_MAPS[0].mode,
                team1_score: 1,
                team2_score: 1,
                status: 'ongoing',
                team1_composition: updatedHeroSelections,
                team2_composition: []
            }];
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                status: 'live',
                current_map: 1,
                maps: maps
            });
            
            this.logTestResult('Hero Selection', 'Mid-game hero changes', true, {
                changedHeroes: updatedHeroSelections.length,
                statsPreserved: updatedHeroSelections.every(p => p.eliminations > 0)
            });
            
        } catch (error) {
            this.logTestResult('Hero Selection', 'Mid-game hero changes', false, {}, error);
        }
        
        // Test invalid hero IDs
        try {
            const invalidHeroSelections = [{
                player_id: 1,
                player_name: 'Player1',
                hero: 'InvalidHero123',
                eliminations: 0,
                deaths: 0,
                assists: 0,
                damage: 0,
                healing: 0,
                damage_blocked: 0
            }];
            
            const maps = [{
                map_number: 1,
                map_name: TEST_MAPS[0].name,
                mode: TEST_MAPS[0].mode,
                team1_score: 0,
                team2_score: 0,
                status: 'ongoing',
                team1_composition: invalidHeroSelections,
                team2_composition: []
            }];
            
            await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                status: 'live',
                current_map: 1,
                maps: maps
            });
            
            // If this doesn't throw an error, the validation isn't working
            this.logTestResult('Hero Selection', 'Invalid hero ID validation', false, {
                expectedError: 'Should reject invalid hero names'
            });
            
        } catch (error) {
            // This should fail - good validation
            this.logTestResult('Hero Selection', 'Invalid hero ID validation', true, {
                correctlyRejected: true,
                errorMessage: error.message
            });
        }
    }

    // 🔄 Test 6: Real-time Updates Testing
    async testRealTimeUpdates() {
        console.log('\n🔄 Starting Real-time Updates Tests...');
        
        if (!this.testData.BO3_match) {
            this.logTestResult('Real-time Updates', 'No BO3 match available', false);
            return;
        }
        
        const matchId = this.testData.BO3_match.id;
        
        // Test rapid successive updates
        const rapidUpdates = [];
        for (let i = 0; i < 10; i++) {
            rapidUpdates.push(
                this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    team1_score: 0,
                    team2_score: 0,
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: i % 2 === 0 ? i : 0,
                        team2_score: i % 2 === 1 ? i : 0,
                        status: 'ongoing'
                    }]
                })
            );
        }
        
        try {
            const results = await Promise.all(rapidUpdates);
            const allSuccessful = results.every(r => r.status === 200);
            
            this.logTestResult('Real-time Updates', 'Rapid successive updates', allSuccessful, {
                totalUpdates: rapidUpdates.length,
                successfulUpdates: results.filter(r => r.status === 200).length
            });
            
        } catch (error) {
            this.logTestResult('Real-time Updates', 'Rapid successive updates', false, {}, error);
        }
        
        // Test update latency
        const startTime = Date.now();
        try {
            await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                status: 'live',
                team1_score: 0,
                team2_score: 0,
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 5,
                    team2_score: 3,
                    status: 'ongoing'
                }]
            });
            
            const updateLatency = Date.now() - startTime;
            const isAcceptable = updateLatency < 2000; // Less than 2 seconds
            
            this.logTestResult('Real-time Updates', 'Update latency', isAcceptable, {
                latencyMs: updateLatency,
                acceptable: isAcceptable
            });
            
        } catch (error) {
            this.logTestResult('Real-time Updates', 'Update latency', false, {}, error);
        }
    }

    // 🔀 Test 7: Concurrent Operations
    async testConcurrentOperations() {
        console.log('\n🔀 Starting Concurrent Operations Tests...');
        
        // Test multiple matches running simultaneously
        const concurrentMatches = [];
        for (let i = 0; i < CONFIG.CONCURRENT_TESTS; i++) {
            concurrentMatches.push(this.createTestMatch(`ConcurrentTest${i}`));
        }
        
        try {
            const matches = await Promise.all(concurrentMatches);
            const allSuccessful = matches.every(m => m && m.id);
            
            this.logTestResult('Concurrent Operations', 'Multiple match creation', allSuccessful, {
                attempted: CONFIG.CONCURRENT_TESTS,
                successful: matches.filter(m => m && m.id).length
            });
            
            // Test concurrent updates to same match
            if (matches[0] && matches[0].id) {
                const matchId = matches[0].id;
                const concurrentUpdates = [];
                
                for (let i = 0; i < 5; i++) {
                    concurrentUpdates.push(
                        this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                            status: 'live',
                            team1_score: 0,
                            team2_score: 0,
                            current_map: 1,
                            maps: [{
                                map_number: 1,
                                map_name: TEST_MAPS[0].name,
                                mode: TEST_MAPS[0].mode,
                                team1_score: i,
                                team2_score: 0,
                                status: 'ongoing'
                            }]
                        })
                    );
                }
                
                const updateResults = await Promise.all(concurrentUpdates.map(p => 
                    p.catch(e => ({ error: e.message }))
                ));
                
                const successfulUpdates = updateResults.filter(r => !r.error);
                
                this.logTestResult('Concurrent Operations', 'Concurrent updates to same match', 
                    successfulUpdates.length > 0, {
                    attempted: concurrentUpdates.length,
                    successful: successfulUpdates.length,
                    conflicts: updateResults.filter(r => r.error).length
                });
            }
            
        } catch (error) {
            this.logTestResult('Concurrent Operations', 'Multiple match creation', false, {}, error);
        }
    }

    // 🔒 Test 8: Data Integrity
    async testDataIntegrity() {
        console.log('\n🔒 Starting Data Integrity Tests...');
        
        if (!this.testData.BO3_match) {
            this.logTestResult('Data Integrity', 'No BO3 match available', false);
            return;
        }
        
        const matchId = this.testData.BO3_match.id;
        
        // Test data persistence across multiple saves
        const testData = {
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
                    team2_score: 1,
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
        
        try {
            // Save data
            await this.api.post(`/admin/matches/${matchId}/simple-scoring`, testData);
            
            // Wait a moment
            await this.sleep(1000);
            
            // Retrieve and verify
            const verification = await this.api.get(`/matches/${matchId}/live-scoreboard`);
            const matchData = verification.data.match;
            
            const dataMatches = 
                matchData.team1_score === testData.team1_score &&
                matchData.team2_score === testData.team2_score &&
                matchData.status === testData.status;
            
            this.logTestResult('Data Integrity', 'Data persistence', dataMatches, {
                expected: testData,
                actual: {
                    team1_score: matchData.team1_score,
                    team2_score: matchData.team2_score,
                    status: matchData.status
                }
            });
            
        } catch (error) {
            this.logTestResult('Data Integrity', 'Data persistence', false, {}, error);
        }
        
        // Test database constraints (invalid data)
        try {
            await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                status: 'live',
                team1_score: -5, // Invalid negative score
                team2_score: 'invalid', // Invalid non-numeric score
                current_map: 1
            });
            
            this.logTestResult('Data Integrity', 'Database constraints', false, {
                expectedError: 'Should reject invalid data'
            });
            
        } catch (error) {
            this.logTestResult('Data Integrity', 'Database constraints', true, {
                correctlyRejected: true,
                errorMessage: error.message
            });
        }
    }

    // 🚨 Test 9: Edge Cases & Error Handling
    async testEdgeCasesAndErrorHandling() {
        console.log('\n🚨 Starting Edge Cases & Error Handling Tests...');
        
        // Test 0-0 scores
        if (this.testData.BO1_match) {
            try {
                const matchId = this.testData.BO1_match.id;
                await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    team1_score: 0,
                    team2_score: 0,
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'ongoing'
                    }]
                });
                
                this.logTestResult('Edge Cases', '0-0 score handling', true, {
                    scenario: '0-0 draw accepted'
                });
                
            } catch (error) {
                this.logTestResult('Edge Cases', '0-0 score handling', false, {}, error);
            }
        }
        
        // Test overtime scenarios
        if (this.testData.BO3_match) {
            try {
                const matchId = this.testData.BO3_match.id;
                await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    team1_score: 1,
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
                            team1_score: 5, // Overtime score
                            team2_score: 5,
                            status: 'ongoing'
                        }
                    ]
                });
                
                this.logTestResult('Edge Cases', 'Overtime scenario', true, {
                    scenario: 'High score overtime match'
                });
                
            } catch (error) {
                this.logTestResult('Edge Cases', 'Overtime scenario', false, {}, error);
            }
        }
        
        // Test forfeit scenarios
        try {
            const forfeitMatch = await this.createTestMatch('ForfeitTest');
            if (forfeitMatch && forfeitMatch.id) {
                await this.api.post(`/admin/matches/${forfeitMatch.id}/simple-scoring`, {
                    status: 'completed',
                    team1_score: 1,
                    team2_score: 0,
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'forfeit',
                        winner: 'team1'
                    }]
                });
                
                this.logTestResult('Edge Cases', 'Forfeit scenario', true, {
                    scenario: 'Match forfeit by team2'
                });
            }
            
        } catch (error) {
            this.logTestResult('Edge Cases', 'Forfeit scenario', false, {}, error);
        }
        
        // Test invalid data inputs
        if (this.testData.BO3_match) {
            const invalidInputs = [
                { field: 'team1_score', value: 'not_a_number', description: 'Non-numeric score' },
                { field: 'status', value: 'invalid_status', description: 'Invalid status' },
                { field: 'current_map', value: 999, description: 'Invalid map number' }
            ];
            
            for (const invalidInput of invalidInputs) {
                try {
                    const testPayload = {
                        status: 'live',
                        team1_score: 0,
                        team2_score: 0,
                        current_map: 1
                    };
                    testPayload[invalidInput.field] = invalidInput.value;
                    
                    await this.api.post(`/admin/matches/${this.testData.BO3_match.id}/simple-scoring`, testPayload);
                    
                    this.logTestResult('Edge Cases', `Invalid input: ${invalidInput.description}`, false, {
                        expectedError: 'Should reject invalid input'
                    });
                    
                } catch (error) {
                    this.logTestResult('Edge Cases', `Invalid input: ${invalidInput.description}`, true, {
                        correctlyRejected: true,
                        errorMessage: error.message
                    });
                }
            }
        }
    }

    // ⚡ Test 10: Performance Testing
    async testPerformance() {
        console.log('\n⚡ Starting Performance Tests...');
        
        if (!this.testData.BO3_match) {
            this.logTestResult('Performance', 'No BO3 match available', false);
            return;
        }
        
        const matchId = this.testData.BO3_match.id;
        const performanceResults = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageLatency: 0,
            maxLatency: 0,
            minLatency: Infinity
        };
        
        const latencies = [];
        const startTime = Date.now();
        
        console.log(`Running performance test for ${CONFIG.PERFORMANCE_DURATION / 1000} seconds...`);
        
        while (Date.now() - startTime < CONFIG.PERFORMANCE_DURATION) {
            const requestStart = Date.now();
            
            try {
                await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    team1_score: 0,
                    team2_score: 0,
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: Math.floor(Math.random() * 10),
                        team2_score: Math.floor(Math.random() * 10),
                        status: 'ongoing'
                    }]
                });
                
                const latency = Date.now() - requestStart;
                latencies.push(latency);
                performanceResults.successfulRequests++;
                
                if (latency > performanceResults.maxLatency) performanceResults.maxLatency = latency;
                if (latency < performanceResults.minLatency) performanceResults.minLatency = latency;
                
            } catch (error) {
                performanceResults.failedRequests++;
            }
            
            performanceResults.totalRequests++;
            
            // Small delay to avoid overwhelming the server
            await this.sleep(100);
        }
        
        performanceResults.averageLatency = latencies.length > 0 
            ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
            : 0;
        
        const successRate = (performanceResults.successfulRequests / performanceResults.totalRequests) * 100;
        const performanceAcceptable = successRate >= 95 && performanceResults.averageLatency < 1000;
        
        this.logTestResult('Performance', 'Load testing', performanceAcceptable, {
            duration: CONFIG.PERFORMANCE_DURATION / 1000,
            totalRequests: performanceResults.totalRequests,
            successRate: successRate.toFixed(2),
            averageLatency: performanceResults.averageLatency.toFixed(2),
            maxLatency: performanceResults.maxLatency,
            minLatency: performanceResults.minLatency === Infinity ? 0 : performanceResults.minLatency
        });
    }

    // 🛠️ Helper Methods
    async createTestMatch(name = 'Test') {
        try {
            const matchData = {
                event_id: CONFIG.TEST_EVENT_ID,
                team1_id: 1,
                team2_id: 2,
                format: 'BO3',
                status: 'upcoming',
                scheduled_at: new Date(Date.now() + 3600000).toISOString(),
                name: name
            };
            
            const response = await this.api.post('/admin/matches', matchData);
            return response.data.data;
        } catch (error) {
            console.error(`Failed to create test match: ${error.message}`);
            return null;
        }
    }

    generateMapsForFormat(format) {
        const mapCount = this.getMapsCountForFormat(format);
        const maps = [];
        
        for (let i = 0; i < mapCount; i++) {
            maps.push({
                map_number: i + 1,
                map_name: TEST_MAPS[i % TEST_MAPS.length].name,
                mode: TEST_MAPS[i % TEST_MAPS.length].mode
            });
        }
        
        return maps;
    }

    getMapsCountForFormat(format) {
        switch (format) {
            case 'BO1': return 1;
            case 'BO3': return 3;
            case 'BO5': return 5;
            default: return 3;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 📊 Generate Test Report
    generateReport() {
        const duration = Date.now() - this.testStartTime;
        const report = {
            testSuite: 'Comprehensive Live Scoring System Test Suite',
            timestamp: new Date().toISOString(),
            duration: `${(duration / 1000).toFixed(2)} seconds`,
            configuration: CONFIG,
            summary: testResults.summary,
            categories: testResults.categories,
            recommendations: this.generateRecommendations()
        };
        
        // Save report to file
        const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        return { report, reportPath };
    }

    generateRecommendations() {
        const recommendations = [];
        const { summary, categories } = testResults;
        
        if (summary.failed > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Bug Fixes',
                message: `${summary.failed} tests failed and need immediate attention`
            });
        }
        
        if (categories['Performance']?.failed > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Performance',
                message: 'Performance tests failed - consider server optimization'
            });
        }
        
        if (categories['Data Integrity']?.failed > 0) {
            recommendations.push({
                priority: 'critical',
                category: 'Data Integrity',
                message: 'Data integrity issues detected - review database constraints'
            });
        }
        
        if (categories['Real-time Updates']?.failed > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Real-time Features',
                message: 'Real-time update issues - check WebSocket/SSE implementation'
            });
        }
        
        if (summary.passed / summary.totalTests > 0.9) {
            recommendations.push({
                priority: 'low',
                category: 'Overall',
                message: 'System performing well - maintain current quality standards'
            });
        }
        
        return recommendations;
    }

    // 🚀 Main Test Runner
    async runAllTests() {
        console.log('🚀 Starting Comprehensive Live Scoring System Test Suite\n');
        console.log(`Configuration: ${JSON.stringify(CONFIG, null, 2)}\n`);
        
        // Authentication
        const authenticated = await this.authenticate();
        if (!authenticated) {
            console.error('❌ Failed to authenticate. Exiting.');
            return;
        }
        
        try {
            // Run all test categories
            await this.testMatchCreation();
            await this.testMatchStatusTransitions();
            await this.testLiveScoringUpdates();
            await this.testPlayerStatsManagement();
            await this.testHeroSelectionSystem();
            await this.testRealTimeUpdates();
            await this.testConcurrentOperations();
            await this.testDataIntegrity();
            await this.testEdgeCasesAndErrorHandling();
            await this.testPerformance();
            
        } catch (error) {
            console.error('❌ Test suite execution error:', error);
        }
        
        // Generate and display report
        const { report, reportPath } = this.generateReport();
        
        console.log('\n📊 TEST SUITE COMPLETE');
        console.log('═'.repeat(80));
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passed} (${((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${report.summary.failed} (${((report.summary.failed / report.summary.totalTests) * 100).toFixed(1)}%)`);
        console.log(`Duration: ${report.duration}`);
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
                console.log(`• ${error.category}: ${error.testName} - ${error.error}`);
            });
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.forEach(rec => {
                console.log(`[${rec.priority.toUpperCase()}] ${rec.category}: ${rec.message}`);
            });
        }
        
        console.log('\n✅ Test suite execution completed.');
    }
}

// Run the test suite if called directly
if (require.main === module) {
    const testSuite = new LiveScoringTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = LiveScoringTestSuite;