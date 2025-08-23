import React, { useState, useEffect } from 'react';
import { 
    Trophy, Plus, Edit2, Trash2, Save, Settings, Users,
    ChevronRight, Calendar, AlertCircle, CheckCircle, 
    Map, Gamepad2, Layout, PlusCircle, Layers
} from 'lucide-react';
import { useAuth } from '../../hooks';

const ManualBracketBuilder = ({ eventId }) => {
    const { api } = useAuth();
    const [bracketStage, setBracketStage] = useState(null);
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('structure');
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [editingMatch, setEditingMatch] = useState(null);

    // Bracket configuration state
    const [bracketConfig, setBracketConfig] = useState({
        name: '',
        format: 'single_elimination',
        rounds: 3,
        bestOf: 3,
        thirdPlace: false
    });

    const formats = {
        single_elimination: {
            name: 'Single Elimination',
            description: 'Win or go home',
            icon: '🏆'
        },
        double_elimination: {
            name: 'Double Elimination', 
            description: 'Second chance through lower bracket',
            icon: '🔄'
        },
        round_robin: {
            name: 'Round Robin',
            description: 'Everyone plays everyone',
            icon: '♻️'
        },
        swiss: {
            name: 'Swiss System',
            description: 'Paired by record',
            icon: '🇨🇭'
        },
        gsl: {
            name: 'GSL Groups',
            description: '4-team double elimination groups',
            icon: '🎯'
        }
    };

    const bestOfOptions = [
        { value: 1, label: 'BO1' },
        { value: 3, label: 'BO3' },
        { value: 5, label: 'BO5' },
        { value: 7, label: 'BO7' },
        { value: 9, label: 'BO9' }
    ];

    useEffect(() => {
        loadEventData();
    }, [eventId]);

    const loadEventData = async () => {
        setLoading(true);
        try {
            const [eventRes, matchesRes] = await Promise.all([
                api.get(`/admin/events/${eventId}`),
                api.get(`/admin/events/${eventId}/bracket/manual/matches`)
            ]);

            // Extract teams from event data
            const eventData = eventRes.data.data;
            const eventTeams = eventData.teams || eventData.participating_teams || [];
            setTeams(eventTeams);

            // Load existing matches
            setMatches(matchesRes.data.data || []);

            // Check if bracket stage exists
            if (eventData.bracket_stage) {
                setBracketStage(eventData.bracket_stage);
                setBracketConfig({
                    name: eventData.bracket_stage.name,
                    format: eventData.bracket_stage.type,
                    rounds: eventData.bracket_stage.total_rounds,
                    bestOf: 3
                });
            }
        } catch (error) {
            console.error('Error loading event data:', error);
        } finally {
            setLoading(false);
        }
    };

    const createBracketStructure = async () => {
        if (!bracketConfig.name) {
            alert('Please enter a bracket name');
            return;
        }

        try {
            const response = await api.post(`/admin/events/${eventId}/bracket/manual/stage`, {
                name: bracketConfig.name,
                stage_type: bracketConfig.format,
                round_count: bracketConfig.rounds,
                team_count: teams.length,
                settings: {
                    best_of: bracketConfig.bestOf,
                    third_place: bracketConfig.thirdPlace
                }
            });

            setBracketStage(response.data.data);
            alert('Bracket structure created successfully');
            setActiveTab('matches');
        } catch (error) {
            console.error('Error creating bracket:', error);
            alert('Failed to create bracket structure');
        }
    };

    const addMatch = async (matchData) => {
        try {
            const response = await api.post(`/admin/events/${eventId}/bracket/manual/match`, {
                ...matchData,
                stage_id: bracketStage?.id
            });

            setMatches([...matches, response.data.data]);
            setShowMatchModal(false);
            alert('Match added successfully');
        } catch (error) {
            console.error('Error adding match:', error);
            alert('Failed to add match');
        }
    };

    const updateMatch = async (matchId, updates) => {
        try {
            const response = await api.put(`/admin/events/${eventId}/bracket/manual/match/${matchId}`, updates);
            setMatches(matches.map(m => m.id === matchId ? response.data.data : m));
            alert('Match updated successfully');
        } catch (error) {
            console.error('Error updating match:', error);
            alert('Failed to update match');
        }
    };

    const deleteMatch = async (matchId) => {
        if (!window.confirm('Delete this match?')) return;

        try {
            await api.delete(`/admin/events/${eventId}/bracket/manual/match/${matchId}`);
            setMatches(matches.filter(m => m.id !== matchId));
            alert('Match deleted');
        } catch (error) {
            console.error('Error deleting match:', error);
            alert('Failed to delete match');
        }
    };

    const resetBracket = async () => {
        if (!window.confirm('Reset entire bracket? This will delete all matches.')) return;

        try {
            await api.post(`/admin/events/${eventId}/bracket/manual/reset`);
            setMatches([]);
            setBracketStage(null);
            setBracketConfig({
                name: '',
                format: 'single_elimination',
                rounds: 3,
                bestOf: 3,
                thirdPlace: false
            });
            alert('Bracket reset successfully');
            setActiveTab('structure');
        } catch (error) {
            console.error('Error resetting bracket:', error);
            alert('Failed to reset bracket');
        }
    };

    return (
        <div className="manual-bracket-builder bg-gray-900 rounded-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Layout />
                    Manual Bracket Builder
                </h2>
                <button
                    onClick={resetBracket}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Reset Bracket
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('structure')}
                    className={`px-4 py-2 rounded ${
                        activeTab === 'structure' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300'
                    }`}
                >
                    <Layers className="inline mr-2" size={16} />
                    Bracket Structure
                </button>
                <button
                    onClick={() => setActiveTab('matches')}
                    className={`px-4 py-2 rounded ${
                        activeTab === 'matches' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300'
                    }`}
                    disabled={!bracketStage}
                >
                    <Trophy className="inline mr-2" size={16} />
                    Matches ({matches.length})
                </button>
            </div>

            {/* Content */}
            {activeTab === 'structure' ? (
                <BracketStructureTab
                    config={bracketConfig}
                    setConfig={setBracketConfig}
                    formats={formats}
                    bestOfOptions={bestOfOptions}
                    teams={teams}
                    bracketStage={bracketStage}
                    onCreate={createBracketStructure}
                />
            ) : (
                <MatchesTab
                    matches={matches}
                    teams={teams}
                    onAddMatch={() => setShowMatchModal(true)}
                    onUpdateMatch={updateMatch}
                    onDeleteMatch={deleteMatch}
                    bestOf={bracketConfig.bestOf}
                />
            )}

            {/* Add Match Modal */}
            {showMatchModal && (
                <AddMatchModal
                    teams={teams}
                    rounds={bracketConfig.rounds}
                    bestOf={bracketConfig.bestOf}
                    onAdd={addMatch}
                    onClose={() => setShowMatchModal(false)}
                />
            )}
        </div>
    );
};

// Bracket Structure Tab Component
const BracketStructureTab = ({ config, setConfig, formats, bestOfOptions, teams, bracketStage, onCreate }) => {
    return (
        <div className="space-y-6">
            {bracketStage ? (
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={20} />
                        <span className="font-semibold">Bracket Structure Created</span>
                    </div>
                    <div className="mt-2 text-gray-300">
                        <p>Name: {bracketStage.name}</p>
                        <p>Format: {bracketStage.type || bracketStage.stage_type}</p>
                        <p>Teams: {teams.length}</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Bracket Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bracket Name
                        </label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={(e) => setConfig({ ...config, name: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                            placeholder="e.g., Main Stage, Playoffs, Grand Finals"
                        />
                    </div>

                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tournament Format
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(formats).map(([key, format]) => (
                                <button
                                    key={key}
                                    onClick={() => setConfig({ ...config, format: key })}
                                    className={`p-3 rounded border transition-all ${
                                        config.format === key
                                            ? 'bg-blue-900/50 border-blue-500'
                                            : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">{format.icon}</div>
                                    <div className="font-semibold text-sm">{format.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{format.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Configuration Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Number of Rounds
                            </label>
                            <input
                                type="number"
                                value={config.rounds}
                                onChange={(e) => setConfig({ ...config, rounds: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                                min="1"
                                max="10"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {Math.pow(2, config.rounds)} max teams
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Default Best Of
                            </label>
                            <select
                                value={config.bestOf}
                                onChange={(e) => setConfig({ ...config, bestOf: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                            >
                                {bestOfOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Additional Options */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-gray-300">
                            <input
                                type="checkbox"
                                checked={config.thirdPlace}
                                onChange={(e) => setConfig({ ...config, thirdPlace: e.target.checked })}
                                className="rounded"
                            />
                            Include 3rd Place Match
                        </label>
                    </div>

                    {/* Teams Info */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <Users size={18} />
                            Participating Teams ({teams.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {teams.map(team => (
                                <span key={team.id} className="px-2 py-1 bg-gray-700 rounded text-sm">
                                    {team.name}
                                </span>
                            ))}
                        </div>
                        {teams.length === 0 && (
                            <p className="text-yellow-400 text-sm">
                                No teams added to this event yet
                            </p>
                        )}
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={onCreate}
                        disabled={!config.name || teams.length < 2}
                        className={`w-full py-3 rounded font-semibold flex items-center justify-center gap-2 ${
                            config.name && teams.length >= 2
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <PlusCircle size={20} />
                        Create Bracket Structure
                    </button>
                </>
            )}
        </div>
    );
};

// Matches Tab Component
const MatchesTab = ({ matches, teams, onAddMatch, onUpdateMatch, onDeleteMatch, bestOf }) => {
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'TBD';
    };

    const groupedMatches = matches.reduce((acc, match) => {
        const round = match.round_number || 1;
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Add Match Button */}
            <button
                onClick={onAddMatch}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
                <Plus size={18} />
                Add Match Manually
            </button>

            {/* Matches by Round */}
            {Object.entries(groupedMatches).map(([round, roundMatches]) => (
                <div key={round} className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">
                        Round {round} ({roundMatches.length} matches)
                    </h3>
                    <div className="space-y-2">
                        {roundMatches.map(match => (
                            <div key={match.id} className="bg-gray-700 rounded p-3 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-400 text-sm">
                                        #{match.match_number}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white">
                                            {getTeamName(match.team1_id)}
                                        </span>
                                        <span className="text-xl font-bold">
                                            {match.team1_score}
                                        </span>
                                        <span className="text-gray-400">vs</span>
                                        <span className="text-xl font-bold">
                                            {match.team2_score}
                                        </span>
                                        <span className="text-white">
                                            {getTeamName(match.team2_id)}
                                        </span>
                                    </div>
                                    <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                                        BO{match.best_of}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        match.status === 'completed' ? 'bg-green-600' :
                                        match.status === 'live' ? 'bg-yellow-600' :
                                        'bg-gray-600'
                                    }`}>
                                        {match.status}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onUpdateMatch(match.id, { status: 'live' })}
                                        className="p-1 text-blue-400 hover:bg-gray-600 rounded"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteMatch(match.id)}
                                        className="p-1 text-red-400 hover:bg-gray-600 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {matches.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <Trophy size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No matches added yet</p>
                    <p className="text-sm">Click "Add Match Manually" to create matches</p>
                </div>
            )}
        </div>
    );
};

// Add Match Modal Component
const AddMatchModal = ({ teams, rounds, bestOf, onAdd, onClose }) => {
    const [matchData, setMatchData] = useState({
        round_number: 1,
        match_number: 1,
        team1_id: null,
        team2_id: null,
        best_of: bestOf,
        scheduled_at: null
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(matchData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-4">Add Match</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Round</label>
                            <input
                                type="number"
                                value={matchData.round_number}
                                onChange={(e) => setMatchData({ ...matchData, round_number: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                                min="1"
                                max={rounds}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Match #</label>
                            <input
                                type="number"
                                value={matchData.match_number}
                                onChange={(e) => setMatchData({ ...matchData, match_number: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Team 1</label>
                        <select
                            value={matchData.team1_id || ''}
                            onChange={(e) => setMatchData({ ...matchData, team1_id: e.target.value || null })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                        >
                            <option value="">TBD</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Team 2</label>
                        <select
                            value={matchData.team2_id || ''}
                            onChange={(e) => setMatchData({ ...matchData, team2_id: e.target.value || null })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                        >
                            <option value="">TBD</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Best Of</label>
                        <select
                            value={matchData.best_of}
                            onChange={(e) => setMatchData({ ...matchData, best_of: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                        >
                            <option value={1}>BO1</option>
                            <option value={3}>BO3</option>
                            <option value={5}>BO5</option>
                            <option value={7}>BO7</option>
                            <option value={9}>BO9</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Add Match
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualBracketBuilder;