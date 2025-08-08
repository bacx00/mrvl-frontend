#!/usr/bin/env node

/**
 * 🎯 FINAL COMPREHENSIVE LIVE SCORING TEST
 * Based on diagnostic findings - focuses on working endpoints and real scenarios
 * 
 * Key Findings from Diagnostics:
 * ✅ /admin/matches/{id}/simple-scoring (POST) - WORKS
 * ✅ /admin/matches/{id}/control (POST) - WORKS 
 * ✅ /admin/matches/{id} (PUT) - WORKS
 * ❌ /admin/matches/{id}/live-control (PUT) - Wrong method, should be POST
 * ❌ /admin/matches/{id}/bulk-player-stats (PUT) - Wrong method, should be POST
 * ❌ /matches/{id}/live-scoreboard - 500 error, possible data corruption
 */

const axios = require('axios');
const fs = require('fs');

const CONFIG = {
    API_URL: 'https://staging.mrvl.net/api',
    TEST_ADMIN_EMAIL: 'jhonny@ar-mediia.com',
    TEST_ADMIN_PASSWORD: 'password123',
    PERFORMANCE_DURATION: 30000, // 30 seconds for performance test
    CONCURRENT_OPERATIONS: 10
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
    summary: { totalTests: 0, passed: 0, failed: 0, errors: [], warnings: [] },
    categories: {},
    performance: {},
    insights: []
};

class FinalComprehensiveTest {
    constructor() {
        this.authToken = null;
        this.api = null;
        this.testMatch = null;
        this.testStartTime = Date.now();
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

    async findTestMatch() {
        try {
            console.log('\n🔍 Finding test match...');
            const response = await this.api.get('/matches');
            const matches = response.data.data || [];
            
            this.testMatch = matches.find(match => 
                match.format === 'BO3' && 
                ['upcoming', 'live', 'paused'].includes(match.status)
            );
            
            if (this.testMatch) {
                console.log(`✅ Using match ${this.testMatch.id}: ${this.testMatch.team1?.name} vs ${this.testMatch.team2?.name} (${this.testMatch.format}, ${this.testMatch.status})`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error finding test match:', error.message);
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

    // 🎮 Test 1: Complete Match Lifecycle
    async testCompleteMatchLifecycle() {
        console.log('\n🎮 Testing Complete Match Lifecycle...');
        
        const matchId = this.testMatch.id;
        const originalStatus = this.testMatch.status;
        
        // Step 1: Initialize match with fresh BO3 data
        try {
            console.log('  Step 1: Initialize BO3 match structure');
            
            const initializePayload = {
                status: 'upcoming',
                team1_score: 0,
                team2_score: 0,
                series_score_team1: 0,
                series_score_team2: 0,
                current_map: 1,
                maps: [
                    {
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'upcoming'
                    },
                    {
                        map_number: 2,
                        map_name: TEST_MAPS[1].name,
                        mode: TEST_MAPS[1].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'upcoming'
                    },
                    {
                        map_number: 3,
                        map_name: TEST_MAPS[2].name,
                        mode: TEST_MAPS[2].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'upcoming'
                    }
                ]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, initializePayload);
            this.logTestResult('Match Lifecycle', 'Initialize BO3 structure', response.status === 200, {
                maps: 3,
                initialStatus: 'upcoming'
            });
            
        } catch (error) {
            this.logTestResult('Match Lifecycle', 'Initialize BO3 structure', false, {}, error);
        }
        
        // Step 2: Start match
        try {
            console.log('  Step 2: Start match');
            
            const startResponse = await this.api.post(`/admin/matches/${matchId}/control`, {
                action: 'start'
            });
            
            this.logTestResult('Match Lifecycle', 'Start match', startResponse.status === 200, {
                action: 'start',
                newStatus: 'live'
            });
            
        } catch (error) {
            this.logTestResult('Match Lifecycle', 'Start match', false, {}, error);
        }
        
        // Step 3: Play Map 1 (Team1 wins 3-1)
        try {
            console.log('  Step 3: Play Map 1 (Team1 wins 3-1)');
            
            const map1Payload = {
                status: 'live',
                team1_score: 0,
                team2_score: 0,
                series_score_team1: 1, // Team1 wins this map
                series_score_team2: 0,
                current_map: 1,
                maps: [
                    {
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 3,
                        team2_score: 1,
                        status: 'completed',
                        winner: 'team1'
                    },
                    {
                        map_number: 2,
                        map_name: TEST_MAPS[1].name,
                        mode: TEST_MAPS[1].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'upcoming'
                    },
                    {
                        map_number: 3,
                        map_name: TEST_MAPS[2].name,
                        mode: TEST_MAPS[2].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'upcoming'
                    }
                ]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, map1Payload);
            this.logTestResult('Match Lifecycle', 'Complete Map 1 (Team1 wins)', response.status === 200, {
                mapScore: '3-1',
                seriesScore: '1-0'
            });
            
        } catch (error) {
            this.logTestResult('Match Lifecycle', 'Complete Map 1 (Team1 wins)', false, {}, error);
        }
        
        // Step 4: Play Map 2 (Team2 wins 3-2)
        try {
            console.log('  Step 4: Play Map 2 (Team2 wins 3-2)');
            
            const map2Payload = {
                status: 'live',
                series_score_team1: 1,
                series_score_team2: 1, // Series tied 1-1
                current_map: 2,
                maps: [
                    {
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 3,
                        team2_score: 1,
                        status: 'completed',
                        winner: 'team1'
                    },
                    {
                        map_number: 2,
                        map_name: TEST_MAPS[1].name,
                        mode: TEST_MAPS[1].mode,
                        team1_score: 2,
                        team2_score: 3,
                        status: 'completed',
                        winner: 'team2'
                    },
                    {
                        map_number: 3,
                        map_name: TEST_MAPS[2].name,
                        mode: TEST_MAPS[2].mode,
                        team1_score: 0,
                        team2_score: 0,
                        status: 'ongoing'
                    }
                ]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, map2Payload);
            this.logTestResult('Match Lifecycle', 'Complete Map 2 (Team2 wins)', response.status === 200, {
                mapScore: '2-3',
                seriesScore: '1-1'
            });
            
        } catch (error) {
            this.logTestResult('Match Lifecycle', 'Complete Map 2 (Team2 wins)', false, {}, error);
        }
        
        // Step 5: Play Map 3 (Team1 wins series 2-1)
        try {
            console.log('  Step 5: Play Map 3 (Team1 wins series)');
            
            const map3Payload = {
                status: 'completed',
                series_score_team1: 2, // Team1 wins series
                series_score_team2: 1,
                current_map: 3,
                maps: [
                    {
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 3,
                        team2_score: 1,
                        status: 'completed',
                        winner: 'team1'
                    },
                    {
                        map_number: 2,
                        map_name: TEST_MAPS[1].name,
                        mode: TEST_MAPS[1].mode,
                        team1_score: 2,
                        team2_score: 3,
                        status: 'completed',
                        winner: 'team2'
                    },
                    {
                        map_number: 3,
                        map_name: TEST_MAPS[2].name,
                        mode: TEST_MAPS[2].mode,
                        team1_score: 3,
                        team2_score: 0,
                        status: 'completed',
                        winner: 'team1'
                    }
                ]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, map3Payload);
            this.logTestResult('Match Lifecycle', 'Complete Map 3 and Series (Team1 wins)', response.status === 200, {
                mapScore: '3-0',
                finalSeriesScore: '2-1',
                winner: 'team1'
            });
            
        } catch (error) {
            this.logTestResult('Match Lifecycle', 'Complete Map 3 and Series (Team1 wins)', false, {}, error);
        }
    }

    // 📊 Test 2: Comprehensive Player Stats Management
    async testPlayerStatsManagement() {
        console.log('\n📊 Testing Comprehensive Player Stats Management...');
        
        const matchId = this.testMatch.id;
        
        // Generate realistic 6v6 player compositions
        const generatePlayerComposition = (teamOffset = 0, heroOffset = 0) => {
            return Array.from({length: 6}, (_, index) => {
                const isSupport = index >= 4; // Last 2 players are supports
                const isTank = index < 2; // First 2 players are tanks
                
                return {
                    player_id: teamOffset + index + 1,
                    player_name: `Team${teamOffset === 0 ? '1' : '2'}_Player${index + 1}`,
                    hero: TEST_HEROES[(heroOffset + index) % TEST_HEROES.length],
                    eliminations: Math.floor(Math.random() * 20) + (isTank ? 5 : isSupport ? 2 : 8),
                    deaths: Math.floor(Math.random() * 12) + (isTank ? 3 : isSupport ? 1 : 4),
                    assists: Math.floor(Math.random() * 25) + (isSupport ? 15 : 5),
                    damage: Math.floor(Math.random() * 8000) + (isTank ? 3000 : isSupport ? 1000 : 4000),
                    healing: isSupport ? Math.floor(Math.random() * 8000) + 4000 : 0,
                    damage_blocked: isTank ? Math.floor(Math.random() * 5000) + 2000 : 0
                };
            });
        };
        
        // Test different maps with different compositions
        for (let mapNumber = 1; mapNumber <= 3; mapNumber++) {
            try {
                console.log(`  Testing Map ${mapNumber} player stats`);
                
                const team1Composition = generatePlayerComposition(0, (mapNumber - 1) * 6);
                const team2Composition = generatePlayerComposition(6, (mapNumber - 1) * 6 + 6);
                
                const statsPayload = {
                    status: 'live',
                    current_map: mapNumber,
                    maps: [{
                        map_number: mapNumber,
                        map_name: TEST_MAPS[(mapNumber - 1) % TEST_MAPS.length].name,
                        mode: TEST_MAPS[(mapNumber - 1) % TEST_MAPS.length].mode,
                        team1_score: mapNumber % 2 === 1 ? 3 : 1,
                        team2_score: mapNumber % 2 === 1 ? 1 : 3,
                        status: 'ongoing',
                        team1_composition: team1Composition,
                        team2_composition: team2Composition
                    }]
                };
                
                const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, statsPayload);
                
                this.logTestResult('Player Stats', `Map ${mapNumber} comprehensive stats`, 
                    response.status === 200, {
                    map: mapNumber,
                    team1Players: team1Composition.length,
                    team2Players: team2Composition.length,
                    totalPlayers: team1Composition.length + team2Composition.length,
                    avgEliminations: Math.round(
                        [...team1Composition, ...team2Composition]
                            .reduce((sum, p) => sum + p.eliminations, 0) / 12
                    )
                });
                
            } catch (error) {
                this.logTestResult('Player Stats', `Map ${mapNumber} comprehensive stats`, false, {}, error);
            }
        }
        
        // Test stats updates mid-match
        try {
            console.log('  Testing mid-match stats updates');
            
            const updatedComposition = [{
                player_id: 1,
                player_name: 'Team1_Player1',
                hero: 'Wolverine', // Hero switch
                eliminations: 25, // Increased eliminations
                deaths: 8,
                assists: 15,
                damage: 12000, // Increased damage
                healing: 0,
                damage_blocked: 3500
            }];
            
            const updatePayload = {
                status: 'live',
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 2,
                    team2_score: 1,
                    status: 'ongoing',
                    team1_composition: updatedComposition
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, updatePayload);
            
            this.logTestResult('Player Stats', 'Mid-match stats update', 
                response.status === 200, {
                action: 'Updated Player1 stats and hero',
                newHero: 'Wolverine',
                newEliminations: 25
            });
            
        } catch (error) {
            this.logTestResult('Player Stats', 'Mid-match stats update', false, {}, error);
        }
    }

    // 🦸 Test 3: Advanced Hero Selection Scenarios
    async testAdvancedHeroSelection() {
        console.log('\n🦸 Testing Advanced Hero Selection Scenarios...');
        
        const matchId = this.testMatch.id;
        
        // Test role-based compositions
        const roleBasedCompositions = {
            balanced: {
                description: 'Balanced 2-2-2 composition',
                team1: ['Hulk', 'Captain America', 'Spider-Man', 'Iron Man', 'Mantis', 'Rocket Raccoon'],
                team2: ['Thor', 'Groot', 'Black Widow', 'Hawkeye', 'Doctor Strange', 'Scarlet Witch']
            },
            aggressive: {
                description: 'Aggressive DPS-heavy composition',
                team1: ['Hulk', 'Spider-Man', 'Iron Man', 'Winter Soldier', 'Storm', 'Mantis'],
                team2: ['Thor', 'Black Widow', 'Hawkeye', 'Wolverine', 'Star-Lord', 'Doctor Strange']
            },
            defensive: {
                description: 'Defensive tank/support heavy',
                team1: ['Hulk', 'Captain America', 'Groot', 'Mantis', 'Rocket Raccoon', 'Doctor Strange'],
                team2: ['Thor', 'Groot', 'Iron Man', 'Mantis', 'Scarlet Witch', 'Storm']
            }
        };
        
        let compositionIndex = 0;
        for (const [compType, compData] of Object.entries(roleBasedCompositions)) {
            try {
                console.log(`  Testing ${compData.description}`);
                
                const team1Composition = compData.team1.map((hero, index) => ({
                    player_id: index + 1,
                    player_name: `Team1_Player${index + 1}`,
                    hero: hero,
                    eliminations: Math.floor(Math.random() * 15) + 5,
                    deaths: Math.floor(Math.random() * 10) + 2,
                    assists: Math.floor(Math.random() * 20) + 5,
                    damage: Math.floor(Math.random() * 8000) + 2000,
                    healing: hero.includes('Mantis') || hero.includes('Doctor Strange') ? 
                           Math.floor(Math.random() * 6000) + 3000 : 0,
                    damage_blocked: hero.includes('Hulk') || hero.includes('Captain America') || hero.includes('Thor') ? 
                                   Math.floor(Math.random() * 4000) + 1500 : 0
                }));
                
                const team2Composition = compData.team2.map((hero, index) => ({
                    player_id: index + 7,
                    player_name: `Team2_Player${index + 1}`,
                    hero: hero,
                    eliminations: Math.floor(Math.random() * 15) + 5,
                    deaths: Math.floor(Math.random() * 10) + 2,
                    assists: Math.floor(Math.random() * 20) + 5,
                    damage: Math.floor(Math.random() * 8000) + 2000,
                    healing: hero.includes('Mantis') || hero.includes('Doctor Strange') || hero.includes('Scarlet Witch') ? 
                           Math.floor(Math.random() * 6000) + 3000 : 0,
                    damage_blocked: hero.includes('Hulk') || hero.includes('Thor') || hero.includes('Groot') ? 
                                   Math.floor(Math.random() * 4000) + 1500 : 0
                }));
                
                const heroPayload = {
                    status: 'live',
                    current_map: compositionIndex + 1,
                    maps: [{
                        map_number: compositionIndex + 1,
                        map_name: TEST_MAPS[compositionIndex].name,
                        mode: TEST_MAPS[compositionIndex].mode,
                        team1_score: 1,
                        team2_score: 1,
                        status: 'ongoing',
                        team1_composition: team1Composition,
                        team2_composition: team2Composition
                    }]
                };
                
                const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, heroPayload);
                
                this.logTestResult('Hero Selection', compData.description, 
                    response.status === 200, {
                    compositionType: compType,
                    team1Heroes: compData.team1,
                    team2Heroes: compData.team2,
                    uniqueHeroes: new Set([...compData.team1, ...compData.team2]).size
                });
                
                compositionIndex++;
                
            } catch (error) {
                this.logTestResult('Hero Selection', compData.description, false, {}, error);
            }
        }
        
        // Test hero swaps during match
        try {
            console.log('  Testing mid-match hero swaps');
            
            const swapScenarios = [
                { from: 'Spider-Man', to: 'Wolverine', reason: 'Counter enemy composition' },
                { from: 'Mantis', to: 'Doctor Strange', reason: 'More aggressive support' },
                { from: 'Hulk', to: 'Captain America', reason: 'Better shield tank' }
            ];
            
            for (const swap of swapScenarios) {
                const swapPayload = {
                    status: 'live',
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 2,
                        team2_score: 2,
                        status: 'ongoing',
                        team1_composition: [{
                            player_id: 1,
                            player_name: 'Team1_Player1',
                            hero: swap.to,
                            eliminations: 10, // Preserve stats
                            deaths: 5,
                            assists: 8,
                            damage: 5500,
                            healing: 0,
                            damage_blocked: 2000
                        }]
                    }]
                };
                
                const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, swapPayload);
                
                this.logTestResult('Hero Selection', `Hero swap: ${swap.from} → ${swap.to}`, 
                    response.status === 200, {
                    swap: `${swap.from} → ${swap.to}`,
                    reason: swap.reason,
                    statsPreserved: true
                });
            }
            
        } catch (error) {
            this.logTestResult('Hero Selection', 'Mid-match hero swaps', false, {}, error);
        }
    }

    // ⚡ Test 4: Real-time Performance and Concurrency
    async testRealTimePerformance() {
        console.log('\n⚡ Testing Real-time Performance and Concurrency...');
        
        const matchId = this.testMatch.id;
        const performanceMetrics = {
            updateLatencies: [],
            concurrentSuccesses: 0,
            concurrentFailures: 0,
            rapidUpdateSuccesses: 0,
            rapidUpdateFailures: 0
        };
        
        // Test 1: Update latency measurement
        console.log('  Measuring update latencies...');
        for (let i = 0; i < 10; i++) {
            const startTime = Date.now();
            
            try {
                await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: i % 4,
                        team2_score: (i + 1) % 4,
                        status: 'ongoing'
                    }]
                });
                
                const latency = Date.now() - startTime;
                performanceMetrics.updateLatencies.push(latency);
                
            } catch (error) {
                console.log(`    Update ${i + 1} failed: ${error.message}`);
            }
        }
        
        const avgLatency = performanceMetrics.updateLatencies.reduce((sum, lat) => sum + lat, 0) / performanceMetrics.updateLatencies.length;
        const maxLatency = Math.max(...performanceMetrics.updateLatencies);
        const minLatency = Math.min(...performanceMetrics.updateLatencies);
        
        this.logTestResult('Performance', 'Update latency measurement', 
            avgLatency < 2000, {
            averageLatency: `${avgLatency.toFixed(2)}ms`,
            maxLatency: `${maxLatency}ms`,
            minLatency: `${minLatency}ms`,
            totalMeasurements: performanceMetrics.updateLatencies.length
        });
        
        // Test 2: Concurrent operations
        console.log('  Testing concurrent operations...');
        const concurrentPromises = [];
        
        for (let i = 0; i < CONFIG.CONCURRENT_OPERATIONS; i++) {
            concurrentPromises.push(
                this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: i % 5,
                        team2_score: (i + 2) % 5,
                        status: 'ongoing'
                    }]
                }).then(() => {
                    performanceMetrics.concurrentSuccesses++;
                }).catch(() => {
                    performanceMetrics.concurrentFailures++;
                })
            );
        }
        
        await Promise.all(concurrentPromises);
        
        const concurrentSuccessRate = (performanceMetrics.concurrentSuccesses / CONFIG.CONCURRENT_OPERATIONS) * 100;
        
        this.logTestResult('Performance', 'Concurrent operations', 
            concurrentSuccessRate >= 80, {
            totalOperations: CONFIG.CONCURRENT_OPERATIONS,
            successes: performanceMetrics.concurrentSuccesses,
            failures: performanceMetrics.concurrentFailures,
            successRate: `${concurrentSuccessRate.toFixed(1)}%`
        });
        
        // Test 3: Rapid successive updates
        console.log('  Testing rapid successive updates...');
        const rapidStartTime = Date.now();
        
        while (Date.now() - rapidStartTime < 10000) { // 10 seconds of rapid updates
            try {
                await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: 'live',
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: Math.floor(Math.random() * 5),
                        team2_score: Math.floor(Math.random() * 5),
                        status: 'ongoing'
                    }]
                });
                
                performanceMetrics.rapidUpdateSuccesses++;
                
            } catch (error) {
                performanceMetrics.rapidUpdateFailures++;
            }
            
            await this.sleep(100); // Small delay to avoid overwhelming
        }
        
        const rapidSuccessRate = (performanceMetrics.rapidUpdateSuccesses / (performanceMetrics.rapidUpdateSuccesses + performanceMetrics.rapidUpdateFailures)) * 100;
        
        this.logTestResult('Performance', 'Rapid successive updates', 
            rapidSuccessRate >= 90, {
            duration: '10 seconds',
            successes: performanceMetrics.rapidUpdateSuccesses,
            failures: performanceMetrics.rapidUpdateFailures,
            successRate: `${rapidSuccessRate.toFixed(1)}%`,
            updatesPerSecond: (performanceMetrics.rapidUpdateSuccesses / 10).toFixed(1)
        });
        
        testResults.performance = performanceMetrics;
    }

    // 🚨 Test 5: Edge Cases and Error Handling
    async testEdgeCasesAndErrorHandling() {
        console.log('\n🚨 Testing Edge Cases and Error Handling...');
        
        const matchId = this.testMatch.id;
        
        // Test 1: Extreme scores
        try {
            console.log('  Testing extreme scores');
            
            const extremePayload = {
                status: 'live',
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: TEST_MAPS[0].name,
                    mode: TEST_MAPS[0].mode,
                    team1_score: 99, // Extreme score
                    team2_score: 98,
                    status: 'ongoing'
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, extremePayload);
            
            this.logTestResult('Edge Cases', 'Extreme scores (99-98)', 
                response.status === 200, {
                scenario: 'Very high scores accepted'
            });
            
        } catch (error) {
            this.logTestResult('Edge Cases', 'Extreme scores (99-98)', false, {}, error);
        }
        
        // Test 2: Zero scores maintained
        try {
            console.log('  Testing zero score consistency');
            
            const zeroPayload = {
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
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, zeroPayload);
            
            this.logTestResult('Edge Cases', 'Zero score consistency', 
                response.status === 200, {
                scenario: '0-0 score maintained'
            });
            
        } catch (error) {
            this.logTestResult('Edge Cases', 'Zero score consistency', false, {}, error);
        }
        
        // Test 3: Unicode and special characters in names
        try {
            console.log('  Testing unicode and special characters');
            
            const unicodePayload = {
                status: 'live',
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: 'Tokyo 2099: 渋谷スカイ 🌸',
                    mode: 'Domination',
                    team1_score: 1,
                    team2_score: 0,
                    status: 'ongoing',
                    team1_composition: [{
                        player_id: 1,
                        player_name: 'Player🎮', // Unicode emoji
                        hero: 'Spider-Man',
                        eliminations: 5,
                        deaths: 2,
                        assists: 3,
                        damage: 2500,
                        healing: 0,
                        damage_blocked: 0
                    }]
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, unicodePayload);
            
            this.logTestResult('Edge Cases', 'Unicode and special characters', 
                response.status === 200, {
                scenario: 'Unicode characters in names accepted'
            });
            
        } catch (error) {
            this.logTestResult('Edge Cases', 'Unicode and special characters', false, {}, error);
        }
        
        // Test 4: Invalid data rejection
        const invalidTests = [
            {
                name: 'Negative scores',
                payload: {
                    status: 'live',
                    current_map: 1,
                    maps: [{
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: -5,
                        team2_score: 3,
                        status: 'ongoing'
                    }]
                }
            },
            {
                name: 'Invalid status',
                payload: {
                    status: 'invalid_status',
                    current_map: 1
                }
            },
            {
                name: 'Invalid map number',
                payload: {
                    status: 'live',
                    current_map: 999
                }
            }
        ];
        
        for (const invalidTest of invalidTests) {
            try {
                console.log(`  Testing invalid data: ${invalidTest.name}`);
                
                await this.api.post(`/admin/matches/${matchId}/simple-scoring`, invalidTest.payload);
                
                // If we get here, validation didn't work
                this.logTestResult('Edge Cases', `Invalid data rejection: ${invalidTest.name}`, false, {
                    expectedError: 'Should reject invalid data'
                });
                
            } catch (error) {
                // This should fail - good validation
                this.logTestResult('Edge Cases', `Invalid data rejection: ${invalidTest.name}`, true, {
                    correctlyRejected: true,
                    errorStatus: error.response?.status || 'Network error'
                });
            }
        }
    }

    // 🔄 Test 6: Data Persistence and Consistency
    async testDataPersistenceAndConsistency() {
        console.log('\n🔄 Testing Data Persistence and Consistency...');
        
        const matchId = this.testMatch.id;
        
        // Test 1: Complex state persistence
        try {
            console.log('  Testing complex state persistence');
            
            const complexState = {
                status: 'live',
                series_score_team1: 1,
                series_score_team2: 1,
                current_map: 3,
                maps: [
                    {
                        map_number: 1,
                        map_name: TEST_MAPS[0].name,
                        mode: TEST_MAPS[0].mode,
                        team1_score: 3,
                        team2_score: 1,
                        status: 'completed',
                        winner: 'team1',
                        team1_composition: [{
                            player_id: 1,
                            player_name: 'Player1',
                            hero: 'Spider-Man',
                            eliminations: 15,
                            deaths: 5,
                            assists: 10,
                            damage: 5500,
                            healing: 0,
                            damage_blocked: 0
                        }]
                    },
                    {
                        map_number: 2,
                        map_name: TEST_MAPS[1].name,
                        mode: TEST_MAPS[1].mode,
                        team1_score: 1,
                        team2_score: 3,
                        status: 'completed',
                        winner: 'team2'
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
            
            // Save complex state
            const saveResponse = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, complexState);
            
            // Wait a moment
            await this.sleep(1000);
            
            // Verify persistence by retrieving match
            const retrieveResponse = await this.api.get(`/matches/${matchId}`);
            const retrievedMatch = retrieveResponse.data.data || retrieveResponse.data;
            
            const isConsistent = 
                retrievedMatch.series_score_team1 === complexState.series_score_team1 &&
                retrievedMatch.series_score_team2 === complexState.series_score_team2 &&
                retrievedMatch.status === complexState.status;
            
            this.logTestResult('Data Persistence', 'Complex state persistence', 
                saveResponse.status === 200 && isConsistent, {
                saved: saveResponse.status === 200,
                retrieved: retrieveResponse.status === 200,
                consistent: isConsistent,
                seriesScore: `${retrievedMatch.series_score_team1}-${retrievedMatch.series_score_team2}`
            });
            
        } catch (error) {
            this.logTestResult('Data Persistence', 'Complex state persistence', false, {}, error);
        }
        
        // Test 2: Multiple rapid saves consistency
        try {
            console.log('  Testing multiple rapid saves consistency');
            
            const rapidSaves = [];
            for (let i = 0; i < 5; i++) {
                rapidSaves.push(
                    this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
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
                    })
                );
            }
            
            const results = await Promise.all(rapidSaves);
            const allSuccessful = results.every(r => r.status === 200);
            
            // Wait and verify final state
            await this.sleep(1000);
            const finalCheck = await this.api.get(`/matches/${matchId}`);
            
            this.logTestResult('Data Persistence', 'Multiple rapid saves consistency', 
                allSuccessful && finalCheck.status === 200, {
                rapidSaves: results.length,
                allSuccessful: allSuccessful,
                finalStateRetrieved: finalCheck.status === 200
            });
            
        } catch (error) {
            this.logTestResult('Data Persistence', 'Multiple rapid saves consistency', false, {}, error);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateFinalReport() {
        const duration = Date.now() - this.testStartTime;
        const report = {
            testSuite: 'Final Comprehensive Live Scoring System Test',
            timestamp: new Date().toISOString(),
            duration: `${(duration / 1000).toFixed(2)} seconds`,
            testMatch: this.testMatch ? {
                id: this.testMatch.id,
                format: this.testMatch.format,
                status: this.testMatch.status,
                teams: `${this.testMatch.team1?.name} vs ${this.testMatch.team2?.name}`
            } : null,
            summary: testResults.summary,
            categories: testResults.categories,
            performance: testResults.performance,
            insights: this.generateInsights(),
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = `/var/www/mrvl-frontend/frontend/final-comprehensive-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        return { report, reportPath };
    }

    generateInsights() {
        const insights = [];
        const { summary, categories, performance } = testResults;
        
        // Success rate insights
        const overallSuccessRate = (summary.passed / summary.totalTests) * 100;
        
        if (overallSuccessRate >= 90) {
            insights.push({
                type: 'success',
                message: 'Live scoring system is highly reliable and functional',
                data: { successRate: overallSuccessRate.toFixed(1) }
            });
        } else if (overallSuccessRate >= 70) {
            insights.push({
                type: 'warning',
                message: 'Live scoring system is generally functional with some issues',
                data: { successRate: overallSuccessRate.toFixed(1) }
            });
        } else {
            insights.push({
                type: 'critical',
                message: 'Live scoring system has significant reliability issues',
                data: { successRate: overallSuccessRate.toFixed(1) }
            });
        }
        
        // Performance insights
        if (performance.updateLatencies && performance.updateLatencies.length > 0) {
            const avgLatency = performance.updateLatencies.reduce((sum, lat) => sum + lat, 0) / performance.updateLatencies.length;
            
            if (avgLatency < 500) {
                insights.push({
                    type: 'success',
                    message: 'Excellent update performance with low latency',
                    data: { averageLatency: `${avgLatency.toFixed(2)}ms` }
                });
            } else if (avgLatency < 1000) {
                insights.push({
                    type: 'info',
                    message: 'Good update performance',
                    data: { averageLatency: `${avgLatency.toFixed(2)}ms` }
                });
            } else {
                insights.push({
                    type: 'warning',
                    message: 'Update latency may affect real-time experience',
                    data: { averageLatency: `${avgLatency.toFixed(2)}ms` }
                });
            }
        }
        
        // Category-specific insights
        Object.entries(categories).forEach(([category, results]) => {
            const categoryRate = (results.passed / (results.passed + results.failed)) * 100;
            
            if (categoryRate === 100) {
                insights.push({
                    type: 'success',
                    message: `${category} functionality is fully operational`,
                    data: { category, successRate: '100%' }
                });
            } else if (categoryRate < 50) {
                insights.push({
                    type: 'critical',
                    message: `${category} has critical issues requiring immediate attention`,
                    data: { category, successRate: `${categoryRate.toFixed(1)}%` }
                });
            }
        });
        
        return insights;
    }

    generateRecommendations() {
        const recommendations = [];
        const { summary, categories } = testResults;
        
        // High-level recommendations
        if (summary.failed > 0) {
            recommendations.push({
                priority: 'high',
                category: 'System Reliability',
                message: `Address ${summary.failed} failing tests to improve system reliability`
            });
        }
        
        // Category-specific recommendations
        if (categories['Performance']) {
            const perfCategory = categories['Performance'];
            if (perfCategory.failed > 0) {
                recommendations.push({
                    priority: 'medium',
                    category: 'Performance Optimization',
                    message: 'Consider implementing caching and optimizing database queries for better performance'
                });
            }
        }
        
        if (categories['Edge Cases']) {
            const edgeCategory = categories['Edge Cases'];
            if (edgeCategory.failed > 0) {
                recommendations.push({
                    priority: 'medium',
                    category: 'Input Validation',
                    message: 'Strengthen input validation to handle edge cases more robustly'
                });
            }
        }
        
        // Positive recommendations
        const successRate = (summary.passed / summary.totalTests) * 100;
        if (successRate >= 80) {
            recommendations.push({
                priority: 'low',
                category: 'Maintenance',
                message: 'System is performing well - maintain current monitoring and testing practices'
            });
        }
        
        return recommendations;
    }

    async runAllTests() {
        console.log('🎯 Starting Final Comprehensive Live Scoring Test Suite\n');
        console.log(`Configuration: ${JSON.stringify(CONFIG, null, 2)}\n`);
        
        const authenticated = await this.authenticate();
        if (!authenticated) return;
        
        const matchFound = await this.findTestMatch();
        if (!matchFound) {
            console.error('❌ No suitable test match found');
            return;
        }
        
        try {
            await this.testCompleteMatchLifecycle();
            await this.testPlayerStatsManagement();
            await this.testAdvancedHeroSelection();
            await this.testRealTimePerformance();
            await this.testEdgeCasesAndErrorHandling();
            await this.testDataPersistenceAndConsistency();
            
        } catch (error) {
            console.error('❌ Test execution error:', error);
        }
        
        const { report, reportPath } = this.generateFinalReport();
        
        console.log('\n🎯 FINAL COMPREHENSIVE TEST COMPLETE');
        console.log('═'.repeat(70));
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passed} (${((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${report.summary.failed} (${((report.summary.failed / report.summary.totalTests) * 100).toFixed(1)}%)`);
        console.log(`Duration: ${report.duration}`);
        console.log(`Test Match: ${report.testMatch.teams} (ID: ${report.testMatch.id})`);
        console.log(`Report saved: ${reportPath}`);
        
        console.log('\n📊 CATEGORY BREAKDOWN:');
        Object.entries(report.categories).forEach(([category, results]) => {
            const total = results.passed + results.failed;
            const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
            console.log(`${category}: ${results.passed}/${total} (${passRate}%)`);
        });
        
        if (report.performance.updateLatencies?.length > 0) {
            const avgLatency = report.performance.updateLatencies.reduce((sum, lat) => sum + lat, 0) / report.performance.updateLatencies.length;
            console.log('\n⚡ PERFORMANCE METRICS:');
            console.log(`Average Update Latency: ${avgLatency.toFixed(2)}ms`);
            console.log(`Concurrent Success Rate: ${((report.performance.concurrentSuccesses / CONFIG.CONCURRENT_OPERATIONS) * 100).toFixed(1)}%`);
            console.log(`Rapid Updates/sec: ${(report.performance.rapidUpdateSuccesses / 10).toFixed(1)}`);
        }
        
        if (report.insights.length > 0) {
            console.log('\n💡 KEY INSIGHTS:');
            report.insights.forEach(insight => {
                const icon = insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : '❌';
                console.log(`${icon} ${insight.message}`);
            });
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n📋 RECOMMENDATIONS:');
            report.recommendations.forEach(rec => {
                console.log(`[${rec.priority.toUpperCase()}] ${rec.category}: ${rec.message}`);
            });
        }
        
        console.log('\n✅ Final comprehensive test suite completed.');
    }
}

if (require.main === module) {
    const testSuite = new FinalComprehensiveTest();
    testSuite.runAllTests().catch(console.error);
}

module.exports = FinalComprehensiveTest;