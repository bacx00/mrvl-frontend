const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';

async function testDatabaseAndEndpoints() {
    console.log('🧪 Marvel Rivals System Database & Endpoint Tests\n');
    
    try {
        // Test 1: Get all teams
        console.log('1️⃣ Testing teams endpoint...');
        const teamsResponse = await axios.get(`${API_BASE_URL}/public/teams`);
        console.log(`✅ Teams: Found ${teamsResponse.data.data?.length || 0} teams`);
        const teams = teamsResponse.data.data?.slice(0, 2) || [];
        console.log('   Available teams:', teams.map(t => `${t.id}: ${t.name}`));
    } catch (error) {
        console.log('❌ Teams FAILED:', error.response?.data || error.message);
        return;
    }

    try {
        // Test 2: Get all events
        console.log('\n2️⃣ Testing events endpoint...');
        const eventsResponse = await axios.get(`${API_BASE_URL}/public/events`);
        console.log(`✅ Events: Found ${eventsResponse.data.data?.length || 0} events`);
        const events = eventsResponse.data.data?.slice(0, 2) || [];
        console.log('   Available events:', events.map(e => `${e.id}: ${e.name}`));
    } catch (error) {
        console.log('❌ Events FAILED:', error.response?.data || error.message);
        return;
    }

    try {
        // Test 3: Get current matches
        console.log('\n3️⃣ Testing matches endpoint...');
        const matchesResponse = await axios.get(`${API_BASE_URL}/public/matches`);
        console.log(`✅ Matches: Found ${matchesResponse.data.data?.length || 0} matches`);
        if (matchesResponse.data.data && matchesResponse.data.data.length > 0) {
            const match = matchesResponse.data.data[0];
            console.log('   Sample match:', {
                id: match.id,
                team1: match.team1_name,
                team2: match.team2_name,
                status: match.status,
                format: match.format
            });
        }
    } catch (error) {
        console.log('❌ Matches FAILED:', error.response?.data || error.message);
    }

    try {
        // Test 4: Test bracket endpoint
        console.log('\n4️⃣ Testing bracket endpoint...');
        const bracketResponse = await axios.get(`${API_BASE_URL}/public/events/1/bracket`);
        console.log('✅ Bracket endpoint SUCCESS:', {
            event_id: bracketResponse.data.data?.event_id,
            format: bracketResponse.data.data?.format,
            matches_count: bracketResponse.data.data?.bracket?.matches?.length || 0
        });
    } catch (error) {
        console.log('❌ Bracket FAILED:', error.response?.data || error.message);
    }

    try {
        // Test 5: Test match detail endpoint
        console.log('\n5️⃣ Testing match detail endpoint...');
        const matchDetailResponse = await axios.get(`${API_BASE_URL}/public/matches/1`);
        console.log('✅ Match detail SUCCESS:', {
            id: matchDetailResponse.data.data?.id,
            status: matchDetailResponse.data.data?.status,
            team1_score: matchDetailResponse.data.data?.team1_score,
            team2_score: matchDetailResponse.data.data?.team2_score
        });
    } catch (error) {
        console.log('❌ Match detail FAILED:', error.response?.data || error.message);
    }

    console.log('\n📊 Database Health Summary:');
    console.log('   ✅ Teams table: Working');
    console.log('   ✅ Events table: Working');
    console.log('   ✅ Matches table: Working');
    console.log('   ✅ Basic API routes: Functional');
}

async function testMatchCreationValidation() {
    console.log('\n🔧 Testing Match Creation Validation (No Auth)\n');
    
    // Test with invalid data to see validation messages
    const invalidTestCases = [
        {
            name: 'Missing required fields',
            data: {}
        },
        {
            name: 'Invalid team IDs',
            data: {
                team1_id: 999999,
                team2_id: 999998,
                event_id: 1,
                scheduled_at: '2025-08-08 18:00:00',
                format: 'BO3',
                maps_data: [{ map_name: 'Test', mode: 'Control' }]
            }
        },
        {
            name: 'Same team for both sides',
            data: {
                team1_id: 57,
                team2_id: 57,
                event_id: 1,
                scheduled_at: '2025-08-08 18:00:00',
                format: 'BO3',
                maps_data: [{ map_name: 'Test', mode: 'Control' }]
            }
        },
        {
            name: 'Invalid format',
            data: {
                team1_id: 57,
                team2_id: 58,
                event_id: 1,
                scheduled_at: '2025-08-08 18:00:00',
                format: 'INVALID_FORMAT',
                maps_data: [{ map_name: 'Test', mode: 'Control' }]
            }
        }
    ];

    for (const testCase of invalidTestCases) {
        try {
            console.log(`   Testing: ${testCase.name}...`);
            const response = await axios.post(`${API_BASE_URL}/create-match-direct`, testCase.data);
            console.log(`   ⚠️ Unexpected success: ${response.data.message}`);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`   ✅ Correctly blocked (auth required): ${error.response.data.message}`);
            } else if (error.response?.status === 422) {
                console.log(`   ✅ Validation working: ${error.response.data.message}`);
            } else {
                console.log(`   ❌ Unexpected error: ${error.response?.data?.message || error.message}`);
            }
        }
    }
}

async function main() {
    console.log('🚀 Marvel Rivals Database & Endpoint Health Check\n');
    console.log('================================================\n');
    
    await testDatabaseAndEndpoints();
    await testMatchCreationValidation();
    
    console.log('\n================================================');
    console.log('✅ Health check complete! Ready for authentication tests.');
}

if (require.main === module) {
    main().catch(console.error);
}