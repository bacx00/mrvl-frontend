// Test bracket as admin user
const axios = require('axios');

async function testAdminBracket() {
    const apiUrl = 'https://staging.mrvl.net/api';
    const eventId = 8;
    
    try {
        // Login and get user info
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
            email: 'jhonny@ar-mediia.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('👤 Logged in as:', user.name, '- Role:', user.role);
        
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
        
        console.log('\n📊 Current Bracket:');
        bracket.rounds.forEach(round => {
            console.log(`\n${round.name}:`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                const score = match.status === 'completed' ? 
                    ` (${match.score1 || 0}-${match.score2 || 0})` : '';
                console.log(`  Match ${match.id}: ${team1} vs ${team2} - ${match.status}${score}`);
            });
        });
        
        // Try different update approach - directly to matches endpoint
        if (bracket.rounds && bracket.rounds.length > 0) {
            const firstMatch = bracket.rounds[0].matches[0];
            console.log(`\n🎮 Trying direct match update...`);
            
            // Try updating via different endpoint patterns
            const endpoints = [
                `/admin/events/${eventId}/bracket/matches/${firstMatch.id}`,
                `/events/${eventId}/bracket/matches/${firstMatch.id}`,
                `/bracket/matches/${firstMatch.id}`,
                `/matches/${firstMatch.id}/update`
            ];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`\n📍 Trying endpoint: ${endpoint}`);
                    const response = await authApi.put(endpoint, {
                        team1_score: 2,
                        team2_score: 0,
                        status: 'completed'
                    });
                    console.log('✅ Success!', response.data.message);
                    break;
                } catch (e) {
                    console.log('❌ Failed:', e.response?.data?.message || e.message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testAdminBracket();