// Test bracket progression with automatic round creation
const axios = require('axios');

async function testBracketProgression() {
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
            third_place_match: false
        });
        
        // Get initial bracket
        let bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        let bracket = bracketResponse.data.data.bracket;
        
        console.log('\n📊 Initial Bracket State:');
        console.log('Total rounds:', bracket.rounds.length);
        bracket.rounds.forEach(round => {
            console.log(`\n${round.name} (Round ${round.round}):`);
            console.log(`  Number of matches: ${round.matches.length}`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                console.log(`  Match ${match.id}: ${team1} vs ${team2}`);
            });
        });
        
        // Complete first match
        console.log('\n🎮 Completing first quarter-final match...');
        const firstMatch = bracket.rounds[0].matches[0];
        await authApi.put(`/admin/events/${eventId}/bracket/matches/${firstMatch.id}`, {
            team1_score: 2,
            team2_score: 0,
            status: 'completed'
        });
        console.log(`✅ ${firstMatch.team1.name} defeats ${firstMatch.team2.name} (2-0)`);
        
        // Check if next round was created
        console.log('\n🔄 Checking for automatic round creation...');
        bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        bracket = bracketResponse.data.data.bracket;
        
        console.log('\nBracket after first match:');
        console.log('Total rounds:', bracket.rounds.length);
        bracket.rounds.forEach(round => {
            console.log(`\n${round.name}:`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                const status = match.status;
                console.log(`  ${team1} vs ${team2} - ${status}`);
            });
        });
        
        // Complete all quarter-finals
        console.log('\n🎮 Completing all quarter-final matches...');
        for (let i = 1; i < bracket.rounds[0].matches.length; i++) {
            const match = bracket.rounds[0].matches[i];
            await authApi.put(`/admin/events/${eventId}/bracket/matches/${match.id}`, {
                team1_score: 2,
                team2_score: 1,
                status: 'completed'
            });
            console.log(`✅ ${match.team1.name} defeats ${match.team2.name} (2-1)`);
        }
        
        // Final bracket check
        console.log('\n🔄 Checking final bracket state...');
        bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        bracket = bracketResponse.data.data.bracket;
        
        console.log('\n🏆 Final Bracket Structure:');
        console.log('Total rounds:', bracket.rounds.length);
        
        if (bracket.rounds.length > 1) {
            console.log('\n✅ SUCCESS! Bracket progression is working correctly.');
            console.log('Rounds created automatically as matches complete.');
        } else {
            console.log('\n⚠️ WARNING: Bracket progression may need further investigation.');
        }
        
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
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

testBracketProgression();