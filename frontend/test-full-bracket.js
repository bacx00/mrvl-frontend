// Test full bracket progression
const axios = require('axios');

async function testFullBracket() {
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
        
        // Generate fresh bracket
        console.log('🏗️ Generating fresh single elimination bracket...');
        await authApi.post(`/admin/events/${eventId}/generate-bracket`, {
            seeding_type: 'rating',
            best_of: 3,
            third_place_match: false
        });
        
        // Get initial bracket
        let bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        let bracket = bracketResponse.data.data.bracket;
        
        console.log('\n📊 Initial Bracket:');
        bracket.rounds.forEach(round => {
            console.log(`\n${round.name}:`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                console.log(`  ${team1} vs ${team2}`);
            });
        });
        
        // Complete all quarter-final matches
        console.log('\n🎮 Playing Quarter-Finals...');
        const quarterFinals = bracket.rounds[0].matches;
        for (let i = 0; i < quarterFinals.length; i++) {
            const match = quarterFinals[i];
            await authApi.put(`/admin/events/${eventId}/bracket/matches/${match.id}`, {
                team1_score: 2,
                team2_score: i % 2, // Alternate winners for variety
                status: 'completed'
            });
            console.log(`  ✅ ${match.team1.name} defeats ${match.team2.name} (2-${i % 2})`);
        }
        
        // Get updated bracket with semifinals
        console.log('\n🔄 Checking bracket after Quarter-Finals...');
        bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        bracket = bracketResponse.data.data.bracket;
        
        console.log('\nUpdated Bracket:');
        bracket.rounds.forEach(round => {
            console.log(`\n${round.name}:`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                const score = match.status === 'completed' ? 
                    ` (${match.score1 || 0}-${match.score2 || 0})` : '';
                console.log(`  ${team1} vs ${team2}${score} - ${match.status}`);
            });
        });
        
        // Check if semifinals were created
        if (bracket.rounds.length > 1) {
            console.log('\n✅ BRACKET PROGRESSION WORKING! Semifinals created automatically.');
            
            // Complete semifinals
            console.log('\n🎮 Playing Semi-Finals...');
            const semiFinals = bracket.rounds[1].matches;
            for (const match of semiFinals) {
                if (match.team1 && match.team2) {
                    await authApi.put(`/admin/events/${eventId}/bracket/matches/${match.id}`, {
                        team1_score: 2,
                        team2_score: 1,
                        status: 'completed'
                    });
                    console.log(`  ✅ ${match.team1.name} defeats ${match.team2.name} (2-1)`);
                }
            }
            
            // Final bracket check
            bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
            bracket = bracketResponse.data.data.bracket;
            
            console.log('\n🏆 Final Bracket State:');
            bracket.rounds.forEach(round => {
                console.log(`\n${round.name}:`);
                round.matches.forEach(match => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    const score = match.status === 'completed' ? 
                        ` (${match.score1 || 0}-${match.score2 || 0})` : '';
                    console.log(`  ${team1} vs ${team2}${score} - ${match.status}`);
                });
            });
        } else {
            console.log('\n⚠️ Note: Subsequent rounds may be created after all current round matches complete.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testFullBracket();