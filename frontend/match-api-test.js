const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';

// Test data for match creation
const testMatchData = {
    team1_id: 1,
    team2_id: 2,
    event_id: 1,
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
    allow_past_date: false
};

async function testMatchCreation() {
    console.log('🧪 Testing Match Creation API...\n');
    
    try {
        // Test 1: Direct match creation (no auth)
        console.log('1️⃣ Testing direct match creation...');
        const directResponse = await axios.post(
            `${API_BASE_URL}/create-match-direct`,
            testMatchData
        );
        console.log('✅ Direct match creation SUCCESS:', directResponse.data);
    } catch (error) {
        console.log('❌ Direct match creation FAILED:', error.response?.data || error.message);
    }

    try {
        // Test 2: Admin match creation (requires auth)
        console.log('\n2️⃣ Testing admin match creation (no auth)...');
        const adminResponse = await axios.post(
            `${API_BASE_URL}/admin/matches`,
            testMatchData
        );
        console.log('✅ Admin match creation SUCCESS:', adminResponse.data);
    } catch (error) {
        console.log('❌ Admin match creation FAILED:', error.response?.data || error.message);
    }
    
    try {
        // Test 3: Get matches list
        console.log('\n3️⃣ Testing matches list...');
        const listResponse = await axios.get(`${API_BASE_URL}/public/matches`);
        console.log(`✅ Matches list SUCCESS: Found ${listResponse.data.data?.length || 0} matches`);
    } catch (error) {
        console.log('❌ Matches list FAILED:', error.response?.data || error.message);
    }

    try {
        // Test 4: Test with missing required field
        console.log('\n4️⃣ Testing validation (missing team2_id)...');
        const invalidData = { ...testMatchData };
        delete invalidData.team2_id;
        
        const validationResponse = await axios.post(
            `${API_BASE_URL}/create-match-direct`,
            invalidData
        );
        console.log('⚠️ Validation test unexpected success:', validationResponse.data);
    } catch (error) {
        console.log('✅ Validation working correctly:', error.response?.data?.message || error.message);
    }
}

async function testDatabase() {
    console.log('\n🗄️ Testing Database Structure...\n');
    
    try {
        // Test if we can get teams
        console.log('5️⃣ Testing teams endpoint...');
        const teamsResponse = await axios.get(`${API_BASE_URL}/public/teams`);
        console.log(`✅ Teams endpoint SUCCESS: Found ${teamsResponse.data.data?.length || 0} teams`);
        if (teamsResponse.data.data && teamsResponse.data.data.length > 0) {
            console.log('Sample team:', teamsResponse.data.data[0]);
        }
    } catch (error) {
        console.log('❌ Teams endpoint FAILED:', error.response?.data || error.message);
    }
    
    try {
        // Test if we can get events
        console.log('\n6️⃣ Testing events endpoint...');
        const eventsResponse = await axios.get(`${API_BASE_URL}/public/events`);
        console.log(`✅ Events endpoint SUCCESS: Found ${eventsResponse.data.data?.length || 0} events`);
        if (eventsResponse.data.data && eventsResponse.data.data.length > 0) {
            console.log('Sample event:', eventsResponse.data.data[0]);
        }
    } catch (error) {
        console.log('❌ Events endpoint FAILED:', error.response?.data || error.message);
    }
}

async function main() {
    await testDatabase();
    await testMatchCreation();
}

if (require.main === module) {
    main().catch(console.error);
}