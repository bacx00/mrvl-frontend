import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { 
    Trophy, Settings, Users, RefreshCw, Trash2,
    Eye, EyeOff, Edit2, Check, Plus, Save, Globe, Lock
} from 'lucide-react';

const StandaloneBracketBuilder = ({ eventId }) => {
    const { api, isAdmin, isModerator } = useAuth();
    
    // Bracket state - completely independent, no database connection
    const [bracketData, setBracketData] = useState({
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
    });

    const [selectedFormat, setSelectedFormat] = useState('single_elimination');
    const [selectedTeams, setSelectedTeams] = useState(8);
    const [selectedBestOf, setSelectedBestOf] = useState(3);
    const [editMode, setEditMode] = useState(false);
    const [availableTeams, setAvailableTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Check if user can edit (admin/moderator only)
    const canEdit = isAdmin() || isModerator();

    const formats = {
        single_elimination: {
            name: 'Single Elimination',
            description: 'Standard knockout bracket - Teams are eliminated after one loss'
        },
        double_elimination: {
            name: 'Double Elimination',
            description: 'Upper and lower bracket - Teams get a second chance after first loss'
        },
        round_robin: {
            name: 'Round Robin',
            description: 'Everyone plays everyone - All teams play each other once'
        },
        swiss: {
            name: 'Swiss System',
            description: 'Paired by record - Teams with similar records face each other'
        },
        gsl: {
            name: 'GSL Groups',
            description: '4-team double elim groups - Two advance from each group'
        },
        group_stage: {
            name: 'Group Stage + Playoffs',
            description: 'Groups phase followed by elimination playoffs'
        },
        league: {
            name: 'League Format',
            description: 'Season-long round robin with standings'
        },
        gauntlet: {
            name: 'Gauntlet',
            description: 'Lower seeds must win multiple matches to reach finals'
        }
    };

    const teamOptions = [2, 4, 6, 8, 12, 16, 20, 24, 32, 48, 64, 128, 256];
    
    const matchFormats = {
        bo1: { name: 'Best of 1', value: 1, description: 'Single game' },
        bo3: { name: 'Best of 3', value: 3, description: 'First to 2 wins' },
        bo5: { name: 'Best of 5', value: 5, description: 'First to 3 wins' },
        bo7: { name: 'Best of 7', value: 7, description: 'First to 4 wins (Grand Finals)' },
        ft3: { name: 'First to 3', value: 3, description: 'First to win 3 maps' },
        ft4: { name: 'First to 4', value: 4, description: 'First to win 4 maps (Finals)' }
    };

    // Fetch teams from database and load existing bracket if any
    useEffect(() => {
        const initializeData = async () => {
            // First fetch teams
            const teams = await fetchTeams();
            // Then load existing bracket (which needs teams data)
            if (eventId && teams) {
                await loadExistingBracket(teams);
            }
        };

        initializeData();
    }, [eventId]);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await api.get('/teams');
            const teams = response.data?.data || response.data || [];
            setAvailableTeams(teams);
            return teams;
        } catch (error) {
            console.error('Error fetching teams:', error);
            // Fallback to some default teams if API fails
            const fallbackTeams = [
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
            setAvailableTeams(fallbackTeams);
            return fallbackTeams;
        } finally {
            setLoading(false);
        }
    };

    // Load existing bracket from database
    const loadExistingBracket = async (teamsData = null) => {
        try {
            // Use provided teams data or fall back to state
            const teams = teamsData || availableTeams;

            // Try both endpoints to get bracket data
            let bracketInfo = null;

            // First try the bracket endpoint
            try {
                const bracketResponse = await api.get(`/events/${eventId}/bracket`);
                if (bracketResponse.data?.data?.bracket) {
                    bracketInfo = bracketResponse.data.data.bracket;
                    console.log('✅ Loaded bracket from /bracket endpoint');
                }
            } catch (e) {
                console.log('📝 Bracket endpoint not available, trying event endpoint');
            }

            // If no bracket from bracket endpoint, try event endpoint
            let eventData = null;
            if (!bracketInfo) {
                const response = await api.get(`/events/${eventId}`);
                eventData = response.data?.data || response.data;

                if (eventData.bracket_data) {
                    bracketInfo = eventData.bracket_data;
                    console.log('✅ Loaded bracket from event.bracket_data');
                } else if (eventData.bracket) {
                    bracketInfo = eventData.bracket;
                    console.log('✅ Loaded bracket from event.bracket');
                }
            }

            // If we found bracket data, load it
            if (bracketInfo && (bracketInfo.rounds?.length > 0 || bracketInfo.matches?.length > 0)) {
                console.log('🔍 Processing bracket data with team resolution');
                console.log('🔍 Available teams for resolution:', teams);

                // Helper function to resolve team ID to team object
                const resolveTeam = (teamId) => {
                    if (!teamId) return null;
                    // Try to find team in provided teams
                    const team = teams.find(t => t.id === teamId || t.id === parseInt(teamId));
                    if (team) {
                        console.log(`✅ Resolved team ${teamId} to ${team.name}`);
                        return team;
                    }

                    // If not found in teams, check bracket teams
                    if (bracketInfo.teams) {
                        const bracketTeam = bracketInfo.teams.find(t => t.id === teamId || t.id === parseInt(teamId));
                        if (bracketTeam) {
                            console.log(`✅ Resolved team ${teamId} from bracket teams to ${bracketTeam.name}`);
                            return bracketTeam;
                        }
                    }

                    console.log(`⚠️ Could not resolve team ${teamId}`);
                    return null;
                };

                // Process rounds and populate team names
                let processedRounds = [];
                if (bracketInfo.rounds && Array.isArray(bracketInfo.rounds)) {
                    processedRounds = bracketInfo.rounds.map(round => ({
                        ...round,
                        matches: round.matches ? round.matches.map(match => {
                            const team1 = match.team1_id ? resolveTeam(match.team1_id) : match.team1;
                            const team2 = match.team2_id ? resolveTeam(match.team2_id) : match.team2;

                            return {
                                ...match,
                                team1: team1,
                                team2: team2,
                                // Keep original IDs for reference
                                team1_id: match.team1_id || team1?.id,
                                team2_id: match.team2_id || team2?.id
                            };
                        }) : []
                    }));
                }

                console.log('✅ Processed rounds with team names:', processedRounds);

                // Restore all bracket properties
                setBracketData({
                    name: bracketInfo.name || eventData?.name || 'Tournament',
                    format: bracketInfo.format || bracketInfo.type || 'single_elimination',
                    rounds: processedRounds,
                    teams: bracketInfo.teams || [],
                    settings: bracketInfo.settings || {
                        bestOf: 3,
                        totalTeams: 8,
                        thirdPlace: false,
                        grandFinalReset: false
                    },
                    public: bracketInfo.public !== undefined ? bracketInfo.public : true
                });

                // Update UI state
                setSelectedFormat(bracketInfo.format || bracketInfo.type || 'single_elimination');
                setSelectedBestOf(bracketInfo.settings?.bestOf || 3);
                setSelectedTeams(bracketInfo.settings?.totalTeams || 8);
                setIsPublic(bracketInfo.public !== undefined ? bracketInfo.public : true);

                console.log('✅ Fully loaded existing bracket with all settings and team names');

                // Set edit mode to true so user can modify existing bracket
                setEditMode(true);
            } else {
                console.log('📝 No existing bracket found, starting fresh');
            }
        } catch (error) {
            console.error('Error loading bracket:', error);
        }
    };

    // Save bracket to database
    const saveBracket = async () => {
        if (!eventId || bracketData.rounds.length === 0) {
            alert('Please create a bracket first');
            return;
        }

        setSaving(true);
        setSaveSuccess(false);

        try {
            const bracketDataToSave = {
                ...bracketData,
                type: selectedFormat,
                public: isPublic,
                last_updated: new Date().toISOString()
            };

            console.log('🔄 Saving bracket data:', bracketDataToSave);
            console.log('🔄 Saving to URL:', `/admin/events/${eventId}`);

            // Save the bracket data to the event
            const response = await api.put(`/admin/events/${eventId}`, {
                bracket_data: bracketDataToSave
            });

            console.log('✅ Save response:', response.data);

            if (response.data.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                console.log('✅ Bracket saved successfully to database');
            }
        } catch (error) {
            console.error('❌ Error saving bracket:', error);
            console.error('❌ Error response:', error.response?.data);
            alert('Failed to save bracket: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    // Initialize bracket structure based on format
    const initializeBracket = () => {
        let bracketStructure = null;
        
        switch (selectedFormat) {
            case 'single_elimination':
                bracketStructure = createSingleEliminationBracket();
                break;
            case 'double_elimination':
                bracketStructure = createDoubleEliminationBracket();
                break;
            case 'round_robin':
                bracketStructure = createRoundRobinBracket();
                break;
            case 'swiss':
                bracketStructure = createSwissBracket();
                break;
            case 'gsl':
                bracketStructure = createGSLGroupsBracket();
                break;
            case 'group_stage':
                bracketStructure = createGroupStageBracket();
                break;
            case 'league':
                bracketStructure = createLeagueBracket();
                break;
            case 'gauntlet':
                bracketStructure = createGauntletBracket();
                break;
            default:
                bracketStructure = createSingleEliminationBracket();
        }
        
        setBracketData({
            ...bracketData,
            format: selectedFormat,
            ...bracketStructure,
            settings: {
                ...bracketData.settings,
                bestOf: selectedBestOf,
                totalTeams: selectedTeams
            }
        });
    };
    
    // Single Elimination bracket
    const createSingleEliminationBracket = () => {
        const rounds = [];
        const matchesInFirstRound = selectedTeams / 2;
        
        const firstRound = {
            id: 1,
            name: getRoundName(1, Math.log2(selectedTeams)),
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
                bestOf: selectedBestOf,
                status: 'pending'
            });
        }
        
        rounds.push(firstRound);
        return { rounds, type: 'single_elimination' };
    };
    
    // Double Elimination bracket
    const createDoubleEliminationBracket = () => {
        const upperBracket = [];
        const lowerBracket = [];
        const matchesInFirstRound = selectedTeams / 2;
        
        // Upper bracket first round
        const upperRound1 = {
            id: 1,
            name: 'Upper Bracket Round 1',
            bracket: 'upper',
            matches: []
        };
        
        for (let m = 0; m < matchesInFirstRound; m++) {
            upperRound1.matches.push({
                id: `UBR1M${m + 1}`,
                matchNumber: m + 1,
                team1: null,
                team2: null,
                score1: 0,
                score2: 0,
                winner: null,
                loser: null,
                bestOf: selectedBestOf,
                status: 'pending',
                bracket: 'upper'
            });
        }
        
        upperBracket.push(upperRound1);
        
        // Lower bracket will be populated as teams lose
        return { 
            rounds: [upperRound1], 
            upperBracket,
            lowerBracket,
            type: 'double_elimination'
        };
    };
    
    // Round Robin bracket
    const createRoundRobinBracket = () => {
        const rounds = [];
        let matchId = 1;
        
        // Generate all matches where each team plays every other team once
        for (let i = 0; i < selectedTeams; i++) {
            for (let j = i + 1; j < selectedTeams; j++) {
                const roundNum = Math.floor(matchId / (selectedTeams / 2)) + 1;
                
                if (!rounds[roundNum - 1]) {
                    rounds[roundNum - 1] = {
                        id: roundNum,
                        name: `Round ${roundNum}`,
                        matches: []
                    };
                }
                
                rounds[roundNum - 1].matches.push({
                    id: `RRM${matchId}`,
                    matchNumber: matchId,
                    team1: null,
                    team2: null,
                    score1: 0,
                    score2: 0,
                    winner: null,
                    bestOf: selectedBestOf,
                    status: 'pending'
                });
                matchId++;
            }
        }
        
        return { rounds, type: 'round_robin', standings: [] };
    };
    
    // Swiss System bracket
    const createSwissBracket = () => {
        const totalRounds = Math.ceil(Math.log2(selectedTeams));
        const rounds = [];
        
        // Create first round with random pairings
        const firstRound = {
            id: 1,
            name: 'Swiss Round 1',
            matches: []
        };
        
        const matchesInRound = Math.floor(selectedTeams / 2);
        for (let m = 0; m < matchesInRound; m++) {
            firstRound.matches.push({
                id: `SR1M${m + 1}`,
                matchNumber: m + 1,
                team1: null,
                team2: null,
                score1: 0,
                score2: 0,
                winner: null,
                bestOf: selectedBestOf,
                status: 'pending'
            });
        }
        
        rounds.push(firstRound);
        return { rounds, type: 'swiss', totalSwissRounds: totalRounds };
    };
    
    // GSL Groups format
    const createGSLGroupsBracket = () => {
        const numGroups = Math.floor(selectedTeams / 4);
        const groups = [];
        
        for (let g = 0; g < numGroups; g++) {
            const group = {
                id: g + 1,
                name: `Group ${String.fromCharCode(65 + g)}`, // A, B, C, etc.
                teams: [],
                matches: []
            };
            
            // Each group has 6 matches in GSL format
            const matchTypes = [
                { name: 'Opening Match 1', id: `G${g+1}M1` },
                { name: 'Opening Match 2', id: `G${g+1}M2` },
                { name: 'Winners Match', id: `G${g+1}M3` },
                { name: 'Losers Match', id: `G${g+1}M4` },
                { name: 'Decider Match', id: `G${g+1}M5` }
            ];
            
            matchTypes.forEach(mt => {
                group.matches.push({
                    id: mt.id,
                    name: mt.name,
                    team1: null,
                    team2: null,
                    score1: 0,
                    score2: 0,
                    winner: null,
                    bestOf: selectedBestOf,
                    status: 'pending'
                });
            });
            
            groups.push(group);
        }
        
        return { groups, rounds: [], type: 'gsl' };
    };
    
    // Group Stage + Playoffs
    const createGroupStageBracket = () => {
        const numGroups = Math.min(4, Math.floor(selectedTeams / 4));
        const groups = [];
        
        for (let g = 0; g < numGroups; g++) {
            groups.push({
                id: g + 1,
                name: `Group ${String.fromCharCode(65 + g)}`,
                teams: [],
                matches: [],
                standings: []
            });
        }
        
        return { 
            groups, 
            rounds: [], // Playoffs will be added after group stage
            type: 'group_stage',
            stage: 'groups' 
        };
    };
    
    // League format (season-long round robin)
    const createLeagueBracket = () => {
        return {
            ...createRoundRobinBracket(),
            type: 'league',
            standings: [],
            weeks: Math.ceil((selectedTeams * (selectedTeams - 1) / 2) / 4) // Estimate weeks
        };
    };
    
    // Gauntlet format
    const createGauntletBracket = () => {
        const rounds = [];
        let remainingTeams = selectedTeams;
        let roundNum = 1;
        
        // Lower seeds must win multiple matches to reach finals
        while (remainingTeams > 2) {
            const round = {
                id: roundNum,
                name: `Gauntlet Round ${roundNum}`,
                matches: []
            };
            
            // Bottom two teams play
            round.matches.push({
                id: `GR${roundNum}M1`,
                matchNumber: 1,
                team1: null,
                team2: null,
                score1: 0,
                score2: 0,
                winner: null,
                bestOf: selectedBestOf,
                status: 'pending',
                description: `Seed ${remainingTeams} vs Seed ${remainingTeams - 1}`
            });
            
            rounds.push(round);
            remainingTeams--;
            roundNum++;
        }
        
        // Final match
        rounds.push({
            id: roundNum,
            name: 'Gauntlet Final',
            matches: [{
                id: `GR${roundNum}M1`,
                matchNumber: 1,
                team1: null,
                team2: null,
                score1: 0,
                score2: 0,
                winner: null,
                bestOf: selectedBestOf === 7 ? 7 : 5, // Grand finals are typically Bo5 or Bo7
                status: 'pending',
                description: 'Top Seed vs Gauntlet Winner'
            }]
        });
        
        return { rounds, type: 'gauntlet' };
    };

    const getRoundName = (round, totalRounds) => {
        const reverseRound = totalRounds - round + 1;
        if (reverseRound === 1) return 'Grand Final';
        if (reverseRound === 2) return 'Semi Finals';
        if (reverseRound === 3) return 'Quarter Finals';
        if (reverseRound === 4) return 'Round of 16';
        if (reverseRound === 5) return 'Round of 32';
        return `Round ${round}`;
    };

    // Clear bracket
    const clearBracket = () => {
        setBracketData({
            ...bracketData,
            rounds: []
        });
    };

    // Create next round when needed - returns updated rounds array synchronously
    const createNextRound = (currentBracketData, currentRoundId) => {
        const currentRound = currentBracketData.rounds.find(r => r.id === currentRoundId);
        if (!currentRound) return currentBracketData;

        // Check if all matches in current round are completed
        const allCompleted = currentRound.matches.every(m => m.status === 'completed');
        if (!allCompleted) return currentBracketData;

        // Check if next round already exists
        const nextRoundId = currentRoundId + 1;
        if (currentBracketData.rounds.find(r => r.id === nextRoundId)) return currentBracketData;

        // Calculate how many matches in next round
        const matchesInNextRound = Math.floor(currentRound.matches.length / 2);
        if (matchesInNextRound < 1) return currentBracketData; // Tournament is complete

        const totalRounds = Math.log2(currentBracketData.settings.totalTeams);
        const newRound = {
            id: nextRoundId,
            name: getRoundName(nextRoundId, totalRounds),
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
                bestOf: selectedBestOf,
                status: 'pending'
            });
        }

        const newRounds = [...currentBracketData.rounds, newRound];
        return { ...currentBracketData, rounds: newRounds };
    };

    // Update team selection
    const updateTeamSelection = (roundId, matchId, slot, teamId) => {
        const newRounds = [...bracketData.rounds];
        const round = newRounds.find(r => r.id === roundId);
        const match = round.matches.find(m => m.id === matchId);
        
        const selectedTeam = availableTeams.find(t => t.id === parseInt(teamId));
        
        if (slot === 1) {
            match.team1 = selectedTeam || null;
        } else {
            match.team2 = selectedTeam || null;
        }
        
        // Update status if both teams are selected
        if (match.team1 && match.team2 && match.status === 'pending') {
            match.status = 'live';
        }
        
        setBracketData({ ...bracketData, rounds: newRounds });
    };

    // Update match score
    const updateMatchScore = (roundId, matchId, team1Score, team2Score) => {
        const newRounds = [...bracketData.rounds];
        const round = newRounds.find(r => r.id === roundId);
        const match = round.matches.find(m => m.id === matchId);
        
        match.score1 = team1Score;
        match.score2 = team2Score;
        
        // Determine winner
        const maxScore = Math.ceil(match.bestOf / 2);
        if (team1Score >= maxScore) {
            match.winner = match.team1;
            match.status = 'completed';
            
            // Create updated bracket data with current match results
            const updatedBracketData = { ...bracketData, rounds: newRounds };
            
            // First, create next round if needed (synchronous operation)
            const bracketWithNextRound = createNextRound(updatedBracketData, roundId);
            
            // Then, advance winner to the next round (synchronous operation)
            const finalBracketData = advanceWinner(bracketWithNextRound, roundId, matchId, match.team1);
            
            // Update state with all changes at once
            setBracketData(finalBracketData);
        } else if (team2Score >= maxScore) {
            match.winner = match.team2;
            match.status = 'completed';
            
            // Create updated bracket data with current match results
            const updatedBracketData = { ...bracketData, rounds: newRounds };
            
            // First, create next round if needed (synchronous operation)
            const bracketWithNextRound = createNextRound(updatedBracketData, roundId);
            
            // Then, advance winner to the next round (synchronous operation)
            const finalBracketData = advanceWinner(bracketWithNextRound, roundId, matchId, match.team2);
            
            // Update state with all changes at once
            setBracketData(finalBracketData);
        } else {
            match.winner = null;
            match.status = match.team1 && match.team2 ? 'live' : 'pending';
            setBracketData({ ...bracketData, rounds: newRounds });
        }
    };

    // Update Best of value for a match
    const updateBestOf = (roundId, matchId, bestOfValue) => {
        const newRounds = [...bracketData.rounds];
        const round = newRounds.find(r => r.id === roundId);
        const match = round.matches.find(m => m.id === matchId);

        match.bestOf = bestOfValue;

        // Reset scores if they exceed the new bestOf limit
        const maxScore = Math.ceil(bestOfValue / 2);
        if (match.score1 >= maxScore || match.score2 >= maxScore) {
            match.score1 = 0;
            match.score2 = 0;
            match.winner = null;
            match.status = match.team1 && match.team2 ? 'live' : 'pending';
        }

        setBracketData({ ...bracketData, rounds: newRounds });
    };

    // Advance winner to next round - returns updated bracket data
    const advanceWinner = (currentBracketData, roundId, matchId, winner) => {
        if (!winner) return currentBracketData;
        
        const nextRound = currentBracketData.rounds.find(r => r.id === roundId + 1);
        if (!nextRound) return currentBracketData;
        
        // Find which match in next round this winner goes to
        const currentMatchNumber = parseInt(matchId.split('M')[1]);
        const nextMatchNumber = Math.ceil(currentMatchNumber / 2);
        const nextMatch = nextRound.matches.find(m => m.matchNumber === nextMatchNumber);
        
        if (nextMatch) {
            // Create a deep copy to avoid mutations
            const updatedRounds = currentBracketData.rounds.map(round => {
                if (round.id === roundId + 1) {
                    return {
                        ...round,
                        matches: round.matches.map(match => {
                            if (match.matchNumber === nextMatchNumber) {
                                const updatedMatch = { ...match };
                                if (currentMatchNumber % 2 === 1) {
                                    updatedMatch.team1 = winner;
                                } else {
                                    updatedMatch.team2 = winner;
                                }
                                
                                // Update match status if both teams are set
                                if (updatedMatch.team1 && updatedMatch.team2 && updatedMatch.status === 'pending') {
                                    updatedMatch.status = 'live';
                                }
                                
                                return updatedMatch;
                            }
                            return match;
                        })
                    };
                }
                return round;
            });
            
            return { ...currentBracketData, rounds: updatedRounds };
        }
        
        return currentBracketData;
    };

    return (
        <div className="standalone-bracket-builder bg-gray-900 rounded-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    {canEdit ? 'Manual Bracket Moderator' : 'Live Tournament Bracket'}
                </h2>
                <div className="flex gap-2">
                    {canEdit && (
                        <>
                            {/* Public/Private Toggle */}
                            <button
                                onClick={() => setIsPublic(!isPublic)}
                                className={`px-3 py-2 rounded flex items-center gap-2 ${
                                    isPublic
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-600 text-white hover:bg-gray-500'
                                }`}
                                title={isPublic ? 'Bracket is PUBLIC' : 'Bracket is PRIVATE'}
                            >
                                {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                                {isPublic ? 'Public' : 'Private'}
                            </button>

                            {/* Save Button */}
                            {bracketData.rounds.length > 0 && (
                                <button
                                    onClick={saveBracket}
                                    disabled={saving}
                                    className={`px-4 py-2 rounded flex items-center gap-2 ${
                                        saveSuccess
                                            ? 'bg-green-600 text-white'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : saveSuccess ? (
                                        <>
                                            <Check size={18} />
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save to Database
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Edit Mode Toggle */}
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className={`px-4 py-2 rounded flex items-center gap-2 ${
                                    editMode ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                                }`}
                            >
                                {editMode ? <EyeOff size={18} /> : <Edit2 size={18} />}
                                {editMode ? 'View Mode' : 'Edit Mode'}
                            </button>
                        </>
                    )}
                    {!canEdit && (
                        <div className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
                            <Eye size={18} />
                            Live View
                        </div>
                    )}
                </div>
            </div>

            {/* Configuration Panel - Only show if can edit and no bracket exists */}
            {canEdit && editMode && bracketData.rounds.length === 0 && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Settings size={20} />
                        Bracket Configuration
                    </h3>
                    
                    <div className="grid grid-cols-4 gap-4">
                        {/* Format */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Format</label>
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                            >
                                {Object.entries(formats).map(([key, format]) => (
                                    <option key={key} value={key}>{format.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Number of Teams */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Number of Teams</label>
                            <select
                                value={selectedTeams}
                                onChange={(e) => setSelectedTeams(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                            >
                                {teamOptions.map(num => (
                                    <option key={num} value={num}>{num} teams</option>
                                ))}
                            </select>
                        </div>

                        {/* Match Format */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Match Format</label>
                            <select
                                value={selectedBestOf}
                                onChange={(e) => setSelectedBestOf(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                            >
                                {Object.entries(matchFormats).map(([key, format]) => (
                                    <option key={key} value={format.value} title={format.description}>
                                        {format.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Generate Button */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">&nbsp;</label>
                            <button
                                onClick={initializeBracket}
                                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Create Bracket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bracket Display */}
            <div className="bracket-container overflow-x-auto">
                {bracketData.rounds.length > 0 ? (
                    <div className="flex gap-8 min-w-max p-4">
                        {bracketData.rounds.map((round, roundIndex) => (
                            <div key={round.id} className="round-column">
                                <h3 className="text-center text-white font-semibold mb-4">
                                    {round.name}
                                </h3>
                                <div className={`space-y-${Math.min(8, Math.pow(2, roundIndex + 1))}`}>
                                    {round.matches.map(match => (
                                        <MatchBox
                                            key={match.id}
                                            match={match}
                                            roundId={round.id}
                                            editMode={editMode && canEdit}
                                            availableTeams={availableTeams}
                                            onTeamSelect={updateTeamSelection}
                                            onScoreUpdate={updateMatchScore}
                                            onBestOfChange={updateBestOf}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg mb-4">
                            {canEdit ? 'No bracket created yet' : 'No bracket available'}
                        </p>
                        {canEdit && !editMode && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Enter Edit Mode to Create Bracket
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            {bracketData.rounds.length > 0 && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Legend</h4>
                    <div className="flex gap-6 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-700 rounded"></div>
                            Pending
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                            Live
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-600 rounded"></div>
                            Completed
                        </span>
                    </div>
                    
                    {/* Clear control */}
                    {canEdit && editMode && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <button
                                onClick={clearBracket}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                            >
                                <Trash2 size={14} />
                                Clear Bracket
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Match Box Component
const MatchBox = ({ match, roundId, editMode, availableTeams, onTeamSelect, onScoreUpdate, onBestOfChange }) => {
    const [editingScore, setEditingScore] = useState(false);
    const [tempScores, setTempScores] = useState({ score1: match.score1, score2: match.score2 });

    // Update temp scores when match scores change
    useEffect(() => {
        setTempScores({ score1: match.score1, score2: match.score2 });
    }, [match.score1, match.score2]);

    const saveScores = () => {
        onScoreUpdate(roundId, match.id, tempScores.score1, tempScores.score2);
        setEditingScore(false);
    };

    const getStatusColor = () => {
        if (match.status === 'completed') return 'border-green-600';
        if (match.status === 'live') return 'border-yellow-600';
        return 'border-gray-600';
    };

    return (
        <div className={`bg-gray-800 rounded-lg p-3 mb-4 border-2 ${getStatusColor()} min-w-[250px]`}>
            <div className="text-xs text-gray-400 mb-2 flex justify-between">
                <span>Match {match.matchNumber}</span>
                {editMode ? (
                    <select
                        value={match.bestOf || 3}
                        onChange={(e) => onBestOfChange(roundId, match.id, parseInt(e.target.value))}
                        className="bg-gray-600 text-blue-400 rounded px-1 text-xs"
                    >
                        <option value={1}>BO1</option>
                        <option value={3}>BO3</option>
                        <option value={5}>BO5</option>
                        <option value={7}>BO7</option>
                        <option value={9}>BO9</option>
                    </select>
                ) : (
                    <span className="text-blue-400">BO{match.bestOf}</span>
                )}
            </div>

            {/* Team 1 */}
            <div className={`flex items-center justify-between p-2 rounded mb-1 ${
                match.winner === match.team1 ? 'bg-green-900/30' : 'bg-gray-700'
            }`}>
                <div className="flex-grow">
                    {editMode ? (
                        <select
                            value={match.team1?.id || ''}
                            onChange={(e) => onTeamSelect(roundId, match.id, 1, e.target.value)}
                            className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
                        >
                            <option value="">Select Team</option>
                            {availableTeams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className="text-sm text-white">
                            {match.team1?.name || 'TBD'}
                        </span>
                    )}
                </div>
                <div className="ml-3">
                    {editingScore ? (
                        <input
                            type="number"
                            value={tempScores.score1}
                            onChange={(e) => setTempScores({ ...tempScores, score1: parseInt(e.target.value) || 0 })}
                            className="w-12 px-1 py-0 bg-gray-600 text-white rounded text-center"
                            min="0"
                            max={match.bestOf}
                        />
                    ) : (
                        <span className="text-white font-bold">{match.score1}</span>
                    )}
                </div>
            </div>

            {/* Team 2 */}
            <div className={`flex items-center justify-between p-2 rounded ${
                match.winner === match.team2 ? 'bg-green-900/30' : 'bg-gray-700'
            }`}>
                <div className="flex-grow">
                    {editMode ? (
                        <select
                            value={match.team2?.id || ''}
                            onChange={(e) => onTeamSelect(roundId, match.id, 2, e.target.value)}
                            className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
                        >
                            <option value="">Select Team</option>
                            {availableTeams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className="text-sm text-white">
                            {match.team2?.name || 'TBD'}
                        </span>
                    )}
                </div>
                <div className="ml-3">
                    {editingScore ? (
                        <input
                            type="number"
                            value={tempScores.score2}
                            onChange={(e) => setTempScores({ ...tempScores, score2: parseInt(e.target.value) || 0 })}
                            className="w-12 px-1 py-0 bg-gray-600 text-white rounded text-center"
                            min="0"
                            max={match.bestOf}
                        />
                    ) : (
                        <span className="text-white font-bold">{match.score2}</span>
                    )}
                </div>
            </div>

            {/* Score Edit Controls */}
            {editMode && match.team1 && match.team2 && (
                <div className="mt-2 flex justify-center">
                    {editingScore ? (
                        <div className="flex gap-2">
                            <button
                                onClick={saveScores}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setEditingScore(false);
                                    setTempScores({ score1: match.score1, score2: match.score2 });
                                }}
                                className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setEditingScore(true)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                        >
                            Update Score
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default StandaloneBracketBuilder;