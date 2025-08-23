import React, { useState, useEffect } from 'react';
import { 
    Trophy, Plus, Edit2, Trash2, Save, 
    ChevronRight, Users, Calendar, Settings,
    AlertCircle, CheckCircle, Map, Gamepad2
} from 'lucide-react';
import { useAuth } from '../../hooks';

const ManualBracketSystem = ({ eventId, onUpdate }) => {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateMatch, setShowCreateMatch] = useState(false);
    const [bracketStage, setBracketStage] = useState(null);
    const [selectedGameMode, setSelectedGameMode] = useState('domination');
    const { api } = useAuth();

    // Marvel Rivals Game Modes
    const gameModes = {
        domination: {
            name: 'Domination',
            type: 'control',
            description: 'Teams fight to control a single point (King of the Hill)',
            format: 'Best of 3 rounds - First to capture 2 rounds wins',
            maps: [
                'Shin-Shibuya', 'Spider Islands', 'Hydra Base',
                'Knossos', 'Sanctum Sanctorum'
            ]
        },
        convoy: {
            name: 'Convoy',
            type: 'payload',
            description: 'Escort or stop the convoy (Payload)',
            format: 'Attack/Defend - Team that pushes furthest wins',
            maps: [
                'Tokyo 2099: Shinjuku', 'Klyntar', 'Midtown Manhattan',
                'Asgard', 'Vibranium Mines'
            ]
        },
        convergence: {
            name: 'Convergence',
            type: 'hybrid',
            description: 'Capture point then escort convoy (Hybrid)',
            format: 'Attack/Defend - Team that progresses furthest wins',
            maps: [
                'Yggsgard: Yggdrasil Path', 'Wakanda: Birnin T\'Challa', 'Hell\'s Heaven',
                'Sokovia', 'Intergalactic Empire of Wakanda', 'Sanctum Sanctorum: Sealed',
                'Lunar Base', 'Soul World'
            ]
        }
    };

    const formats = [
        { value: 'single_elimination', label: 'Single Elimination', description: 'One loss and you\'re out' },
        { value: 'double_elimination', label: 'Double Elimination', description: 'Upper and lower bracket system' },
        { value: 'round_robin', label: 'Round Robin', description: 'Every team plays every team' },
        { value: 'swiss', label: 'Swiss System', description: 'Paired based on performance' },
        { value: 'gsl', label: 'GSL Groups', description: 'Groups with winners/elimination matches' },
        { value: 'groups', label: 'Group Stage', description: 'Multiple round-robin groups' },
        { value: 'ladder', label: 'Ladder/League', description: 'Ongoing seasonal format' },
        { value: 'custom', label: 'Custom Format', description: 'Manual bracket creation' }
    ];

    const bestOfOptions = [
        { value: 1, label: 'BO1', description: 'Single game' },
        { value: 3, label: 'BO3', description: 'First to 2' },
        { value: 5, label: 'BO5', description: 'First to 3' },
        { value: 7, label: 'BO7', description: 'First to 4' },
        { value: 9, label: 'BO9', description: 'First to 5' }
    ];

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [matchesRes, eventRes] = await Promise.all([
                api.get(`/admin/events/${eventId}/bracket/manual/matches`),
                api.get(`/admin/events/${eventId}`)
            ]);

            setMatches(matchesRes.data.data || []);
            // Handle different possible team data structures
            const eventData = eventRes.data.data || eventRes.data;
            let teamsData = [];
            
            console.log('Event data structure:', eventData);
            
            if (eventData.teams && Array.isArray(eventData.teams)) {
                teamsData = eventData.teams;
                console.log('Found teams in eventData.teams:', teamsData);
            } else if (eventData.participating_teams && Array.isArray(eventData.participating_teams)) {
                teamsData = eventData.participating_teams;
                console.log('Found teams in eventData.participating_teams:', teamsData);
            } else if (eventData.event_teams && Array.isArray(eventData.event_teams)) {
                teamsData = eventData.event_teams;
                console.log('Found teams in eventData.event_teams:', teamsData);
            } else {
                // Try to find teams in nested objects
                console.log('Teams not found in expected locations, searching nested objects...');
                const searchForTeams = (obj, path = '') => {
                    if (Array.isArray(obj) && obj.length > 0 && obj[0].name) {
                        console.log(`Found potential teams array at path: ${path}`, obj);
                        return obj;
                    }
                    if (typeof obj === 'object' && obj !== null) {
                        for (const [key, value] of Object.entries(obj)) {
                            if (key.toLowerCase().includes('team')) {
                                const result = searchForTeams(value, `${path}.${key}`);
                                if (result) return result;
                            }
                        }
                    }
                    return null;
                };
                
                const foundTeams = searchForTeams(eventData);
                if (foundTeams) {
                    teamsData = foundTeams;
                    console.log('Found teams via nested search:', teamsData);
                }
            }
            
            console.log('Final teams data:', teamsData);
            setTeams(teamsData);
        } catch (error) {
            console.error('Error fetching bracket data:', error);
            alert('Failed to load bracket data');
        } finally {
            setLoading(false);
        }
    };

    const createBracketStage = async (stageData) => {
        try {
            const response = await api.post(`/admin/events/${eventId}/bracket/manual/stage`, {
                ...stageData,
                settings: {
                    ...stageData.settings,
                    game_modes: Object.keys(gameModes),
                    default_mode: selectedGameMode
                }
            });
            setBracketStage(response.data.data);
            console.log('Bracket stage created successfully');
            return response.data.data;
        } catch (error) {
            console.error('Error creating bracket stage:', error);
            alert('Failed to create bracket stage');
            throw error;
        }
    };

    const createMatch = async (matchData) => {
        try {
            const enhancedMatchData = {
                ...matchData,
                match_details: {
                    game_mode: selectedGameMode,
                    map_pool: gameModes[selectedGameMode].maps
                }
            };
            const response = await api.post(`/admin/events/${eventId}/bracket/manual/match`, enhancedMatchData);
            setMatches([...matches, response.data.data]);
            console.log('Match created successfully');
            setShowCreateMatch(false);
        } catch (error) {
            console.error('Error creating match:', error);
            alert('Failed to create match');
        }
    };

    const updateMatch = async (matchId, matchData) => {
        try {
            const response = await api.put(`/admin/events/${eventId}/bracket/manual/match/${matchId}`, matchData);
            setMatches(matches.map(m => m.id === matchId ? response.data.data : m));
            console.log('Match updated successfully');
        } catch (error) {
            console.error('Error updating match:', error);
            alert('Failed to update match');
        }
    };

    const setMatchScores = async (matchId, scores) => {
        try {
            const response = await api.post(`/admin/events/${eventId}/bracket/manual/match/${matchId}/scores`, scores);
            setMatches(matches.map(m => m.id === matchId ? response.data.data : m));
            console.log('Scores updated successfully');
        } catch (error) {
            console.error('Error setting scores:', error);
            alert('Failed to set scores');
        }
    };

    const deleteMatch = async (matchId) => {
        if (!window.confirm('Are you sure you want to delete this match?')) return;

        try {
            await api.delete(`/admin/events/${eventId}/bracket/manual/match/${matchId}`);
            setMatches(matches.filter(m => m.id !== matchId));
            console.log('Match deleted successfully');
        } catch (error) {
            console.error('Error deleting match:', error);
            alert('Failed to delete match');
        }
    };

    const bulkCreateMatches = async (matchesData) => {
        try {
            const enhancedMatches = matchesData.map(match => ({
                ...match,
                match_details: {
                    game_mode: selectedGameMode,
                    map_pool: gameModes[selectedGameMode].maps
                }
            }));
            const response = await api.post(`/admin/events/${eventId}/bracket/manual/matches/bulk`, { 
                matches: enhancedMatches 
            });
            setMatches([...matches, ...response.data.data]);
            console.log(`${response.data.data.length} matches created successfully`);
        } catch (error) {
            console.error('Error creating bulk matches:', error);
            alert('Failed to create matches');
        }
    };

    const resetBracket = async () => {
        if (!window.confirm('Are you sure you want to reset the entire bracket? This will delete all matches and stages.')) return;

        try {
            await api.post(`/admin/events/${eventId}/bracket/manual/reset`);
            setMatches([]);
            setBracketStage(null);
            console.log('Bracket reset successfully');
            fetchData();
        } catch (error) {
            console.error('Error resetting bracket:', error);
            alert('Failed to reset bracket');
        }
    };

    const generateRoundRobinMatches = () => {
        const matchesData = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                matchesData.push({
                    round_number: 1,
                    match_number: matchesData.length + 1,
                    team1_id: teams[i].id,
                    team2_id: teams[j].id,
                    best_of: 3
                });
            }
        }
        bulkCreateMatches(matchesData);
    };

    const generateSingleEliminationMatches = () => {
        const rounds = Math.ceil(Math.log2(teams.length));
        const matchesData = [];
        let matchNumber = 1;

        // First round with seeded teams
        for (let i = 0; i < teams.length; i += 2) {
            if (teams[i + 1]) {
                matchesData.push({
                    round_number: 1,
                    match_number: matchNumber++,
                    team1_id: teams[i].id,
                    team2_id: teams[i + 1].id,
                    best_of: 3
                });
            }
        }

        // Subsequent rounds (empty matches)
        for (let round = 2; round <= rounds; round++) {
            const matchesInRound = Math.pow(2, rounds - round);
            for (let i = 0; i < matchesInRound; i++) {
                matchesData.push({
                    round_number: round,
                    match_number: matchNumber++,
                    team1_id: null,
                    team2_id: null,
                    best_of: round === rounds ? 7 : (round === rounds - 1 ? 5 : 3) // Finals BO7, Semis BO5, rest BO3
                });
            }
        }

        bulkCreateMatches(matchesData);
    };

    const generateDoubleEliminationMatches = () => {
        const teamCount = teams.length;
        const matchesData = [];
        let matchNumber = 1;

        // Upper Bracket Round 1
        for (let i = 0; i < teamCount; i += 2) {
            if (teams[i + 1]) {
                matchesData.push({
                    round_number: 1,
                    match_number: matchNumber++,
                    team1_id: teams[i].id,
                    team2_id: teams[i + 1].id,
                    best_of: 3,
                    bracket_type: 'upper'
                });
            }
        }

        // Generate subsequent upper bracket rounds
        let upperRounds = Math.ceil(Math.log2(teamCount)) - 1;
        for (let round = 2; round <= upperRounds; round++) {
            const matchesInRound = Math.pow(2, upperRounds - round + 1);
            for (let i = 0; i < matchesInRound; i++) {
                matchesData.push({
                    round_number: round,
                    match_number: matchNumber++,
                    team1_id: null,
                    team2_id: null,
                    best_of: 3,
                    bracket_type: 'upper'
                });
            }
        }

        // Lower bracket - approximately same number of rounds
        for (let round = 1; round <= upperRounds + 1; round++) {
            const matchesInRound = Math.max(1, Math.floor(teamCount / Math.pow(2, round)));
            for (let i = 0; i < matchesInRound; i++) {
                matchesData.push({
                    round_number: round,
                    match_number: matchNumber++,
                    team1_id: null,
                    team2_id: null,
                    best_of: 3,
                    bracket_type: 'lower'
                });
            }
        }

        // Grand Finals
        matchesData.push({
            round_number: upperRounds + 2,
            match_number: matchNumber++,
            team1_id: null,
            team2_id: null,
            best_of: 7,
            bracket_type: 'grand_final'
        });

        bulkCreateMatches(matchesData);
    };

    const generateGSLGroups = () => {
        const groupSize = 4;
        const numGroups = Math.ceil(teams.length / groupSize);
        const matchesData = [];
        let matchNumber = 1;

        for (let group = 0; group < numGroups; group++) {
            const groupTeams = teams.slice(group * groupSize, (group + 1) * groupSize);
            
            if (groupTeams.length >= 2) {
                // Initial matches (Round 1)
                for (let i = 0; i < groupTeams.length; i += 2) {
                    if (groupTeams[i + 1]) {
                        matchesData.push({
                            round_number: 1,
                            match_number: matchNumber++,
                            team1_id: groupTeams[i].id,
                            team2_id: groupTeams[i + 1].id,
                            best_of: 3,
                            group_id: group + 1
                        });
                    }
                }

                // Winners match (Round 2)
                matchesData.push({
                    round_number: 2,
                    match_number: matchNumber++,
                    team1_id: null,
                    team2_id: null,
                    best_of: 3,
                    group_id: group + 1,
                    match_type: 'winners'
                });

                // Elimination match (Round 2)
                matchesData.push({
                    round_number: 2,
                    match_number: matchNumber++,
                    team1_id: null,
                    team2_id: null,
                    best_of: 3,
                    group_id: group + 1,
                    match_type: 'elimination'
                });

                // Decider match (Round 3)
                matchesData.push({
                    round_number: 3,
                    match_number: matchNumber++,
                    team1_id: null,
                    team2_id: null,
                    best_of: 5,
                    group_id: group + 1,
                    match_type: 'decider'
                });
            }
        }

        bulkCreateMatches(matchesData);
    };

    const generateSwissMatches = (rounds = 5) => {
        const matchesData = [];
        let matchNumber = 1;

        // Swiss system generates matches per round
        for (let round = 1; round <= rounds; round++) {
            const matchesInRound = Math.floor(teams.length / 2);
            
            for (let i = 0; i < matchesInRound; i++) {
                matchesData.push({
                    round_number: round,
                    match_number: matchNumber++,
                    team1_id: round === 1 && i * 2 < teams.length ? teams[i * 2].id : null,
                    team2_id: round === 1 && i * 2 + 1 < teams.length ? teams[i * 2 + 1].id : null,
                    best_of: 3,
                    swiss_round: round
                });
            }
        }

        bulkCreateMatches(matchesData);
    };

    return (
        <div className="manual-bracket-system bg-gray-900 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    Manual Bracket System
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateMatch(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Match
                    </button>
                    <button
                        onClick={resetBracket}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={20} />
                        Reset Bracket
                    </button>
                </div>
            </div>

            {/* Game Mode Selection */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Gamepad2 size={20} />
                    Marvel Rivals Game Mode
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(gameModes).map(([key, mode]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedGameMode(key)}
                            className={`p-3 rounded-lg border transition-all ${
                                selectedGameMode === key 
                                    ? 'bg-blue-900/50 border-blue-500 text-white' 
                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <div className="font-semibold">{mode.name}</div>
                            <div className="text-xs mt-1">{mode.description}</div>
                            <div className="text-xs mt-2 text-gray-400">{mode.format}</div>
                            <div className="flex items-center gap-1 mt-2">
                                <Map size={12} />
                                <span className="text-xs">{mode.maps.length} maps</span>
                            </div>
                        </button>
                    ))}
                </div>
                {selectedGameMode && (
                    <div className="mt-3 p-3 bg-gray-700 rounded">
                        <div className="text-sm text-gray-300">
                            <strong>Available Maps:</strong>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {gameModes[selectedGameMode].maps.map(map => (
                                    <span key={map} className="px-2 py-1 bg-gray-600 rounded text-xs">
                                        {map}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Settings size={20} />
                    Quick Generate Tournament Formats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                        onClick={generateSingleEliminationMatches}
                        className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                        title="Standard elimination - lose once and you're out"
                    >
                        Single Elimination
                    </button>
                    <button
                        onClick={generateDoubleEliminationMatches}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        title="Upper and lower bracket system"
                    >
                        Double Elimination
                    </button>
                    <button
                        onClick={generateRoundRobinMatches}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        title="Every team plays every other team"
                    >
                        Round Robin
                    </button>
                    <button
                        onClick={generateGSLGroups}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        title="Groups with winners/elimination matches"
                    >
                        GSL Groups
                    </button>
                    <button
                        onClick={() => generateSwissMatches(5)}
                        className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                        title="Swiss system - 5 rounds"
                    >
                        Swiss (5R)
                    </button>
                    <button
                        onClick={() => generateSwissMatches(7)}
                        className="px-3 py-2 bg-yellow-700 text-white rounded hover:bg-yellow-800 transition-colors text-sm"
                        title="Swiss system - 7 rounds"
                    >
                        Swiss (7R)
                    </button>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                    <p>Teams available: {teams.length} | Select a format above to auto-generate bracket structure</p>
                    {teams.length === 0 && (
                        <p className="mt-2 text-yellow-400">
                            ⚠️ No teams found. Please ensure teams are registered for this event before generating brackets.
                        </p>
                    )}
                </div>
            </div>

            {/* Bracket Status */}
            {matches.length > 0 && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Trophy size={20} />
                        Bracket Status
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-gray-700 rounded-lg p-3">
                            <div className="text-2xl font-bold text-white">{matches.length}</div>
                            <div className="text-xs text-gray-400">Total Matches</div>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-400">
                                {matches.filter(m => m.status === 'completed').length}
                            </div>
                            <div className="text-xs text-gray-400">Completed</div>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-400">
                                {matches.filter(m => m.status === 'live').length}
                            </div>
                            <div className="text-xs text-gray-400">Live</div>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3">
                            <div className="text-2xl font-bold text-gray-400">
                                {matches.filter(m => m.status === 'pending' || !m.status).length}
                            </div>
                            <div className="text-xs text-gray-400">Pending</div>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                style={{ 
                                    width: `${matches.length > 0 ? (matches.filter(m => m.status === 'completed').length / matches.length) * 100 : 0}%` 
                                }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 text-center">
                            Tournament Progress: {matches.length > 0 ? Math.round((matches.filter(m => m.status === 'completed').length / matches.length) * 100) : 0}%
                        </div>
                    </div>
                </div>
            )}

            {/* Matches List */}
            <div className="space-y-4">
                {Object.entries(
                    matches.reduce((acc, match) => {
                        const round = match.round_number || match.round || 1;
                        if (!acc[round]) acc[round] = [];
                        acc[round].push(match);
                        return acc;
                    }, {})
                ).map(([round, roundMatches]) => (
                    <div key={round} className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">
                            Round {round}
                            {round == Math.ceil(Math.log2(teams.length)) && ' - Grand Finals'}
                            {round == Math.ceil(Math.log2(teams.length)) - 1 && ' - Semi Finals'}
                            {roundMatches.some(m => m.bracket_type === 'upper') && ' - Upper Bracket'}
                            {roundMatches.some(m => m.bracket_type === 'lower') && ' - Lower Bracket'}
                            {roundMatches.some(m => m.bracket_type === 'grand_final') && ' - Grand Finals'}
                            {roundMatches.some(m => m.group_id) && ` - Groups ${roundMatches.map(m => m.group_id).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`}
                            {roundMatches.some(m => m.swiss_round) && ' - Swiss System'}
                        </h3>
                        <div className="space-y-2">
                            {roundMatches.map(match => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    teams={teams}
                                    gameModes={gameModes}
                                    onUpdate={updateMatch}
                                    onSetScores={setMatchScores}
                                    onDelete={deleteMatch}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Match Modal */}
            {showCreateMatch && (
                <CreateMatchModal
                    teams={teams}
                    gameMode={gameModes[selectedGameMode]}
                    onClose={() => setShowCreateMatch(false)}
                    onCreate={createMatch}
                />
            )}
        </div>
    );
};

const MatchCard = ({ match, teams, gameModes, onUpdate, onSetScores, onDelete }) => {
    const [editing, setEditing] = useState(false);
    const [scores, setScores] = useState({
        team1_score: match.team1_score || 0,
        team2_score: match.team2_score || 0
    });

    const handleScoreUpdate = () => {
        onSetScores(match.id, {
            ...scores,
            complete_match: true
        });
        setEditing(false);
    };

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'TBD';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'live': return 'text-green-500';
            case 'completed': return 'text-blue-500';
            default: return 'text-gray-400';
        }
    };

    const gameMode = match.match_details?.game_mode || 'domination';
    const modeInfo = gameModes[gameMode];

    return (
        <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                        Match #{match.match_number}
                    </div>
                    {match.group_id && (
                        <div className="flex items-center gap-2 text-xs">
                            <Users size={14} />
                            <span className="text-gray-400">Group {match.group_id}</span>
                        </div>
                    )}
                    {match.bracket_type && (
                        <div className="flex items-center gap-2 text-xs">
                            <Trophy size={14} />
                            <span className={`text-xs px-2 py-1 rounded ${
                                match.bracket_type === 'upper' ? 'bg-blue-900 text-blue-300' :
                                match.bracket_type === 'lower' ? 'bg-red-900 text-red-300' :
                                match.bracket_type === 'grand_final' ? 'bg-yellow-900 text-yellow-300' :
                                'bg-gray-700 text-gray-300'
                            }`}>
                                {match.bracket_type.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    )}
                    {match.match_type && (
                        <div className="flex items-center gap-2 text-xs">
                            <AlertCircle size={14} />
                            <span className={`text-xs px-2 py-1 rounded ${
                                match.match_type === 'winners' ? 'bg-green-900 text-green-300' :
                                match.match_type === 'elimination' ? 'bg-red-900 text-red-300' :
                                match.match_type === 'decider' ? 'bg-yellow-900 text-yellow-300' :
                                'bg-gray-700 text-gray-300'
                            }`}>
                                {match.match_type.toUpperCase()}
                            </span>
                        </div>
                    )}
                    {modeInfo && (
                        <div className="flex items-center gap-2 text-xs">
                            <Gamepad2 size={14} />
                            <span className="text-gray-400">{modeInfo.name}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                        BO{match.best_of}
                    </span>
                    <span className={`text-xs ${getStatusColor(match.status)}`}>
                        {match.status}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                                {getTeamName(match.team1_id)}
                            </span>
                            {editing ? (
                                <input
                                    type="number"
                                    value={scores.team1_score}
                                    onChange={(e) => setScores({ ...scores, team1_score: parseInt(e.target.value) || 0 })}
                                    className="w-12 px-2 py-1 bg-gray-600 text-white rounded"
                                    min="0"
                                    max={Math.ceil(match.best_of / 2)}
                                />
                            ) : (
                                <span className="text-xl font-bold text-white">{match.team1_score}</span>
                            )}
                        </div>

                        <span className="text-gray-400">vs</span>

                        <div className="flex items-center gap-2">
                            {editing ? (
                                <input
                                    type="number"
                                    value={scores.team2_score}
                                    onChange={(e) => setScores({ ...scores, team2_score: parseInt(e.target.value) || 0 })}
                                    className="w-12 px-2 py-1 bg-gray-600 text-white rounded"
                                    min="0"
                                    max={Math.ceil(match.best_of / 2)}
                                />
                            ) : (
                                <span className="text-xl font-bold text-white">{match.team2_score}</span>
                            )}
                            <span className="text-white font-medium">
                                {getTeamName(match.team2_id)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {editing ? (
                        <>
                            <button
                                onClick={handleScoreUpdate}
                                className="p-2 text-green-500 hover:bg-gray-600 rounded"
                            >
                                <Save size={18} />
                            </button>
                            <button
                                onClick={() => setEditing(false)}
                                className="p-2 text-gray-400 hover:bg-gray-600 rounded"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                className="p-2 text-blue-500 hover:bg-gray-600 rounded"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => onDelete(match.id)}
                                className="p-2 text-red-500 hover:bg-gray-600 rounded"
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {match.winner_id && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                    <span className="text-sm text-green-400">
                        Winner: {getTeamName(match.winner_id)}
                    </span>
                </div>
            )}
        </div>
    );
};

const CreateMatchModal = ({ teams, gameMode, onClose, onCreate }) => {
    const [matchData, setMatchData] = useState({
        round_number: 1,
        match_number: 1,
        team1_id: null,
        team2_id: null,
        best_of: 3,
        scheduled_at: null
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(matchData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-4">Create New Match</h3>
                
                <div className="mb-4 p-3 bg-gray-700 rounded">
                    <div className="text-sm text-gray-300">
                        <strong>Game Mode:</strong> {gameMode.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {gameMode.format}
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Round
                            </label>
                            <input
                                type="number"
                                value={matchData.round_number}
                                onChange={(e) => setMatchData({ ...matchData, round_number: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                                min="1"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Match Number
                            </label>
                            <input
                                type="number"
                                value={matchData.match_number}
                                onChange={(e) => setMatchData({ ...matchData, match_number: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Team 1
                        </label>
                        <select
                            value={matchData.team1_id || ''}
                            onChange={(e) => setMatchData({ ...matchData, team1_id: e.target.value || null })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                        >
                            <option value="">TBD</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Team 2
                        </label>
                        <select
                            value={matchData.team2_id || ''}
                            onChange={(e) => setMatchData({ ...matchData, team2_id: e.target.value || null })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                        >
                            <option value="">TBD</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Best Of
                        </label>
                        <select
                            value={matchData.best_of}
                            onChange={(e) => setMatchData({ ...matchData, best_of: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                        >
                            <option value={1}>BO1 - Single game</option>
                            <option value={3}>BO3 - First to 2</option>
                            <option value={5}>BO5 - First to 3</option>
                            <option value={7}>BO7 - First to 4</option>
                            <option value={9}>BO9 - First to 5</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Scheduled At (Optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={matchData.scheduled_at || ''}
                            onChange={(e) => setMatchData({ ...matchData, scheduled_at: e.target.value || null })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Create Match
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualBracketSystem;