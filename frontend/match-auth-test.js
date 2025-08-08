const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';

// Test credentials
const testUser = {
    email: 'testadmin@test.com',
    password: 'testpass123'
};

let authToken = null;

const testMatchData = {
    team1_id: 57,  // Using actual team ID from the API response
    team2_id: 58,  // Assuming there's a second team
    event_id: 1,   // Using actual event ID
    scheduled_at: '2025-08-08 18:00:00',
    format: 'BO3',
    maps_data: [
        {
            map_name: 'Lijang Tower',
            mode: 'Control'
        },
        {
            map_name: 'Gibraltar', 
            mode: 'Escort'
        },
        {
            map_name: 'King\'s Row',
            mode: 'Hybrid'
        }
    ],
    stream_urls: ['https://twitch.tv/example'],
    betting_urls: [],
    vod_urls: [],
    round: 'Quarterfinals',
    bracket_position: '1',
    allow_past_date: true  // Allow past date for testing
};

async function login() {
    try {
        console.log('🔐 Attempting to log in...');
        const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
        
        if (response.data.success && response.data.token) {
            authToken = response.data.token;
            console.log('✅ Login successful');
            return true;
        } else {
            console.log('❌ Login failed - no token in response:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

async function createTestUser() {
    try {
        console.log('👤 Creating test admin user...');
        const userData = {
            name: 'Test Admin',
            email: testUser.email,
            password: testUser.password,
            password_confirmation: testUser.password
        };
        
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
        console.log('✅ User created successfully:', response.data.message);
        return true;
    } catch (error) {
        if (error.response?.status === 422 && error.response?.data?.message?.includes('email')) {
            console.log('✅ User already exists, continuing...');
            return true;
        }
        console.log('❌ User creation failed:', error.response?.data || error.message);
        return false;
    }
}

async function getAvailableTeams() {
    try {
        const response = await axios.get(`${API_BASE_URL}/public/teams`);
        const teams = response.data.data || [];
        if (teams.length >= 2) {
            return [teams[0].id, teams[1].id];
        }
        return [null, null];
    } catch (error) {
        console.log('❌ Failed to get teams:', error.message);
        return [null, null];
    }
}

async function testAuthenticatedMatchCreation() {
    if (!authToken) {
        console.log('❌ No auth token available');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    // Get available team IDs
    const [team1_id, team2_id] = await getAvailableTeams();
    if (!team1_id || !team2_id) {
        console.log('❌ Need at least 2 teams in database');
        return;
    }

    const matchData = { ...testMatchData, team1_id, team2_id };

    try {
        console.log('\n1️⃣ Testing authenticated direct match creation...');
        const directResponse = await axios.post(
            `${API_BASE_URL}/create-match-direct`,
            matchData,
            { headers }
        );
        console.log('✅ Direct match creation SUCCESS:', directResponse.data);
    } catch (error) {
        console.log('❌ Direct match creation FAILED:', error.response?.data || error.message);
    }

    try {
        console.log('\n2️⃣ Testing authenticated admin match creation...');
        const adminResponse = await axios.post(
            `${API_BASE_URL}/admin/matches`,
            matchData,
            { headers }
        );
        console.log('✅ Admin match creation SUCCESS:', adminResponse.data);
    } catch (error) {
        console.log('❌ Admin match creation FAILED:', error.response?.data || error.message);
    }

    try {
        console.log('\n3️⃣ Testing match update...');
        // First create a match to update
        const createResponse = await axios.post(
            `${API_BASE_URL}/create-match-direct`,
            matchData,
            { headers }
        );
        
        if (createResponse.data.success && createResponse.data.data.id) {
            const matchId = createResponse.data.data.id;
            const updateData = {
                ...matchData,
                format: 'BO5',
                round: 'Semifinals'
            };
            
            const updateResponse = await axios.put(
                `${API_BASE_URL}/admin/matches/${matchId}`,
                updateData,
                { headers }
            );
            console.log('✅ Match update SUCCESS:', updateResponse.data);
        }
    } catch (error) {
        console.log('❌ Match update FAILED:', error.response?.data || error.message);
    }

    try {
        console.log('\n4️⃣ Testing live scoring update...');
        // Get first match for live scoring test
        const matchesResponse = await axios.get(`${API_BASE_URL}/public/matches`);
        const matches = matchesResponse.data.data;
        
        if (matches && matches.length > 0) {
            const matchId = matches[0].id;
            const liveScoreData = {
                team1_score: 1,
                team2_score: 0,
                status: 'live'
            };
            
            const liveResponse = await axios.post(
                `${API_BASE_URL}/admin/matches/${matchId}/update-score`,
                liveScoreData,
                { headers }
            );
            console.log('✅ Live scoring update SUCCESS:', liveResponse.data);
        } else {
            console.log('⚠️ No matches available for live scoring test');
        }
    } catch (error) {
        console.log('❌ Live scoring update FAILED:', error.response?.data || error.message);
    }
}

async function testBracketGeneration() {
    if (!authToken) return;
    
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log('\n5️⃣ Testing bracket generation...');
        const bracketData = {
            format: 'single_elimination',
            seeding_method: 'rating',
            randomize_seeds: false
        };
        
        const bracketResponse = await axios.post(
            `${API_BASE_URL}/admin/events/1/generate-bracket`,
            bracketData,
            { headers }
        );
        console.log('✅ Bracket generation SUCCESS:', bracketResponse.data);
    } catch (error) {
        console.log('❌ Bracket generation FAILED:', error.response?.data || error.message);
    }

    try {
        console.log('\n6️⃣ Testing bracket visualization...');
        const bracketViewResponse = await axios.get(
            `${API_BASE_URL}/public/events/1/bracket`
        );
        console.log('✅ Bracket visualization SUCCESS: Found', 
                   bracketViewResponse.data.data?.bracket?.matches?.length || 0, 'matches');
    } catch (error) {
        console.log('❌ Bracket visualization FAILED:', error.response?.data || error.message);
    }
}

async function main() {
    console.log('🚀 Marvel Rivals Match System Test\n');
    
    // Try to create user first
    await createTestUser();
    
    // Try to login
    const loginSuccess = await login();
    
    if (loginSuccess) {
        await testAuthenticatedMatchCreation();
        await testBracketGeneration();
    } else {
        console.log('\n❌ Cannot proceed without authentication');
    }
}

if (require.main === module) {
    main().catch(console.error);
}