// Detailed bracket test
const axios = require('axios');

async function testBracketDetailed() {
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
        console.log('✅ Login successful!');
        
        const authApi = axios.create({
            baseURL: apiUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Get all matches
        console.log('\n📋 Fetching all matches...');
        const matchesResponse = await authApi.get(`/matches?event_id=${eventId}`);
        console.log('Total matches:', matchesResponse.data.data?.length || 0);
        
        // Get bracket structure
        console.log('\n🏆 Fetching bracket structure...');
        const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const bracket = bracketResponse.data.data.bracket;
        
        console.log('Bracket type:', bracket.type);
        console.log('Rounds in bracket:', JSON.stringify(bracket.rounds, null, 2));
        
        // Get event format
        const eventResponse = await authApi.get(`/events/${eventId}`);
        const event = eventResponse.data.data;
        console.log('\nEvent format from DB:', event.format);
        console.log('Tournament format:', event.tournament_format);
        
        // Try different format generation
        console.log('\n🔧 Testing double elimination format...');
        
        // First update event format
        await authApi.put(`/events/${eventId}`, {
            format: 'double_elimination'
        });
        
        // Generate new bracket
        const generateResponse = await authApi.post(
            `/admin/events/${eventId}/generate-bracket`,
            {
                seeding_type: 'rating',
                best_of: 3
            }
        );
        
        console.log('✅ Double elimination bracket generated');
        
        // Fetch updated bracket
        const newBracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const newBracket = newBracketResponse.data.data.bracket;
        
        console.log('\n📊 New Bracket Structure:');
        console.log('Type:', newBracket.type);
        console.log('Upper bracket rounds:', newBracket.rounds?.length || 0);
        console.log('Lower bracket rounds:', newBracket.lower_bracket?.length || 0);
        console.log('Has grand final:', !!newBracket.grand_final);
        
        if (newBracket.rounds) {
            console.log('\n🏆 Upper Bracket:');
            newBracket.rounds.forEach(round => {
                console.log(`\n${round.name}:`);
                round.matches.forEach((match, idx) => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`  Match ${match.id}: ${team1} vs ${team2} [${match.status}]`);
                });
            });
        }
        
        if (newBracket.lower_bracket) {
            console.log('\n🔻 Lower Bracket:');
            newBracket.lower_bracket.forEach(round => {
                console.log(`\n${round.name}:`);
                round.matches.forEach((match, idx) => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`  Match ${match.id}: ${team1} vs ${team2} [${match.status}]`);
                });
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testBracketDetailed();