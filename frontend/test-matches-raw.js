// Get raw matches data
const axios = require('axios');

async function testMatchesRaw() {
    const apiUrl = 'https://staging.mrvl.net/api';
    const eventId = 8;
    
    try {
        // Login
        const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
            email: 'jhonny@ar-mediia.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        const authApi = axios.create({
            baseURL: apiUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Get raw matches
        console.log('📋 Getting raw matches from database...');
        const matchesResponse = await authApi.get(`/matches?event_id=${eventId}`);
        const matches = matchesResponse.data.data;
        
        console.log('\nTotal matches:', matches.length);
        matches.forEach(match => {
            console.log(`\nMatch ID: ${match.id}`);
            console.log(`  Event ID: ${match.event_id}`);
            console.log(`  Round: ${match.round}`);
            console.log(`  Position: ${match.bracket_position}`);
            console.log(`  Status: ${match.status}`);
            console.log(`  Team 1: ${match.team1?.name || 'None'} (ID: ${match.team1_id})`);
            console.log(`  Team 2: ${match.team2?.name || 'None'} (ID: ${match.team2_id})`);
            console.log(`  Score: ${match.team1_score || 0} - ${match.team2_score || 0}`);
        });
        
        // Try to update using the actual match structure
        if (matches.length > 0) {
            const firstMatch = matches[0];
            console.log(`\n🎮 Attempting to update match ${firstMatch.id}...`);
            
            try {
                const updateResponse = await authApi.put(
                    `/admin/events/${eventId}/bracket/matches/${firstMatch.id}`,
                    {
                        team1_score: 3,
                        team2_score: 1,
                        status: 'completed'
                    }
                );
                console.log('✅ Update response:', updateResponse.data);
            } catch (updateError) {
                console.log('❌ Update failed:', updateError.response?.data);
                
                // Try alternative update endpoint
                console.log('\n🔄 Trying alternative match update...');
                try {
                    const altUpdateResponse = await authApi.put(
                        `/matches/${firstMatch.id}`,
                        {
                            team1_score: 3,
                            team2_score: 1,
                            status: 'completed',
                            winner_id: firstMatch.team1_id
                        }
                    );
                    console.log('✅ Alternative update succeeded:', altUpdateResponse.data);
                } catch (altError) {
                    console.log('❌ Alternative update also failed:', altError.response?.data);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testMatchesRaw();