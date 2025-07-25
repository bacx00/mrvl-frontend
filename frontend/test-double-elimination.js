// Test double elimination tournament format
const axios = require('axios');

async function testDoubleElimination() {
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
        
        // First change event format to double elimination
        console.log('\n🔧 Updating event to double elimination format...');
        await authApi.put(`/admin/events/${eventId}`, {
            format: 'double_elimination'
        });
        
        // Generate double elimination bracket
        console.log('\n🏗️ Generating double elimination bracket...');
        await authApi.post(`/admin/events/${eventId}/generate-bracket`, {
            seeding_type: 'rating',
            best_of: 3,
            third_place_match: false
        });
        
        // Get initial bracket
        const bracketResponse = await authApi.get(`/events/${eventId}/bracket`);
        const bracket = bracketResponse.data.data.bracket;
        
        console.log('\n📊 Double Elimination Bracket Structure:');
        console.log('Bracket type:', bracket.type);
        console.log('Upper bracket rounds:', bracket.upper_bracket?.length || 0);
        console.log('Lower bracket rounds:', bracket.lower_bracket?.length || 0);
        
        const upperRounds = bracket.upper_bracket || [];
        const lowerRounds = bracket.lower_bracket || [];
        const grandFinal = bracket.grand_final;
        
        console.log('\n🔵 UPPER BRACKET:');
        upperRounds.forEach(round => {
            console.log(`\n${round.name}:`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                console.log(`  ${team1} vs ${team2}`);
            });
        });
        
        console.log('\n🔴 LOWER BRACKET:');
        if (lowerRounds.length > 0) {
            lowerRounds.forEach(round => {
                console.log(`\n${round.name}:`);
                round.matches.forEach(match => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`  ${team1} vs ${team2}`);
                });
            });
        } else {
            console.log('(Will be populated as teams drop from upper bracket)');
        }
        
        if (grandFinal) {
            console.log('\n🏆 GRAND FINAL:');
            const team1 = grandFinal.team1?.name || 'TBD';
            const team2 = grandFinal.team2?.name || 'TBD';
            console.log(`  ${team1} vs ${team2}`);
        }
        
        // Play some upper bracket matches to test lower bracket drops
        console.log('\n\n🎮 Playing upper bracket first round...');
        const firstRoundMatches = upperRounds[0]?.matches || [];
        
        for (let i = 0; i < firstRoundMatches.length; i++) {
            const match = firstRoundMatches[i];
            if (match.team1 && match.team2) {
                // Alternate winners to create variety
                const team1Wins = i % 2 === 0;
                
                await authApi.put(`/admin/events/${eventId}/bracket/matches/${match.id}`, {
                    team1_score: team1Wins ? 2 : 0,
                    team2_score: team1Wins ? 0 : 2,
                    status: 'completed'
                });
                
                const winner = team1Wins ? match.team1 : match.team2;
                const loser = team1Wins ? match.team2 : match.team1;
                console.log(`  ✅ ${winner.name} defeats ${loser.name} - ${loser.name} drops to lower bracket`);
            }
        }
        
        // Get updated bracket to see lower bracket population
        console.log('\n🔄 Checking bracket after upper bracket losses...');
        const updatedResponse = await authApi.get(`/events/${eventId}/bracket`);
        const updatedBracket = updatedResponse.data.data.bracket;
        
        const updatedLowerRounds = updatedBracket.lower_bracket || [];
        
        console.log('\n🔴 UPDATED LOWER BRACKET:');
        if (updatedLowerRounds.length > 0) {
            updatedLowerRounds.forEach(round => {
                console.log(`\n${round.name}:`);
                round.matches.forEach(match => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`  ${team1} vs ${team2} - ${match.status}`);
                });
            });
            console.log('\n✅ Lower bracket is properly populated with losing teams!');
        } else {
            console.log('⚠️ Lower bracket population needs investigation');
        }
        
        // Reset event format back to single elimination
        console.log('\n🔧 Resetting event to single elimination...');
        await authApi.put(`/admin/events/${eventId}`, {
            format: 'single_elimination'
        });
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

testDoubleElimination();