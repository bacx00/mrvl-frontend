#!/usr/bin/env node

/**
 * 🔍 DIAGNOSTIC TEST FOR LIVE SCORING SYSTEM
 * Deep dive into what endpoints work and what data formats are expected
 */

const axios = require('axios');

const CONFIG = {
    API_URL: 'https://staging.mrvl.net/api',
    TEST_ADMIN_EMAIL: 'jhonny@ar-mediia.com',
    TEST_ADMIN_PASSWORD: 'password123'
};

class DiagnosticTest {
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
                console.log(`✅ Using match ${this.testMatch.id}: ${this.testMatch.team1?.name} vs ${this.testMatch.team2?.name}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error finding test match:', error.message);
            return false;
        }
    }

    async examineCurrentMatchData() {
        console.log('\n📊 Examining current match data structure...');
        
        try {
            // Get current match details
            const response = await this.api.get(`/matches/${this.testMatch.id}`);
            const match = response.data.data || response.data;
            
            console.log('Match basic info:', {
                id: match.id,
                status: match.status,
                format: match.format,
                team1_id: match.team1_id,
                team2_id: match.team2_id,
                current_map: match.current_map,
                series_score_team1: match.series_score_team1,
                series_score_team2: match.series_score_team2
            });
            
            // Check if maps_data exists and examine its structure
            if (match.maps_data) {
                console.log('\n📝 Maps data structure:');
                try {
                    const mapsData = JSON.parse(match.maps_data);
                    console.log(`Total maps: ${mapsData.length}`);
                    mapsData.forEach((map, index) => {
                        console.log(`Map ${index + 1}:`, {
                            map_number: map.map_number,
                            map_name: map.map_name,
                            mode: map.mode,
                            team1_score: map.team1_score,
                            team2_score: map.team2_score,
                            status: map.status,
                            team1_composition_count: map.team1_composition?.length || 0,
                            team2_composition_count: map.team2_composition?.length || 0
                        });
                    });
                } catch (parseError) {
                    console.log('❌ Could not parse maps_data:', parseError.message);
                    console.log('Raw maps_data:', match.maps_data);
                }
            } else {
                console.log('❌ No maps_data found');
            }
            
            // Try to get live scoreboard
            console.log('\n🏆 Checking live scoreboard endpoint...');
            try {
                const scoreboardResponse = await this.api.get(`/matches/${this.testMatch.id}/live-scoreboard`);
                console.log('✅ Live scoreboard accessible');
                console.log('Scoreboard structure keys:', Object.keys(scoreboardResponse.data));
            } catch (scoreboardError) {
                console.log('❌ Live scoreboard error:', scoreboardError.response?.status, scoreboardError.message);
            }
            
        } catch (error) {
            console.error('❌ Error examining match data:', error.message);
        }
    }

    async testDifferentScoringEndpoints() {
        console.log('\n🎯 Testing different scoring endpoints...');
        
        const matchId = this.testMatch.id;
        
        // Test endpoint 1: simple-scoring (current approach)
        console.log('\n1️⃣ Testing /admin/matches/{id}/simple-scoring');
        try {
            const simplePayload = {
                status: 'live',
                team1_score: 0,
                team2_score: 0,
                current_map: 1,
                maps: [{
                    map_number: 1,
                    map_name: 'Tokyo 2099: Shibuya Sky',
                    mode: 'Domination',
                    team1_score: 1,
                    team2_score: 0,
                    status: 'ongoing'
                }]
            };
            
            console.log('Payload:', JSON.stringify(simplePayload, null, 2));
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, simplePayload);
            console.log('✅ simple-scoring SUCCESS:', response.status);
            console.log('Response:', response.data);
            
        } catch (error) {
            console.log('❌ simple-scoring FAILED:', error.response?.status);
            console.log('Error data:', error.response?.data);
            console.log('Error message:', error.message);
        }
        
        // Test endpoint 2: live-control
        console.log('\n2️⃣ Testing /admin/matches/{id}/live-control');
        try {
            const controlPayload = {
                action: 'update_score',
                team1_score: 1,
                team2_score: 0,
                current_map: 1
            };
            
            console.log('Payload:', JSON.stringify(controlPayload, null, 2));
            const response = await this.api.put(`/admin/matches/${matchId}/live-control`, controlPayload);
            console.log('✅ live-control SUCCESS:', response.status);
            console.log('Response:', response.data);
            
        } catch (error) {
            console.log('❌ live-control FAILED:', error.response?.status);
            console.log('Error data:', error.response?.data);
            console.log('Error message:', error.message);
        }
        
        // Test endpoint 3: bulk-player-stats
        console.log('\n3️⃣ Testing /admin/matches/{id}/bulk-player-stats');
        try {
            const statsPayload = {
                round_id: 1,
                player_stats: [{
                    player_id: 1,
                    eliminations: 5,
                    deaths: 2,
                    assists: 3,
                    damage: 2500,
                    healing: 0,
                    damage_blocked: 0,
                    hero_played: 'Spider-Man',
                    role_played: 'Duelist'
                }]
            };
            
            console.log('Payload:', JSON.stringify(statsPayload, null, 2));
            const response = await this.api.put(`/admin/matches/${matchId}/bulk-player-stats`, statsPayload);
            console.log('✅ bulk-player-stats SUCCESS:', response.status);
            console.log('Response:', response.data);
            
        } catch (error) {
            console.log('❌ bulk-player-stats FAILED:', error.response?.status);
            console.log('Error data:', error.response?.data);
            console.log('Error message:', error.message);
        }
        
        // Test endpoint 4: Basic match update
        console.log('\n4️⃣ Testing /admin/matches/{id} (PUT)');
        try {
            const updatePayload = {
                status: 'live',
                team1_score: 1,
                team2_score: 0,
                current_map: 1
            };
            
            console.log('Payload:', JSON.stringify(updatePayload, null, 2));
            const response = await this.api.put(`/admin/matches/${matchId}`, updatePayload);
            console.log('✅ match update SUCCESS:', response.status);
            console.log('Response:', response.data);
            
        } catch (error) {
            console.log('❌ match update FAILED:', error.response?.status);
            console.log('Error data:', error.response?.data);
            console.log('Error message:', error.message);
        }
    }

    async testMinimalPayloads() {
        console.log('\n🔬 Testing minimal payloads to isolate issues...');
        
        const matchId = this.testMatch.id;
        
        // Test 1: Absolute minimal payload
        console.log('\n1️⃣ Testing absolute minimal payload');
        try {
            const minimalPayload = {
                status: 'live'
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, minimalPayload);
            console.log('✅ Minimal payload SUCCESS:', response.status);
            
        } catch (error) {
            console.log('❌ Minimal payload FAILED:', error.response?.status);
            console.log('Error:', error.response?.data || error.message);
        }
        
        // Test 2: Add team scores
        console.log('\n2️⃣ Testing with team scores only');
        try {
            const scoresPayload = {
                status: 'live',
                team1_score: 0,
                team2_score: 0
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, scoresPayload);
            console.log('✅ Scores only SUCCESS:', response.status);
            
        } catch (error) {
            console.log('❌ Scores only FAILED:', error.response?.status);
            console.log('Error:', error.response?.data || error.message);
        }
        
        // Test 3: Add current map
        console.log('\n3️⃣ Testing with current map');
        try {
            const mapPayload = {
                status: 'live',
                team1_score: 0,
                team2_score: 0,
                current_map: 1
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, mapPayload);
            console.log('✅ With current map SUCCESS:', response.status);
            
        } catch (error) {
            console.log('❌ With current map FAILED:', error.response?.status);
            console.log('Error:', error.response?.data || error.message);
        }
        
        // Test 4: Add empty maps array
        console.log('\n4️⃣ Testing with empty maps array');
        try {
            const emptyMapsPayload = {
                status: 'live',
                team1_score: 0,
                team2_score: 0,
                current_map: 1,
                maps: []
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, emptyMapsPayload);
            console.log('✅ Empty maps array SUCCESS:', response.status);
            
        } catch (error) {
            console.log('❌ Empty maps array FAILED:', error.response?.status);
            console.log('Error:', error.response?.data || error.message);
        }
        
        // Test 5: Add single minimal map
        console.log('\n5️⃣ Testing with single minimal map');
        try {
            const singleMapPayload = {
                status: 'live',
                current_map: 1,
                maps: [{
                    map_number: 1
                }]
            };
            
            const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, singleMapPayload);
            console.log('✅ Single minimal map SUCCESS:', response.status);
            
        } catch (error) {
            console.log('❌ Single minimal map FAILED:', error.response?.status);
            console.log('Error:', error.response?.data || error.message);
        }
    }

    async testStatusUpdates() {
        console.log('\n🔄 Testing status updates only...');
        
        const matchId = this.testMatch.id;
        const currentStatus = this.testMatch.status;
        
        const statusTests = [
            { status: 'live', description: 'Set to live' },
            { status: 'paused', description: 'Pause match' },
            { status: 'live', description: 'Resume match' }
        ];
        
        for (const statusTest of statusTests) {
            try {
                console.log(`\n📍 ${statusTest.description}`);
                
                // Try the control endpoint first
                try {
                    const controlResponse = await this.api.post(`/admin/matches/${matchId}/control`, {
                        action: statusTest.status === 'live' ? 'start' : statusTest.status
                    });
                    console.log('✅ Control endpoint SUCCESS:', controlResponse.status);
                    continue;
                } catch (controlError) {
                    console.log('❌ Control endpoint failed, trying simple-scoring...');
                }
                
                // Fallback to simple-scoring
                const response = await this.api.post(`/admin/matches/${matchId}/simple-scoring`, {
                    status: statusTest.status
                });
                console.log('✅ Simple-scoring status SUCCESS:', response.status);
                
            } catch (error) {
                console.log('❌ Status update FAILED:', error.response?.status);
                console.log('Error:', error.response?.data || error.message);
            }
        }
    }

    async run() {
        console.log('🔍 Starting Diagnostic Test Suite\n');
        
        const authenticated = await this.authenticate();
        if (!authenticated) return;
        
        const matchFound = await this.findTestMatch();
        if (!matchFound) {
            console.error('❌ No suitable test match found');
            return;
        }
        
        await this.examineCurrentMatchData();
        await this.testDifferentScoringEndpoints();
        await this.testMinimalPayloads();
        await this.testStatusUpdates();
        
        console.log('\n✅ Diagnostic tests completed');
    }
}

// Run if called directly
if (require.main === module) {
    const diagnostics = new DiagnosticTest();
    diagnostics.run().catch(console.error);
}

module.exports = DiagnosticTest;