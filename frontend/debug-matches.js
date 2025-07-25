// Debug matches to see why they're not ready
const axios = require('axios');

async function debugMatches() {
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
        
        // Get bracket
        const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const bracket = bracketResponse.data.data.bracket;
        
        console.log('🔍 Debugging Match Data:');
        console.log('Total rounds:', bracket.rounds.length);
        
        bracket.rounds.forEach(round => {
            console.log(`\n${round.name} (Round ${round.round}):`);
            round.matches.forEach(match => {
                console.log(`\nMatch ${match.id}:`);
                console.log(`  Status: ${match.status}`);
                console.log(`  Team1: ${match.team1 ? match.team1.name : 'null'} (ID: ${match.team1_id || 'null'})`);
                console.log(`  Team2: ${match.team2 ? match.team2.name : 'null'} (ID: ${match.team2_id || 'null'})`);
                console.log(`  Has both teams: ${!!(match.team1_id && match.team2_id)}`);
                console.log(`  Raw match data:`, JSON.stringify(match, null, 2));
            });
        });
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

debugMatches();