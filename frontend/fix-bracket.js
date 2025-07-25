// Fix bracket generation
const axios = require('axios');

async function fixBracket() {
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
        
        console.log('🧹 Clearing existing bracket...');
        // First, let's check if there's a reset endpoint
        try {
            await authApi.post(`/admin/events/${eventId}/reset-bracket`);
            console.log('✅ Bracket reset');
        } catch (e) {
            console.log('⚠️ No reset endpoint, proceeding with regeneration');
        }
        
        // Update event to ensure format is set
        console.log('\n📝 Setting event format...');
        try {
            await authApi.put(`/admin/events/${eventId}`, {
                format: 'single_elimination'
            });
            console.log('✅ Event format updated');
        } catch (e) {
            console.log('⚠️ Could not update event format directly');
        }
        
        // Generate new bracket with proper settings
        console.log('\n🏗️ Generating proper bracket...');
        const generateResponse = await authApi.post(
            `/admin/events/${eventId}/generate-bracket`,
            {
                seeding_type: 'rating',
                best_of: 3,
                third_place_match: false,
                include_third_place: false
            }
        );
        
        console.log('✅ Bracket generated:', generateResponse.data.message);
        
        // Fetch the properly generated bracket
        console.log('\n📊 Fetching new bracket structure...');
        const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const bracket = bracketResponse.data.data.bracket;
        
        console.log('\nBracket Details:');
        console.log('Type:', bracket.type);
        console.log('Total Rounds:', bracket.rounds?.length || 0);
        
        if (bracket.rounds) {
            bracket.rounds.forEach(round => {
                console.log(`\n${round.name} (Round ${round.round}):`);
                round.matches.forEach(match => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`  Match ${match.id}: ${team1} (seed ${match.team1?.seed}) vs ${team2} (seed ${match.team2?.seed})`);
                });
            });
        }
        
        // Now test match update with the first match
        if (bracket.rounds && bracket.rounds.length > 0) {
            const firstRound = bracket.rounds[0];
            const firstMatch = firstRound.matches[0];
            
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
                console.log('Response:', updateResponse.data.message);
                
                // Check if winner advanced
                console.log('\n🔄 Checking bracket progression...');
                const progressionResponse = await authApi.get(`/events/${eventId}/bracket`);
                const progressedBracket = progressionResponse.data.data.bracket;
                
                if (progressedBracket.rounds.length > 1) {
                    const secondRound = progressedBracket.rounds[1];
                    console.log(`\n${secondRound.name}:`);
                    secondRound.matches.forEach(match => {
                        const team1 = match.team1?.name || 'TBD';
                        const team2 = match.team2?.name || 'TBD';
                        console.log(`  Match ${match.id}: ${team1} vs ${team2}`);
                    });
                }
                
            } catch (updateError) {
                console.error('❌ Match update failed:', updateError.response?.data);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

fixBracket();