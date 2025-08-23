import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { 
    Trophy, Settings, Users, RefreshCw, Trash2,
    Eye, EyeOff, Edit2, Check, Plus
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

    // Check if user can edit (admin/moderator only)
    const canEdit = isAdmin() || isModerator();

    const formats = {
        single_elimination: {
            name: 'Single Elimination',
            description: 'Standard knockout bracket'
        },
        double_elimination: {
            name: 'Double Elimination',
            description: 'Upper and lower bracket'
        },
        round_robin: {
            name: 'Round Robin',
            description: 'Everyone plays everyone'
        },
        swiss: {
            name: 'Swiss System',
            description: 'Paired by record'
        },
        gsl: {
            name: 'GSL Groups',
            description: '4-team double elim groups'
        }
    };

    const teamOptions = [2, 4, 8, 16, 32, 64];

    // Fetch teams from database
    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await api.get('/teams');
            const teams = response.data?.data || response.data || [];
            setAvailableTeams(teams);
        } catch (error) {
            console.error('Error fetching teams:', error);
            // Fallback to some default teams if API fails
            setAvailableTeams([
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
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Initialize bracket structure - only create first round
    const initializeBracket = () => {
        const rounds = [];
        const matchesInFirstRound = selectedTeams / 2;
        
        // Only create the first round initially
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
        
        setBracketData({
            ...bracketData,
            format: selectedFormat,
            rounds: rounds,
            settings: {
                ...bracketData.settings,
                bestOf: selectedBestOf,
                totalTeams: selectedTeams
            }
        });
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
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`px-4 py-2 rounded flex items-center gap-2 ${
                                editMode ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                            }`}
                        >
                            {editMode ? <EyeOff size={18} /> : <Edit2 size={18} />}
                            {editMode ? 'View Mode' : 'Edit Mode'}
                        </button>
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

                        {/* Best Of */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Best Of</label>
                            <select
                                value={selectedBestOf}
                                onChange={(e) => setSelectedBestOf(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                            >
                                <option value={1}>BO1</option>
                                <option value={3}>BO3</option>
                                <option value={5}>BO5</option>
                                <option value={7}>BO7</option>
                                <option value={9}>BO9</option>
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
const MatchBox = ({ match, roundId, editMode, availableTeams, onTeamSelect, onScoreUpdate }) => {
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
                <span className="text-blue-400">BO{match.bestOf}</span>
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