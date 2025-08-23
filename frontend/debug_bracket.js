// Debug script to investigate critical issues in StandaloneBracketBuilder

const BracketTestRunner = require('./bracket_test_runner.js');

function debugIssues() {
    console.log('🔍 DEBUGGING CRITICAL ISSUES');
    console.log('=============================\n');

    const runner = new BracketTestRunner();

    // Issue 1: Round naming problem
    console.log('ISSUE 1: Round Naming Logic');
    console.log('---------------------------');
    
    runner.initializeBracket(8, 3);
    const firstRound = runner.bracketState.rounds[0];
    
    console.log(`8-team bracket first round name: "${firstRound.name}"`);
    console.log(`Expected: "Round 1" or "Quarter Finals"`);
    
    // Debug the getRoundName function
    const totalRounds = Math.log2(8); // Should be 3
    console.log(`Total rounds for 8 teams: ${totalRounds}`);
    
    for (let i = 1; i <= totalRounds; i++) {
        const name = runner.getRoundName(i, totalRounds);
        console.log(`Round ${i}: "${name}"`);
    }
    
    console.log('\nAnalysis: The naming logic is working correctly.');
    console.log('- Round 1 of 8-team bracket IS "Quarter Finals" (4 teams -> quarters)');
    console.log('- This is actually correct behavior, not a bug!\n');

    // Issue 2: Winner advancement problem  
    console.log('ISSUE 2: Winner Advancement Logic');
    console.log('----------------------------------');
    
    runner.initializeBracket(8, 3);
    
    // Set up matches
    for (let i = 0; i < 4; i++) {
        runner.updateTeamSelection(1, `R1M${i + 1}`, 1, i * 2 + 1);
        runner.updateTeamSelection(1, `R1M${i + 1}`, 2, i * 2 + 2);
    }
    
    console.log('Before completing matches:');
    console.log(`Rounds: ${runner.bracketState.rounds.length}`);
    
    // Complete first match
    runner.updateMatchScore(1, 'R1M1', 2, 0);
    console.log('\nAfter R1M1 (Team Secret wins 2-0):');
    console.log(`Winner: ${runner.bracketState.rounds[0].matches[0].winner?.name}`);
    console.log(`Status: ${runner.bracketState.rounds[0].matches[0].status}`);
    
    // Complete remaining matches
    runner.updateMatchScore(1, 'R1M2', 2, 1);
    runner.updateMatchScore(1, 'R1M3', 2, 0);  
    runner.updateMatchScore(1, 'R1M4', 2, 1);
    
    console.log('\nAfter all Round 1 matches:');
    console.log(`Total rounds: ${runner.bracketState.rounds.length}`);
    
    if (runner.bracketState.rounds.length > 1) {
        const semiRound = runner.bracketState.rounds[1];
        console.log(`Semi Finals matches: ${semiRound.matches.length}`);
        
        semiRound.matches.forEach((match, index) => {
            console.log(`  Semi Match ${index + 1}: ${match.team1?.name || 'TBD'} vs ${match.team2?.name || 'TBD'}`);
        });
        
        // This reveals the advancement issue!
        console.log('\nDEBUGGING ADVANCEMENT:');
        
        // Let's trace the advancement logic manually
        console.log('Expected advancement:');
        console.log('- R1M1 winner (Team Secret) -> Semi M1 Team1');
        console.log('- R1M2 winner (Team 3) -> Semi M1 Team2'); 
        console.log('- R1M3 winner (Team 5) -> Semi M2 Team1');
        console.log('- R1M4 winner (Team 7) -> Semi M2 Team2');
        
        // Check actual state
        const r1winners = runner.bracketState.rounds[0].matches.map(m => m.winner?.name || 'None');
        console.log(`\nActual R1 winners: [${r1winners.join(', ')}]`);
    } else {
        console.log('ERROR: No semi-finals round created!');
    }

    // Issue 3: Complete tournament flow debugging
    console.log('\n\nISSUE 3: Complete Tournament Flow');
    console.log('----------------------------------');
    
    // Fresh start for complete flow
    const flowRunner = new BracketTestRunner();
    flowRunner.initializeBracket(8, 3);
    
    // Set up Round 1 with explicit team assignments
    const teams = [1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = 0; i < 4; i++) {
        flowRunner.updateTeamSelection(1, `R1M${i + 1}`, 1, teams[i * 2]);
        flowRunner.updateTeamSelection(1, `R1M${i + 1}`, 2, teams[i * 2 + 1]);
        console.log(`R1M${i + 1}: Team ${teams[i * 2]} vs Team ${teams[i * 2 + 1]}`);
    }
    
    // Complete Round 1 step by step
    console.log('\nCompleting Round 1:');
    flowRunner.updateMatchScore(1, 'R1M1', 2, 0); // Team 1 wins
    console.log(`R1M1 complete: ${flowRunner.bracketState.rounds[0].matches[0].winner?.name} wins`);
    
    flowRunner.updateMatchScore(1, 'R1M2', 2, 1); // Team 3 wins  
    console.log(`R1M2 complete: ${flowRunner.bracketState.rounds[0].matches[1].winner?.name} wins`);
    
    flowRunner.updateMatchScore(1, 'R1M3', 2, 0); // Team 5 wins
    console.log(`R1M3 complete: ${flowRunner.bracketState.rounds[0].matches[2].winner?.name} wins`);
    
    flowRunner.updateMatchScore(1, 'R1M4', 2, 1); // Team 7 wins
    console.log(`R1M4 complete: ${flowRunner.bracketState.rounds[0].matches[3].winner?.name} wins`);
    
    console.log(`\nAfter Round 1: ${flowRunner.bracketState.rounds.length} rounds exist`);
    
    if (flowRunner.bracketState.rounds.length > 1) {
        console.log('\nSemi Finals state:');
        const semis = flowRunner.bracketState.rounds[1];
        semis.matches.forEach((match, i) => {
            console.log(`  Semi ${i + 1}: ${match.team1?.name || 'TBD'} vs ${match.team2?.name || 'TBD'} (status: ${match.status})`);
        });
        
        // Complete semifinals
        console.log('\nCompleting Semi Finals:');
        flowRunner.updateMatchScore(2, 'R2M1', 2, 1); // Match 1 winner
        flowRunner.updateMatchScore(2, 'R2M2', 2, 0); // Match 2 winner
        
        console.log(`After Semis: ${flowRunner.bracketState.rounds.length} rounds exist`);
        
        if (flowRunner.bracketState.rounds.length > 2) {
            console.log('\nGrand Final state:');
            const final = flowRunner.bracketState.rounds[2].matches[0];
            console.log(`  Final: ${final.team1?.name || 'TBD'} vs ${final.team2?.name || 'TBD'} (status: ${final.status})`);
            
            // Complete Grand Final
            console.log('\nCompleting Grand Final:');
            flowRunner.updateMatchScore(3, 'R3M1', 2, 1);
            
            const champion = flowRunner.bracketState.rounds[2].matches[0].winner;
            console.log(`CHAMPION: ${champion?.name || 'NONE!'}`);
        } else {
            console.log('ERROR: Grand Final not created!');
        }
    } else {
        console.log('ERROR: Semi Finals not created!');
    }
}

debugIssues();