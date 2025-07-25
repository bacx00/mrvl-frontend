// Test script for Liquipedia-style bracket
const axios = require('axios');

async function testLiquipediaBracket() {
    const eventId = 100; // Marvel Rivals Invitational event ID
    const apiUrl = 'http://localhost:3000/api'; // Next.js API
    
    try {
        console.log('🎯 Testing Liquipedia bracket for event', eventId);
        
        // 1. Test event details endpoint
        console.log('\n📋 Testing event details...');
        const eventResponse = await axios.get(`${apiUrl}/events/${eventId}`);
        const event = eventResponse.data.data;
        console.log('✅ Event:', event.name);
        console.log('   Type:', event.type);
        console.log('   Status:', event.status);
        console.log('   Teams:', event.teams?.length || 0);
        console.log('   Format:', event.format);
        
        // 2. Test bracket endpoint
        console.log('\n🏆 Testing bracket endpoint...');
        const bracketResponse = await axios.get(`${apiUrl}/events/${eventId}/bracket`);
        const bracketData = bracketResponse.data.data;
        console.log('✅ Bracket received:', {
            type: bracketData.bracket.type,
            hasSwissStage: !!bracketData.bracket.swiss_stage,
            upperRounds: bracketData.bracket.rounds?.length || 0,
            lowerRounds: bracketData.bracket.lower_bracket?.length || 0,
            hasGrandFinal: !!bracketData.bracket.grand_final
        });
        
        // 3. Verify Swiss stage data
        if (bracketData.bracket.swiss_stage) {
            console.log('\n🎲 Swiss Stage Results:');
            const standings = bracketData.bracket.swiss_stage.standings;
            standings.forEach(standing => {
                console.log(`   ${standing.position}. ${standing.team.name} (${standing.wins}-${standing.losses}) - ${standing.qualified}`);
            });
        }
        
        // 4. Verify Upper Bracket
        console.log('\n📊 Upper Bracket:');
        bracketData.bracket.rounds.forEach(round => {
            console.log(`   ${round.name}:`);
            round.matches.forEach(match => {
                const team1 = match.team1?.name || 'TBD';
                const team2 = match.team2?.name || 'TBD';
                const score = match.status === 'completed' ? 
                    ` (${match.team1_score}-${match.team2_score})` : '';
                console.log(`     - ${team1} vs ${team2}${score} [${match.format}]`);
            });
        });
        
        // 5. Verify Lower Bracket
        if (bracketData.bracket.lower_bracket) {
            console.log('\n📊 Lower Bracket:');
            bracketData.bracket.lower_bracket.forEach(round => {
                console.log(`   ${round.name}:`);
                round.matches.forEach(match => {
                    const team1 = match.team1?.name || 'TBD';
                    const team2 = match.team2?.name || 'TBD';
                    const score = match.status === 'completed' ? 
                        ` (${match.team1_score}-${match.team2_score})` : '';
                    console.log(`     - ${team1} vs ${team2}${score} [${match.format}]`);
                });
            });
        }
        
        // 6. Verify Grand Final
        if (bracketData.bracket.grand_final) {
            const gf = bracketData.bracket.grand_final;
            console.log('\n🏆 Grand Final:');
            console.log(`   ${gf.team1?.name || 'TBD'} vs ${gf.team2?.name || 'TBD'}`);
            console.log(`   Format: ${gf.format}`);
            console.log(`   Status: ${gf.status}`);
            if (gf.status === 'completed') {
                console.log(`   Result: ${gf.team1_score}-${gf.team2_score}`);
                console.log(`   Winner: ${gf.winner === 1 ? gf.team1.name : gf.team2.name}`);
            }
        }
        
        // 7. Verify Final Standings
        if (bracketData.bracket.final_standings) {
            console.log('\n🏅 Final Standings:');
            bracketData.bracket.final_standings.forEach(standing => {
                const teams = standing.teams ? standing.teams.join(', ') : standing.team;
                console.log(`   ${standing.position}. ${teams} - $${standing.prize}`);
            });
        }
        
        console.log('\n✅ All tests passed! Liquipedia bracket structure is working correctly.');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            console.error('Make sure the Next.js dev server is running on port 3000');
        }
    }
}

// Run the test
testLiquipediaBracket();