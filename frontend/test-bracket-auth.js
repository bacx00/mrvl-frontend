// Test script to generate bracket with authentication
const axios = require('axios');

async function testBracketWithAuth() {
    const apiUrl = 'https://staging.mrvl.net/api';
    const eventId = 8;
    
    try {
        // Step 1: Login
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
            email: 'jhonny@ar-mediia.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful!');
        
        // Create axios instance with auth token
        const authApi = axios.create({
            baseURL: apiUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Step 2: Get event details
        console.log('\n📋 Fetching event details...');
        const eventResponse = await authApi.get(`/events/${eventId}`);
        const event = eventResponse.data.data;
        console.log('Event:', event.name);
        console.log('Format:', event.format);
        console.log('Teams:', event.teams?.length || 0);
        
        // Step 3: Generate bracket
        console.log('\n🏗️ Generating bracket...');
        const generateResponse = await authApi.post(
            `/admin/events/${eventId}/generate-bracket`,
            {
                seeding_type: 'rating',
                best_of: 3,
                third_place_match: true
            }
        );
        
        console.log('✅ Bracket generated:', generateResponse.data.message);
        
        // Step 4: Fetch updated bracket
        console.log('\n📊 Fetching bracket data...');
        const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const bracketData = bracketResponse.data.data;
        
        console.log('\n🏆 Bracket Details:');
        console.log('Type:', bracketData.bracket.type);
        console.log('Total Rounds:', bracketData.bracket.rounds?.length || 0);
        
        if (bracketData.bracket.rounds) {
            bracketData.bracket.rounds.forEach(round => {
                console.log(`\n📌 ${round.name} (Round ${round.round}):`);
                round.matches.forEach((match, idx) => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`  Match ${idx + 1}: ${team1} vs ${team2}`);
                });
            });
        }
        
        // Step 5: Test match update
        if (bracketData.bracket.rounds?.length > 0) {
            const firstMatch = bracketData.bracket.rounds[0].matches[0];
            if (firstMatch && firstMatch.team1 && firstMatch.team2) {
                console.log('\n🎮 Testing match update...');
                console.log(`Updating match: ${firstMatch.team1.name} vs ${firstMatch.team2.name}`);
                
                const updateResponse = await authApi.put(
                    `/admin/events/${eventId}/bracket/matches/${firstMatch.id}`,
                    {
                        team1_score: 2,
                        team2_score: 1,
                        status: 'completed'
                    }
                );
                
                console.log('✅ Match updated:', updateResponse.data.message);
                
                // Check if winner advanced
                const updatedBracket = await authApi.get(`/events/${eventId}/bracket`);
                console.log('\n🔄 Checking bracket progression...');
                if (updatedBracket.data.data.bracket.rounds.length > 1) {
                    const nextRound = updatedBracket.data.data.bracket.rounds[1];
                    console.log('Next round matches:');
                    nextRound.matches.forEach((match, idx) => {
                        const team1 = match.team1?.name || 'TBD';
                        const team2 = match.team2?.name || 'TBD';
                        console.log(`  Match ${idx + 1}: ${team1} vs ${team2}`);
                    });
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status === 422) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

// Run the test
testBracketWithAuth();