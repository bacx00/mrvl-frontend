// Test complete tournament flow from start to finish
const axios = require('axios');

async function testCompleteTournament() {
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
        
        // Generate fresh bracket
        console.log('\n🏗️ Generating fresh single elimination bracket...');
        await authApi.post(`/admin/events/${eventId}/generate-bracket`, {
            seeding_type: 'rating',
            best_of: 3,
            third_place_match: true  // Enable third place match
        });
        
        // Play through the entire tournament
        let continuePlayoff = true;
        let roundNumber = 1;
        
        while (continuePlayoff) {
            // Get current bracket state
            const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
            const bracket = bracketResponse.data.data.bracket;
            
            // Find matches to play in current round
            const currentRoundMatches = [];
            bracket.rounds.forEach(round => {
                round.matches.forEach(match => {
                    if (match.status === 'upcoming' && match.team1 && match.team2) {
                        currentRoundMatches.push({...match, roundName: round.name});
                    }
                });
            });
            
            if (currentRoundMatches.length === 0) {
                continuePlayoff = false;
                console.log('\n🏆 Tournament Complete!');
                break;
            }
            
            console.log(`\n🎮 Playing ${currentRoundMatches[0].roundName}...`);
            
            // Play all matches in current round
            for (const match of currentRoundMatches) {
                const score1 = Math.random() > 0.5 ? 2 : Math.floor(Math.random() * 2);
                const score2 = score1 === 2 ? Math.floor(Math.random() * 2) : 2;
                
                await authApi.put(`/admin/events/${eventId}/bracket/matches/${match.id}`, {
                    team1_score: score1,
                    team2_score: score2,
                    status: 'completed'
                });
                
                const winner = score1 > score2 ? match.team1 : match.team2;
                const loser = score1 > score2 ? match.team2 : match.team1;
                console.log(`  ✅ ${winner.name} defeats ${loser.name} (${score1}-${score2})`);
            }
            
            roundNumber++;
        }
        
        // Get final bracket state
        const finalBracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const finalBracket = finalBracketResponse.data.data.bracket;
        
        console.log('\n📊 Final Tournament Results:');
        finalBracket.rounds.forEach(round => {
            console.log(`\n${round.name}:`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                if (match.status === 'completed') {
                    const score1 = match.team1_score || match.team1?.score || 0;
                    const score2 = match.team2_score || match.team2?.score || 0;
                    const winner = score1 > score2 ? team1 : team2;
                    console.log(`  ${team1} vs ${team2} (${score1}-${score2}) - Winner: ${winner}`);
                } else {
                    console.log(`  ${team1} vs ${team2} - ${match.status}`);
                }
            });
        });
        
        // Check for third place match
        const thirdPlaceRound = finalBracket.rounds.find(r => r.name.includes('Third Place'));
        if (thirdPlaceRound) {
            console.log('\n🥉 Third Place Match found and played!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

testCompleteTournament();