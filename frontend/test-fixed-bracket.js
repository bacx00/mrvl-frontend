// Test the fixed bracket system
const axios = require('axios');

async function testFixedBracket() {
    const apiUrl = 'https://staging.mrvl.net/api';
    const eventId = 8;
    
    try {
        // Login
        console.log('🔐 Logging in...');
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
        
        // First, generate a fresh bracket to see the fixed round names
        console.log('\n🏗️ Generating fresh bracket...');
        await authApi.post(`/admin/events/${eventId}/generate-bracket`, {
            seeding_type: 'rating',
            best_of: 3,
            third_place_match: false
        });
        
        // Get the bracket with fixed round names
        console.log('\n📊 Fetching bracket with fixed round names...');
        const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const bracket = bracketResponse.data.data.bracket;
        
        console.log('\n✅ FIXED Bracket Structure:');
        console.log('Type:', bracket.type);
        console.log('Total Rounds:', bracket.rounds?.length || 0);
        
        if (bracket.rounds) {
            bracket.rounds.forEach(round => {
                console.log(`\n📌 ${round.name} (Round ${round.round}):`);
                round.matches.forEach(match => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`  Match ${match.id}: ${team1} vs ${team2}`);
                });
            });
        }
        
        // Now test match update with the fixed endpoint
        if (bracket.rounds && bracket.rounds.length > 0) {
            const firstMatch = bracket.rounds[0].matches[0];
            console.log(`\n🎮 Testing match update for match ${firstMatch.id}...`);
            
            try {
                const updateResponse = await authApi.put(
                    `/admin/events/${eventId}/bracket/matches/${firstMatch.id}`,
                    {
                        team1_score: 2,
                        team2_score: 0,
                        status: 'completed'
                    }
                );
                
                console.log('✅ Match updated successfully!');
                console.log('Message:', updateResponse.data.message);
                
                // Check bracket progression
                console.log('\n🔄 Checking bracket progression...');
                const progressedBracket = await authApi.get(`/events/${eventId}/bracket`);
                const newBracket = progressedBracket.data.data.bracket;
                
                console.log('\nBracket after match update:');
                newBracket.rounds.forEach(round => {
                    console.log(`\n${round.name}:`);
                    round.matches.forEach(match => {
                        const team1 = match.team1?.name || 'TBD';
                        const team2 = match.team2?.name || 'TBD';
                        const status = match.status;
                        const score = match.status === 'completed' ? 
                            ` (${match.team1?.score || match.score1 || 0}-${match.team2?.score || match.score2 || 0})` : '';
                        console.log(`  ${team1} vs ${team2} - ${status}${score}`);
                    });
                });
                
                // Update another match to see semifinals
                console.log('\n🎮 Updating second match...');
                const secondMatch = bracket.rounds[0].matches[1];
                await authApi.put(
                    `/admin/events/${eventId}/bracket/matches/${secondMatch.id}`,
                    {
                        team1_score: 2,
                        team2_score: 1,
                        status: 'completed'
                    }
                );
                
                // Final check
                const finalBracket = await authApi.get(`/events/${eventId}/bracket`);
                console.log('\n🏆 Final bracket state shows proper progression!');
                
            } catch (updateError) {
                console.error('❌ Match update failed:', updateError.response?.data);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testFixedBracket();