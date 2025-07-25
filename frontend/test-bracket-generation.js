// Test script to generate bracket for event 8
const axios = require('axios');

async function testBracketGeneration() {
    const eventId = 8;
    const apiUrl = 'https://staging.mrvl.net/api';
    
    try {
        console.log('🎯 Testing bracket generation for event', eventId);
        
        // First, get the event details
        const eventResponse = await axios.get(`${apiUrl}/events/${eventId}`);
        const event = eventResponse.data.data;
        console.log('📋 Event:', event.name, '- Format:', event.format);
        console.log('👥 Teams count:', event.teams?.length || 0);
        
        // Generate bracket with rating-based seeding
        console.log('\n🏗️ Generating bracket...');
        const generateResponse = await axios.post(
            `${apiUrl}/admin/events/${eventId}/generate-bracket`,
            {
                seeding_type: 'rating',
                best_of: 3,
                third_place_match: true
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        
        console.log('✅ Bracket generation response:', generateResponse.data);
        
        // Fetch the updated bracket
        console.log('\n📊 Fetching updated bracket...');
        const bracketResponse = await axios.get(`${apiUrl}/events/${eventId}/bracket`);
        const bracket = bracketResponse.data.data.bracket;
        
        console.log('🏆 Bracket type:', bracket.type);
        console.log('📍 Rounds:', bracket.rounds?.length || 0);
        
        if (bracket.rounds) {
            bracket.rounds.forEach(round => {
                console.log(`\n📌 Round ${round.round}: ${round.name}`);
                console.log(`   Matches: ${round.matches.length}`);
                round.matches.forEach(match => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    console.log(`   - ${team1} vs ${team2}`);
                });
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

// Run the test
testBracketGeneration();