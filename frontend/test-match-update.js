// Test match update and bracket progression
const axios = require('axios');

async function testMatchUpdate() {
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
        
        // Get current bracket
        console.log('\n📊 Current bracket state:');
        const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const bracket = bracketResponse.data.data.bracket;
        
        console.log('Total rounds:', bracket.rounds.length);
        bracket.rounds.forEach(round => {
            console.log(`\n${round.name} (Round ${round.round}):`);
            round.matches.forEach(match => {
                console.log(`  Match ${match.id}: ${match.team1.name} vs ${match.team2.name} - ${match.status}`);
            });
        });
        
        // Update first match
        const firstMatch = bracket.rounds[0].matches[0];
        console.log(`\n🎮 Updating match ${firstMatch.id}: ${firstMatch.team1.name} vs ${firstMatch.team2.name}`);
        
        const updateResponse = await authApi.put(
            `/admin/events/${eventId}/bracket/matches/${firstMatch.id}`,
            {
                team1_score: 3,
                team2_score: 1,
                status: 'completed'
            }
        );
        
        console.log('✅ Match updated:', updateResponse.data.message);
        
        // Check bracket after update
        console.log('\n🔄 Bracket after update:');
        const updatedBracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const updatedBracket = updatedBracketResponse.data.data.bracket;
        
        updatedBracket.rounds.forEach(round => {
            console.log(`\n${round.name} (Round ${round.round}):`);
            round.matches.forEach(match => {
                const score = match.status === 'completed' ? ` (${match.team1.score}-${match.team2.score})` : '';
                console.log(`  Match ${match.id}: ${match.team1?.name || 'TBD'} vs ${match.team2?.name || 'TBD'} - ${match.status}${score}`);
            });
        });
        
        // Update another match
        const secondMatch = bracket.rounds[0].matches[1];
        console.log(`\n🎮 Updating match ${secondMatch.id}: ${secondMatch.team1.name} vs ${secondMatch.team2.name}`);
        
        await authApi.put(
            `/admin/events/${eventId}/bracket/matches/${secondMatch.id}`,
            {
                team1_score: 3,
                team2_score: 2,
                status: 'completed'
            }
        );
        
        // Final bracket state
        console.log('\n📊 Final bracket state:');
        const finalBracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const finalBracket = finalBracketResponse.data.data.bracket;
        
        console.log('Total rounds:', finalBracket.rounds.length);
        finalBracket.rounds.forEach(round => {
            console.log(`\n${round.name} (Round ${round.round}):`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                const score = match.status === 'completed' ? ` (${match.team1?.score || 0}-${match.team2?.score || 0})` : '';
                const winner = match.winner_id ? ` → Winner: ${match.winner_id}` : '';
                console.log(`  Match ${match.id}: ${team1} vs ${team2} - ${match.status}${score}${winner}`);
            });
        });
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testMatchUpdate();