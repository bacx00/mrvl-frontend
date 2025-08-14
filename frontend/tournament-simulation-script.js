#!/usr/bin/env node

/**
 * Marvel Rivals Tournament Simulation Script
 * Simulates a complete real tournament workflow
 */

// Using built-in fetch in Node 18+

const BACKEND_URL = 'http://localhost:8000';
const EVENT_ID = 2;

// Admin credentials from seeder
const ADMIN_CREDENTIALS = {
    email: 'jhonny@ar-mediia.com',
    password: 'password123'
};

let adminToken = null;

async function apiCall(endpoint, options = {}) {
    const url = `${BACKEND_URL}/api${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    if (adminToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

async function authenticateAsAdmin() {
    console.log('🔐 Authenticating as admin...');
    
    const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (response.success && response.token) {
        adminToken = response.token;
        console.log('✅ Admin authentication successful');
        console.log(`👤 Logged in as: ${response.user.name} (${response.user.role})`);
        return true;
    } else {
        console.error('❌ Admin authentication failed:', response.message);
        return false;
    }
}

async function getEventDetails() {
    console.log(`\n📋 Getting event ${EVENT_ID} details...`);
    
    const response = await apiCall(`/events/${EVENT_ID}`);
    
    if (response.success && response.data) {
        const event = response.data;
        console.log(`✅ Event loaded: ${event.name}`);
        console.log(`   📅 Dates: ${event.schedule.start_date} to ${event.schedule.end_date}`);
        console.log(`   👥 Teams: ${event.participation.current_teams}/${event.participation.max_teams}`);
        console.log(`   🏆 Prize Pool: $${event.details.prize_pool} ${event.details.currency}`);
        console.log(`   📊 Status: ${event.status}`);
        
        if (event.teams && event.teams.length > 0) {
            console.log(`   🎯 Registered Teams:`);
            event.teams.forEach((team, index) => {
                console.log(`      ${index + 1}. ${team.name} (${team.region}) - Seed ${team.seed}`);
            });
        }
        
        return event;
    } else {
        throw new Error('Failed to get event details');
    }
}

async function addTeamsToEvent() {
    console.log(`\n👥 Adding more teams to Event ${EVENT_ID}...`);
    
    // Get available teams
    const teamsResponse = await apiCall('/teams?limit=10');
    const availableTeams = teamsResponse.data;
    
    console.log(`Found ${availableTeams.length} available teams`);
    
    // Add top-rated teams that aren't already registered
    const currentEvent = await apiCall(`/events/${EVENT_ID}`);
    const registeredTeamIds = currentEvent.data.teams.map(t => t.id);
    
    const teamsToAdd = availableTeams
        .filter(team => !registeredTeamIds.includes(team.id))
        .slice(0, 6) // Add 6 more teams to make it 8 total
        .sort((a, b) => b.rating - a.rating);
    
    console.log(`Adding ${teamsToAdd.length} teams:`);
    
    for (const team of teamsToAdd) {
        try {
            console.log(`   Adding ${team.name} (Rating: ${team.rating})...`);
            const response = await apiCall(`/admin/events/${EVENT_ID}/teams`, {
                method: 'POST',
                body: JSON.stringify({ team_id: team.id })
            });
            
            if (response.success) {
                console.log(`   ✅ ${team.name} added successfully`);
            } else {
                console.log(`   ⚠️ Failed to add ${team.name}: ${response.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Error adding ${team.name}: ${error.message}`);
        }
    }
}

async function generateTournamentBracket() {
    console.log(`\n🏆 Generating tournament bracket for Event ${EVENT_ID}...`);
    
    const bracketConfig = {
        format: 'single_elimination',
        seeding_method: 'rating',
        best_of: 'bo3',
        randomize_seeds: false,
        third_place_match: true
    };
    
    console.log(`Configuration:`, bracketConfig);
    
    try {
        const response = await apiCall(`/admin/events/${EVENT_ID}/generate-bracket`, {
            method: 'POST',
            body: JSON.stringify(bracketConfig)
        });
        
        if (response.success) {
            console.log('✅ Bracket generated successfully!');
            console.log(`   🎯 Format: ${response.data.bracket?.format || 'Single Elimination'}`);
            console.log(`   🔢 Total Matches: ${response.data.metadata?.total_matches || 0}`);
            console.log(`   📊 Rounds: ${response.data.bracket?.total_rounds || 0}`);
            return response.data;
        } else {
            console.error('❌ Bracket generation failed:', response.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Error generating bracket:', error.message);
        return null;
    }
}

async function getBracketVisualization() {
    console.log(`\n📊 Getting bracket visualization...`);
    
    try {
        const response = await apiCall(`/events/${EVENT_ID}/comprehensive-bracket`);
        
        if (response.success && response.data) {
            const bracket = response.data;
            console.log('✅ Bracket data retrieved');
            console.log(`   👥 Teams: ${bracket.metadata.total_teams}`);
            console.log(`   🎮 Matches: ${bracket.metadata.total_matches}`);
            console.log(`   ✅ Completed: ${bracket.metadata.completed_matches}`);
            console.log(`   ⏳ Remaining: ${bracket.metadata.remaining_matches}`);
            console.log(`   📈 Progress: ${Math.round(bracket.metadata.tournament_progress)}%`);
            
            if (bracket.bracket.rounds && bracket.bracket.rounds.length > 0) {
                console.log(`\n🏆 Bracket Structure:`);
                bracket.bracket.rounds.forEach((round, index) => {
                    console.log(`   Round ${index + 1}: ${round.matches?.length || 0} matches`);
                    if (round.matches) {
                        round.matches.forEach((match, matchIndex) => {
                            const team1 = match.team1?.name || 'TBD';
                            const team2 = match.team2?.name || 'TBD';
                            const status = match.status || 'pending';
                            console.log(`     Match ${matchIndex + 1}: ${team1} vs ${team2} (${status})`);
                        });
                    }
                });
            }
            
            return bracket;
        } else {
            console.error('❌ Failed to get bracket visualization');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting bracket:', error.message);
        return null;
    }
}

async function simulateMatchResults(bracket) {
    console.log(`\n🎮 Simulating match results...`);
    
    if (!bracket.bracket.rounds || bracket.bracket.rounds.length === 0) {
        console.log('❌ No matches to simulate');
        return;
    }
    
    // Simulate first round matches
    const firstRound = bracket.bracket.rounds[0];
    if (!firstRound.matches || firstRound.matches.length === 0) {
        console.log('❌ No first round matches found');
        return;
    }
    
    console.log(`🎯 Simulating ${firstRound.matches.length} first round matches...`);
    
    for (const match of firstRound.matches) {
        if (match.status === 'pending' && match.team1 && match.team2) {
            // Simulate match result based on team ratings
            const team1Rating = match.team1.rating || 1500;
            const team2Rating = match.team2.rating || 1500;
            
            // Higher rated team has advantage
            const team1WinProbability = 1 / (1 + Math.pow(10, (team2Rating - team1Rating) / 400));
            const team1Wins = Math.random() < team1WinProbability;
            
            // Generate realistic scores for Bo3
            let score1, score2;
            if (team1Wins) {
                score1 = 2;
                score2 = Math.random() < 0.7 ? 0 : 1; // 70% chance of 2-0, 30% chance of 2-1
            } else {
                score2 = 2;
                score1 = Math.random() < 0.7 ? 0 : 1;
            }
            
            const winner = team1Wins ? match.team1 : match.team2;
            const loser = team1Wins ? match.team2 : match.team1;
            
            console.log(`   🏆 ${winner.name} defeats ${loser.name} (${score1}-${score2})`);
            
            // Update match via API
            try {
                const updateResponse = await apiCall(`/admin/events/${EVENT_ID}/bracket/matches/${match.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        team1_score: score1,
                        team2_score: score2,
                        winner_id: winner.id,
                        status: 'completed'
                    })
                });
                
                if (updateResponse.success) {
                    console.log(`   ✅ Match result saved`);
                } else {
                    console.log(`   ⚠️ Failed to save match result: ${updateResponse.message}`);
                }
            } catch (error) {
                console.log(`   ❌ Error updating match: ${error.message}`);
            }
        }
    }
}

async function runTournamentSimulation() {
    console.log('🚀 Starting Marvel Rivals Tournament Simulation\n');
    console.log('================================================');
    
    try {
        // Step 1: Authenticate
        const authSuccess = await authenticateAsAdmin();
        if (!authSuccess) {
            throw new Error('Authentication failed');
        }
        
        // Step 2: Get initial event state
        const event = await getEventDetails();
        
        // Step 3: Add more teams if needed
        if (event.participation.current_teams < 4) {
            await addTeamsToEvent();
            // Refresh event details
            await getEventDetails();
        }
        
        // Step 4: Generate tournament bracket
        const bracketData = await generateTournamentBracket();
        
        // Step 5: Get bracket visualization
        const bracket = await getBracketVisualization();
        
        // Step 6: Simulate match results
        if (bracket) {
            await simulateMatchResults(bracket);
            
            // Step 7: Get updated bracket
            console.log(`\n📊 Getting updated bracket after match results...`);
            await getBracketVisualization();
        }
        
        console.log('\n🎉 Tournament simulation completed successfully!');
        console.log('================================================');
        
    } catch (error) {
        console.error('\n❌ Tournament simulation failed:', error.message);
        console.error('================================================');
        process.exit(1);
    }
}

// Run the simulation
runTournamentSimulation().then(() => {
    console.log('✅ Simulation finished');
    process.exit(0);
}).catch(error => {
    console.error('❌ Simulation error:', error);
    process.exit(1);
});