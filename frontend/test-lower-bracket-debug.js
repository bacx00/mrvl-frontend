// Debug lower bracket creation
const axios = require('axios');

async function debugLowerBracket() {
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
        
        // Make sure we're in double elim
        await authApi.put(`/admin/events/${eventId}`, {
            format: 'double_elimination'
        });
        
        // Generate fresh bracket
        console.log('🏗️ Generating double elimination bracket...');
        await authApi.post(`/admin/events/${eventId}/generate-bracket`, {
            seeding_type: 'rating',
            best_of: 3,
            third_place_match: false
        });
        
        // Get initial bracket
        let bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        let bracket = bracketResponse.data.data.bracket;
        
        console.log('\n📊 Initial state:');
        console.log('Upper bracket matches:', bracket.upper_bracket[0].matches.length);
        console.log('Lower bracket rounds:', bracket.lower_bracket.length);
        
        // Play just the first two matches to see if lower bracket is created
        console.log('\n🎮 Playing first two matches...');
        const match1 = bracket.upper_bracket[0].matches[0];
        const match2 = bracket.upper_bracket[0].matches[1];
        
        // First match
        await authApi.put(`/admin/events/${eventId}/bracket/matches/${match1.id}`, {
            team1_score: 2,
            team2_score: 0,
            status: 'completed'
        });
        console.log(`✅ Match 1 completed: ${match1.team1.name} defeats ${match1.team2.name}`);
        
        // Check bracket after first match
        bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        bracket = bracketResponse.data.data.bracket;
        console.log('\nAfter first match - Lower bracket rounds:', bracket.lower_bracket.length);
        
        // Second match
        await authApi.put(`/admin/events/${eventId}/bracket/matches/${match2.id}`, {
            team1_score: 0,
            team2_score: 2,
            status: 'completed'
        });
        console.log(`✅ Match 2 completed: ${match2.team2.name} defeats ${match2.team1.name}`);
        
        // Check bracket after second match
        bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        bracket = bracketResponse.data.data.bracket;
        console.log('\nAfter second match - Lower bracket rounds:', bracket.lower_bracket.length);
        
        if (bracket.lower_bracket.length > 0) {
            console.log('\n✅ Lower bracket created!');
            bracket.lower_bracket.forEach(round => {
                console.log(`\n${round.name}:`);
                round.matches.forEach(match => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`  ${team1} vs ${team2}`);
                });
            });
        } else {
            console.log('\n⚠️ Lower bracket not created - checking database directly...');
            
            // Check if matches exist in database but not in API response
            console.log('\nTrying to query matches table directly...');
        }
        
        // Reset to single elim
        await authApi.put(`/admin/events/${eventId}`, {
            format: 'single_elimination'
        });
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

debugLowerBracket();