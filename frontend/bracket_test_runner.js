// Comprehensive Test Runner for StandaloneBracketBuilder
// This script contains all the testing logic extracted from the HTML file for easier analysis

class BracketTestRunner {
    constructor() {
        this.testResults = [];
        this.bracketState = {
            name: 'Marvel Rivals Championship 2025',
            format: 'single_elimination',
            rounds: [],
            teams: [],
            settings: {
                bestOf: 3,
                totalTeams: 8,
                thirdPlace: false,
                grandFinalReset: false
            }
        };

        this.availableTeams = [
            { id: 1, name: 'Team Secret' },
            { id: 2, name: 'FaZe Clan' },
            { id: 3, name: 'Cloud9' },
            { id: 4, name: 'NRG Esports' },
            { id: 5, name: '100 Thieves' },
            { id: 6, name: 'Sentinels' },
            { id: 7, name: 'OpTic Gaming' },
            { id: 8, name: 'TSM' },
            { id: 9, name: 'G2 Esports' },
            { id: 10, name: 'Fnatic' },
            { id: 11, name: 'Team Liquid' },
            { id: 12, name: 'Evil Geniuses' },
            { id: 13, name: 'XSET' },
            { id: 14, name: 'Version1' },
            { id: 15, name: 'The Guard' },
            { id: 16, name: 'Ghost Gaming' }
        ];
    }

    // Core bracket logic (extracted from component)
    getRoundName(round, totalRounds) {
        const reverseRound = totalRounds - round + 1;
        if (reverseRound === 1) return 'Grand Final';
        if (reverseRound === 2) return 'Semi Finals';
        if (reverseRound === 3) return 'Quarter Finals';
        if (reverseRound === 4) return 'Round of 16';
        if (reverseRound === 5) return 'Round of 32';
        return `Round ${round}`;
    }

    initializeBracket(teamCount, bestOf = 3) {
        const rounds = [];
        const matchesInFirstRound = teamCount / 2;
        
        // Only create the first round initially
        const firstRound = {
            id: 1,
            name: this.getRoundName(1, Math.log2(teamCount)),
            matches: []
        };
        
        for (let m = 0; m < matchesInFirstRound; m++) {
            firstRound.matches.push({
                id: `R1M${m + 1}`,
                matchNumber: m + 1,
                team1: null,
                team2: null,
                score1: 0,
                score2: 0,
                winner: null,
                bestOf: bestOf,
                status: 'pending'
            });
        }
        
        rounds.push(firstRound);
        
        this.bracketState = {
            ...this.bracketState,
            format: 'single_elimination',
            rounds: rounds,
            settings: {
                ...this.bracketState.settings,
                bestOf: bestOf,
                totalTeams: teamCount
            }
        };
        
        return this.bracketState;
    }

    updateTeamSelection(roundId, matchId, slot, teamId) {
        const round = this.bracketState.rounds.find(r => r.id === roundId);
        if (!round) return false;
        
        const match = round.matches.find(m => m.id === matchId);
        if (!match) return false;
        
        const selectedTeam = this.availableTeams.find(t => t.id === parseInt(teamId));
        
        if (slot === 1) {
            match.team1 = selectedTeam || null;
        } else {
            match.team2 = selectedTeam || null;
        }
        
        // Update status if both teams are selected
        if (match.team1 && match.team2 && match.status === 'pending') {
            match.status = 'live';
        }
        
        return true;
    }

    updateMatchScore(roundId, matchId, team1Score, team2Score) {
        const round = this.bracketState.rounds.find(r => r.id === roundId);
        if (!round) return false;
        
        const match = round.matches.find(m => m.id === matchId);
        if (!match) return false;
        
        match.score1 = team1Score;
        match.score2 = team2Score;
        
        // Determine winner
        const maxScore = Math.ceil(match.bestOf / 2);
        if (team1Score >= maxScore) {
            match.winner = match.team1;
            match.status = 'completed';
            this.advanceWinner(roundId, matchId, match.team1);
            this.createNextRound(roundId);
            return true;
        } else if (team2Score >= maxScore) {
            match.winner = match.team2;
            match.status = 'completed';
            this.advanceWinner(roundId, matchId, match.team2);
            this.createNextRound(roundId);
            return true;
        } else {
            match.winner = null;
            match.status = match.team1 && match.team2 ? 'live' : 'pending';
            return true;
        }
    }

    createNextRound(currentRoundId) {
        const currentRound = this.bracketState.rounds.find(r => r.id === currentRoundId);
        if (!currentRound) return false;

        // Check if all matches in current round are completed
        const allCompleted = currentRound.matches.every(m => m.status === 'completed');
        if (!allCompleted) return false;

        // Check if next round already exists
        const nextRoundId = currentRoundId + 1;
        if (this.bracketState.rounds.find(r => r.id === nextRoundId)) return false;

        // Calculate how many matches in next round
        const matchesInNextRound = Math.floor(currentRound.matches.length / 2);
        if (matchesInNextRound < 1) return false; // Tournament is complete

        const totalRounds = Math.log2(this.bracketState.settings.totalTeams);
        const newRound = {
            id: nextRoundId,
            name: this.getRoundName(nextRoundId, totalRounds),
            matches: []
        };

        for (let m = 0; m < matchesInNextRound; m++) {
            newRound.matches.push({
                id: `R${nextRoundId}M${m + 1}`,
                matchNumber: m + 1,
                team1: null,
                team2: null,
                score1: 0,
                score2: 0,
                winner: null,
                bestOf: this.bracketState.settings.bestOf,
                status: 'pending'
            });
        }

        this.bracketState.rounds.push(newRound);
        return true;
    }

    advanceWinner(roundId, matchId, winner) {
        if (!winner) return false;
        
        const nextRound = this.bracketState.rounds.find(r => r.id === roundId + 1);
        if (!nextRound) return false;
        
        // Find which match in next round this winner goes to
        const currentMatchNumber = parseInt(matchId.split('M')[1]);
        const nextMatchNumber = Math.ceil(currentMatchNumber / 2);
        const nextMatch = nextRound.matches.find(m => m.matchNumber === nextMatchNumber);
        
        if (nextMatch) {
            if (currentMatchNumber % 2 === 1) {
                nextMatch.team1 = winner;
            } else {
                nextMatch.team2 = winner;
            }
            
            // Update next match status if both teams are set
            if (nextMatch.team1 && nextMatch.team2 && nextMatch.status === 'pending') {
                nextMatch.status = 'live';
            }
            
            return true;
        }
        
        return false;
    }

    clearBracket() {
        this.bracketState = {
            ...this.bracketState,
            rounds: []
        };
    }

    // Test logging
    logTest(testName, passed, details = '') {
        const result = {
            name: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        
        const status = passed ? 'PASS' : 'FAIL';
        console.log(`[${status}] ${testName}: ${details}`);
        
        return result;
    }

    logWarning(testName, details) {
        console.log(`[WARN] ${testName}: ${details}`);
    }

    // Test methods
    testBracketInitialization() {
        console.log('\n=== TESTING BRACKET INITIALIZATION ===');
        
        // Test 1: Initialize 8-team bracket
        try {
            this.initializeBracket(8, 3);
            const hasFirstRound = this.bracketState.rounds.length === 1;
            const firstRound = this.bracketState.rounds[0];
            const correctMatches = firstRound && firstRound.matches.length === 4;
            const correctRoundName = firstRound && firstRound.name === 'Round 1';
            
            this.logTest('8-Team Bracket Initialization', 
                hasFirstRound && correctMatches && correctRoundName,
                `Created ${this.bracketState.rounds.length} rounds, first round has ${firstRound?.matches.length || 0} matches, named "${firstRound?.name || 'N/A'}"`
            );
        } catch (error) {
            this.logTest('8-Team Bracket Initialization', false, `Error: ${error.message}`);
        }

        // Test 2: Initialize different team counts
        const teamCounts = [2, 4, 8, 16];
        teamCounts.forEach(count => {
            try {
                this.initializeBracket(count, 3);
                const expectedMatches = count / 2;
                const actualMatches = this.bracketState.rounds[0]?.matches.length || 0;
                
                this.logTest(`${count}-Team Bracket Structure`, 
                    actualMatches === expectedMatches,
                    `Expected ${expectedMatches} first round matches, got ${actualMatches}`
                );
            } catch (error) {
                this.logTest(`${count}-Team Bracket Structure`, false, `Error: ${error.message}`);
            }
        });

        // Test 3: Best Of settings
        const bestOfOptions = [1, 3, 5, 7, 9];
        bestOfOptions.forEach(bo => {
            try {
                this.initializeBracket(8, bo);
                const match = this.bracketState.rounds[0]?.matches[0];
                const correctBestOf = match && match.bestOf === bo;
                
                this.logTest(`BO${bo} Setting`, 
                    correctBestOf,
                    `Expected BO${bo}, got BO${match?.bestOf || 'N/A'}`
                );
            } catch (error) {
                this.logTest(`BO${bo} Setting`, false, `Error: ${error.message}`);
            }
        });
    }

    testTeamSelection() {
        console.log('\n=== TESTING TEAM SELECTION ===');
        
        // Initialize bracket for testing
        this.initializeBracket(8, 3);
        
        // Test 1: Basic team selection
        try {
            const success = this.updateTeamSelection(1, 'R1M1', 1, 1);
            const match = this.bracketState.rounds[0].matches[0];
            const hasTeam = match.team1 && match.team1.id === 1;
            
            this.logTest('Team Selection - Slot 1', 
                success && hasTeam,
                `Selected team: ${match.team1?.name || 'None'}`
            );
        } catch (error) {
            this.logTest('Team Selection - Slot 1', false, `Error: ${error.message}`);
        }

        // Test 2: Both teams selected - status should change to 'live'
        try {
            this.updateTeamSelection(1, 'R1M1', 2, 2);
            const match = this.bracketState.rounds[0].matches[0];
            const bothTeamsSelected = match.team1 && match.team2;
            const statusIsLive = match.status === 'live';
            
            this.logTest('Match Status Change to Live', 
                bothTeamsSelected && statusIsLive,
                `Both teams selected: ${bothTeamsSelected}, Status: ${match.status}`
            );
        } catch (error) {
            this.logTest('Match Status Change to Live', false, `Error: ${error.message}`);
        }

        // Test 3: Invalid team selection
        try {
            const success = this.updateTeamSelection(1, 'R1M1', 1, 999);
            const match = this.bracketState.rounds[0].matches[0];
            const teamIsNull = !match.team1 || match.team1.id !== 999;
            
            this.logTest('Invalid Team ID Handling', 
                teamIsNull,
                `Invalid team ID should result in null assignment`
            );
        } catch (error) {
            this.logTest('Invalid Team ID Handling', false, `Error: ${error.message}`);
        }
    }

    testScoreUpdates() {
        console.log('\n=== TESTING SCORE UPDATES ===');
        
        // Setup bracket with teams
        this.initializeBracket(8, 3);
        this.updateTeamSelection(1, 'R1M1', 1, 1);
        this.updateTeamSelection(1, 'R1M1', 2, 2);

        // Test 1: Score update without winner
        try {
            this.updateMatchScore(1, 'R1M1', 1, 0);
            const match = this.bracketState.rounds[0].matches[0];
            const correctScore = match.score1 === 1 && match.score2 === 0;
            const noWinner = !match.winner;
            const statusLive = match.status === 'live';
            
            this.logTest('Score Update - No Winner', 
                correctScore && noWinner && statusLive,
                `Score: ${match.score1}-${match.score2}, Winner: ${match.winner?.name || 'None'}, Status: ${match.status}`
            );
        } catch (error) {
            this.logTest('Score Update - No Winner', false, `Error: ${error.message}`);
        }

        // Test 2: Score update with winner (BO3 - need 2 wins)
        try {
            this.updateMatchScore(1, 'R1M1', 2, 0);
            const match = this.bracketState.rounds[0].matches[0];
            const hasWinner = match.winner && match.winner.id === 1;
            const statusCompleted = match.status === 'completed';
            
            this.logTest('Score Update - Winner Determined', 
                hasWinner && statusCompleted,
                `Winner: ${match.winner?.name || 'None'}, Status: ${match.status}`
            );
        } catch (error) {
            this.logTest('Score Update - Winner Determined', false, `Error: ${error.message}`);
        }
    }

    testProgressiveRounds() {
        console.log('\n=== TESTING PROGRESSIVE ROUND CREATION ===');
        
        // Initialize 8-team bracket
        this.initializeBracket(8, 3);
        
        // Set up all first round matches
        for (let i = 0; i < 4; i++) {
            this.updateTeamSelection(1, `R1M${i + 1}`, 1, i * 2 + 1);
            this.updateTeamSelection(1, `R1M${i + 1}`, 2, i * 2 + 2);
        }

        // Test 1: Complete first match - should NOT create next round yet
        try {
            this.updateMatchScore(1, 'R1M1', 2, 0);
            const roundCount = this.bracketState.rounds.length;
            
            this.logTest('Single Match Completion - No New Round', 
                roundCount === 1,
                `Round count after single match: ${roundCount} (should be 1)`
            );
        } catch (error) {
            this.logTest('Single Match Completion - No New Round', false, `Error: ${error.message}`);
        }

        // Test 2: Complete remaining matches - should create Semi Finals
        try {
            this.updateMatchScore(1, 'R1M2', 2, 1);
            this.updateMatchScore(1, 'R1M3', 2, 0);
            this.updateMatchScore(1, 'R1M4', 2, 1);
            
            const roundCount = this.bracketState.rounds.length;
            const hasNextRound = roundCount === 2;
            const nextRound = this.bracketState.rounds[1];
            const correctName = nextRound && nextRound.name === 'Semi Finals';
            const correctMatches = nextRound && nextRound.matches.length === 2;
            
            this.logTest('Round 1 Complete - Semi Finals Created', 
                hasNextRound && correctName && correctMatches,
                `Created ${roundCount} rounds, next round: "${nextRound?.name || 'None'}" with ${nextRound?.matches.length || 0} matches`
            );
        } catch (error) {
            this.logTest('Round 1 Complete - Semi Finals Created', false, `Error: ${error.message}`);
        }

        // Test 3: Check winner advancement
        try {
            const semiMatch1 = this.bracketState.rounds[1].matches[0];
            const semiMatch2 = this.bracketState.rounds[1].matches[1];
            const advancedTeams = [semiMatch1.team1, semiMatch1.team2, semiMatch2.team1, semiMatch2.team2];
            const allAdvanced = advancedTeams.every(team => team !== null);
            
            this.logTest('Winner Advancement to Semi Finals', 
                allAdvanced,
                `Advanced teams: ${advancedTeams.map(t => t?.name || 'None').join(', ')}`
            );
        } catch (error) {
            this.logTest('Winner Advancement to Semi Finals', false, `Error: ${error.message}`);
        }
    }

    testCompleteFlow() {
        console.log('\n=== TESTING COMPLETE TOURNAMENT FLOW ===');
        
        // Initialize 8-team tournament
        this.initializeBracket(8, 3);
        
        // Round 1: Set up all matches
        const round1Teams = [1, 2, 3, 4, 5, 6, 7, 8];
        for (let i = 0; i < 4; i++) {
            this.updateTeamSelection(1, `R1M${i + 1}`, 1, round1Teams[i * 2]);
            this.updateTeamSelection(1, `R1M${i + 1}`, 2, round1Teams[i * 2 + 1]);
        }
        
        // Complete Round 1
        this.updateMatchScore(1, 'R1M1', 2, 0); // Team 1 wins
        this.updateMatchScore(1, 'R1M2', 2, 1); // Team 3 wins
        this.updateMatchScore(1, 'R1M3', 2, 0); // Team 5 wins
        this.updateMatchScore(1, 'R1M4', 2, 1); // Team 7 wins
        
        this.logTest('Round 1 Complete', this.bracketState.rounds.length === 2, 
            `Tournament progressed to ${this.bracketState.rounds.length} rounds`);

        // Complete Semi Finals
        this.updateMatchScore(2, 'R2M1', 2, 1); // Team 1 wins
        this.updateMatchScore(2, 'R2M2', 2, 0); // Team 5 wins
        
        this.logTest('Semi Finals Complete', this.bracketState.rounds.length === 3, 
            `Tournament progressed to ${this.bracketState.rounds.length} rounds`);

        // Complete Grand Final
        this.updateMatchScore(3, 'R3M1', 2, 1); // Team 1 wins tournament
        
        const grandFinal = this.bracketState.rounds[2].matches[0];
        const tournamentComplete = grandFinal.status === 'completed';
        const champion = grandFinal.winner;
        
        this.logTest('Tournament Complete', tournamentComplete && champion, 
            `Champion: ${champion?.name || 'None'}`);

        // Test final bracket structure
        const expectedStructure = [4, 2, 1]; // Round 1: 4 matches, Semi: 2 matches, Final: 1 match
        const actualStructure = this.bracketState.rounds.map(r => r.matches.length);
        const structureCorrect = JSON.stringify(expectedStructure) === JSON.stringify(actualStructure);
        
        this.logTest('Final Bracket Structure', structureCorrect, 
            `Expected: [${expectedStructure.join(', ')}], Got: [${actualStructure.join(', ')}]`);
    }

    testEdgeCases() {
        console.log('\n=== TESTING EDGE CASES ===');
        
        // Test 1: Minimum bracket (2 teams)
        try {
            this.initializeBracket(2, 1);
            const isGrandFinal = this.bracketState.rounds[0].name === 'Grand Final';
            const oneMatch = this.bracketState.rounds[0].matches.length === 1;
            
            this.logTest('2-Team Bracket Edge Case', isGrandFinal && oneMatch,
                `2-team bracket creates Grand Final with 1 match: ${isGrandFinal && oneMatch}`);
        } catch (error) {
            this.logTest('2-Team Bracket Edge Case', false, `Error: ${error.message}`);
        }

        // Test 2: Clear bracket functionality
        try {
            this.clearBracket();
            const isEmpty = this.bracketState.rounds.length === 0;
            
            this.logTest('Clear Bracket Functionality', isEmpty,
                `Bracket cleared: ${isEmpty} (${this.bracketState.rounds.length} rounds remaining)`);
        } catch (error) {
            this.logTest('Clear Bracket Functionality', false, `Error: ${error.message}`);
        }

        // Test 3: Invalid round/match IDs
        try {
            this.initializeBracket(4, 3);
            const invalidRound = this.updateTeamSelection(999, 'R1M1', 1, 1);
            const invalidMatch = this.updateTeamSelection(1, 'INVALID', 1, 1);
            
            this.logTest('Invalid ID Handling', !invalidRound && !invalidMatch,
                `Invalid operations properly rejected: ${!invalidRound && !invalidMatch}`);
        } catch (error) {
            this.logTest('Invalid ID Handling', false, `Error: ${error.message}`);
        }

        // Test 4: BO1 winner determination
        try {
            this.initializeBracket(4, 1);
            this.updateTeamSelection(1, 'R1M1', 1, 1);
            this.updateTeamSelection(1, 'R1M1', 2, 2);
            this.updateMatchScore(1, 'R1M1', 1, 0); // Should win immediately in BO1
            
            const match = this.bracketState.rounds[0].matches[0];
            const hasWinner = match.winner && match.status === 'completed';
            
            this.logTest('BO1 Immediate Winner', hasWinner,
                `BO1 match completed immediately: ${hasWinner}`);
        } catch (error) {
            this.logTest('BO1 Immediate Winner', false, `Error: ${error.message}`);
        }
    }

    runAllTests() {
        console.log('🏆 STARTING COMPREHENSIVE STANDALONEBRACKETBUILDER AUDIT');
        console.log('===========================================================');
        
        this.testResults = [];
        
        this.testBracketInitialization();
        this.testTeamSelection();
        this.testScoreUpdates();
        this.testProgressiveRounds();
        this.testCompleteFlow();
        this.testEdgeCases();
        
        this.generateReport();
    }

    generateReport() {
        console.log('\n🔍 COMPREHENSIVE TEST REPORT');
        console.log('============================');
        
        const passCount = this.testResults.filter(r => r.passed).length;
        const totalCount = this.testResults.length;
        const passRate = Math.round((passCount / totalCount) * 100);
        
        console.log(`\nOVERALL RESULTS:`);
        console.log(`✅ Passed: ${passCount}`);
        console.log(`❌ Failed: ${totalCount - passCount}`);
        console.log(`📊 Success Rate: ${passRate}%`);
        
        if (totalCount - passCount > 0) {
            console.log(`\nFAILED TESTS:`);
            this.testResults.filter(r => !r.passed).forEach(test => {
                console.log(`❌ ${test.name}: ${test.details}`);
            });
        }
        
        console.log(`\nFUNCTIONALITY ANALYSIS:`);
        console.log(`• Bracket Initialization: ${this.checkCategoryResults('Bracket')}`);
        console.log(`• Team Selection: ${this.checkCategoryResults('Team Selection')}`);
        console.log(`• Score Updates: ${this.checkCategoryResults('Score Update')}`);
        console.log(`• Progressive Rounds: ${this.checkCategoryResults('Round')}`);
        console.log(`• Complete Flow: ${this.checkCategoryResults('Complete')}`);
        console.log(`• Edge Cases: ${this.checkCategoryResults('Edge Case')}`);
        
        return {
            totalTests: totalCount,
            passedTests: passCount,
            failedTests: totalCount - passCount,
            successRate: passRate,
            results: this.testResults
        };
    }

    checkCategoryResults(category) {
        const categoryTests = this.testResults.filter(r => r.name.includes(category));
        const categoryPassed = categoryTests.filter(r => r.passed).length;
        return `${categoryPassed}/${categoryTests.length} passed`;
    }
}

// Export for Node.js if running in that environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BracketTestRunner;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.BracketTestRunner = BracketTestRunner;
}