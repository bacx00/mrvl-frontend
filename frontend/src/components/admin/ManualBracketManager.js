import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Users, 
  Settings, 
  ChevronRight, 
  Save, 
  RotateCcw,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Gamepad2
} from 'lucide-react';

const ManualBracketManager = ({ tournamentId }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [formats, setFormats] = useState({});
  const [selectedFormat, setSelectedFormat] = useState('custom');
  const [bracketName, setBracketName] = useState('');
  const [bestOf, setBestOf] = useState(3);
  const [bracketType, setBracketType] = useState('single_elimination');
  const [currentBracket, setCurrentBracket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeMatch, setActiveMatch] = useState(null);
  const [scoreModal, setScoreModal] = useState(false);

  // Marvel Rivals game modes
  const gameModes = ['Domination', 'Convoy', 'Convergence'];

  useEffect(() => {
    fetchTeams();
    fetchFormats();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/public/teams');
      setTeams(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch teams');
    }
  };

  const fetchFormats = async () => {
    try {
      const response = await axios.get('/api/admin/manual-bracket/formats');
      setFormats(response.data.formats || {});
    } catch (err) {
      console.error('Failed to fetch formats:', err);
    }
  };

  const handleTeamToggle = (teamId) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      }
      return [...prev, teamId];
    });
  };

  const handleFormatChange = (formatKey) => {
    setSelectedFormat(formatKey);
    const format = formats[formatKey];
    if (format && format.format !== 'flexible') {
      setBracketType(format.format);
      setBestOf(format.best_of);
    }
  };

  const createBracket = async () => {
    if (selectedTeams.length < 2) {
      setError('Please select at least 2 teams');
      return;
    }

    if (!bracketName) {
      setError('Please enter a bracket name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `/api/admin/tournaments/${tournamentId}/manual-bracket`,
        {
          format_key: selectedFormat,
          team_ids: selectedTeams,
          best_of: bestOf,
          bracket_type: bracketType,
          name: bracketName,
          start_date: new Date().toISOString()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Bracket created successfully!');
        setCurrentBracket(response.data);
        fetchBracketState(response.data.bracket_id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bracket');
    } finally {
      setLoading(false);
    }
  };

  const fetchBracketState = async (bracketId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `/api/admin/manual-bracket/${bracketId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setCurrentBracket(response.data.bracket);
      }
    } catch (err) {
      console.error('Failed to fetch bracket state:', err);
    }
  };

  const openScoreModal = (match) => {
    setActiveMatch(match);
    setScoreModal(true);
  };

  const updateMatchScore = async (matchId, scores) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `/api/admin/manual-bracket/matches/${matchId}/score`,
        scores,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Match updated successfully!');
        setCurrentBracket(response.data.bracket);
        setScoreModal(false);
        setActiveMatch(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update match');
    } finally {
      setLoading(false);
    }
  };

  const resetBracket = async () => {
    if (!window.confirm('Are you sure you want to reset this bracket? All match data will be lost.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `/api/admin/manual-bracket/${currentBracket.stage.id}/reset`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Bracket reset successfully');
        setCurrentBracket(null);
        setSelectedTeams([]);
      }
    } catch (err) {
      setError('Failed to reset bracket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Manual Bracket Manager
        </h2>
        <p className="text-gray-400 mt-1">
          Create and manage Marvel Rivals tournament brackets manually
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded flex items-center gap-2">
          <CheckCircle className="text-green-500" size={20} />
          <span>{success}</span>
        </div>
      )}

      {!currentBracket ? (
        /* Bracket Creation Form */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} />
              Bracket Settings
            </h3>

            {/* Bracket Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Bracket Name
              </label>
              <input
                type="text"
                value={bracketName}
                onChange={(e) => setBracketName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="e.g., IGNITE 2025 - Main Stage"
              />
            </div>

            {/* Tournament Format */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Tournament Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => handleFormatChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                {Object.entries(formats).map(([key, format]) => (
                  <option key={key} value={key}>
                    {format.name} - {format.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Bracket Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Bracket Type
              </label>
              <select
                value={bracketType}
                onChange={(e) => setBracketType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                disabled={selectedFormat !== 'custom'}
              >
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
                <option value="gsl">GSL Bracket (4 teams)</option>
                <option value="round_robin">Round Robin</option>
              </select>
            </div>

            {/* Best Of */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Match Format
              </label>
              <select
                value={bestOf}
                onChange={(e) => setBestOf(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                disabled={selectedFormat !== 'custom'}
              >
                <option value="1">Best of 1</option>
                <option value="3">Best of 3</option>
                <option value="5">Best of 5</option>
                <option value="7">Best of 7</option>
              </select>
            </div>

            {/* Marvel Rivals Game Modes Info */}
            <div className="mt-6 p-4 bg-gray-700 rounded">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Gamepad2 size={16} />
                Marvel Rivals Game Modes
              </h4>
              <div className="text-xs text-gray-400 space-y-1">
                {gameModes.map(mode => (
                  <div key={mode} className="flex items-center gap-2">
                    <ChevronRight size={12} />
                    <span>{mode}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Team Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users size={20} />
              Select Teams ({selectedTeams.length} selected)
            </h3>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {teams.map(team => (
                <div
                  key={team.id}
                  onClick={() => handleTeamToggle(team.id)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedTeams.includes(team.id)
                      ? 'bg-blue-900/50 border border-blue-500'
                      : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {team.logo && (
                        <img 
                          src={team.logo} 
                          alt={team.name}
                          className="w-8 h-8 rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-xs text-gray-400">
                          {team.region || 'Global'}
                        </div>
                      </div>
                    </div>
                    {selectedTeams.includes(team.id) && (
                      <CheckCircle className="text-blue-500" size={20} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Create Button */}
            <button
              onClick={createBracket}
              disabled={loading || selectedTeams.length < 2 || !bracketName}
              className={`mt-6 w-full py-3 rounded font-medium transition-colors flex items-center justify-center gap-2 ${
                loading || selectedTeams.length < 2 || !bracketName
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <Plus size={20} />
                  Create Bracket
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Bracket View and Management */
        <div>
          {/* Bracket Header */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{currentBracket.stage?.name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Progress: {currentBracket.completed_matches}/{currentBracket.total_matches} matches completed
                </p>
              </div>
              <button
                onClick={resetBracket}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset Bracket
              </button>
            </div>
          </div>

          {/* Bracket Rounds */}
          <div className="space-y-6">
            {Object.entries(currentBracket.rounds || {}).map(([roundNumber, matches]) => (
              <div key={roundNumber} className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">
                  Round {roundNumber}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map(match => (
                    <div
                      key={match.id}
                      className={`p-4 rounded border ${
                        match.status === 'completed' 
                          ? 'bg-green-900/20 border-green-700'
                          : match.team1_id && match.team2_id
                          ? 'bg-gray-700 border-gray-600 hover:border-blue-500 cursor-pointer'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                      onClick={() => match.team1_id && match.team2_id && match.status !== 'completed' && openScoreModal(match)}
                    >
                      <div className="text-sm text-gray-400 mb-2">
                        {match.round_name} - Match {match.match_number}
                      </div>
                      
                      {/* Team 1 */}
                      <div className={`flex justify-between items-center p-2 rounded ${
                        match.winner_id === match.team1_id ? 'bg-green-900/30' : ''
                      }`}>
                        <span className="font-medium">
                          {match.team1?.name || match.team1_source || 'TBD'}
                        </span>
                        <span className="text-xl font-bold">
                          {match.team1_score}
                        </span>
                      </div>
                      
                      <div className="text-center text-xs text-gray-500 my-1">
                        Best of {match.best_of}
                      </div>
                      
                      {/* Team 2 */}
                      <div className={`flex justify-between items-center p-2 rounded ${
                        match.winner_id === match.team2_id ? 'bg-green-900/30' : ''
                      }`}>
                        <span className="font-medium">
                          {match.team2?.name || match.team2_source || 'TBD'}
                        </span>
                        <span className="text-xl font-bold">
                          {match.team2_score}
                        </span>
                      </div>
                      
                      {match.status === 'completed' && (
                        <div className="mt-2 text-center text-sm text-green-400">
                          Winner: {match.winner?.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Champion Display */}
          {currentBracket.champion && (
            <div className="mt-6 bg-gradient-to-r from-yellow-900/50 to-yellow-700/50 rounded-lg p-6 text-center">
              <Trophy className="mx-auto text-yellow-500 mb-2" size={48} />
              <h3 className="text-2xl font-bold">Champion</h3>
              <p className="text-xl mt-2">{currentBracket.champion.name}</p>
            </div>
          )}
        </div>
      )}

      {/* Score Update Modal */}
      {scoreModal && activeMatch && (
        <ScoreUpdateModal
          match={activeMatch}
          gameModes={gameModes}
          onUpdate={updateMatchScore}
          onClose={() => {
            setScoreModal(false);
            setActiveMatch(null);
          }}
        />
      )}
    </div>
  );
};

// Score Update Modal Component
const ScoreUpdateModal = ({ match, gameModes, onUpdate, onClose }) => {
  const [team1Score, setTeam1Score] = useState(match.team1_score || 0);
  const [team2Score, setTeam2Score] = useState(match.team2_score || 0);
  const [gameDetails, setGameDetails] = useState([]);
  const [completeMatch, setCompleteMatch] = useState(false);

  const handleSubmit = () => {
    onUpdate(match.id, {
      team1_score: team1Score,
      team2_score: team2Score,
      game_details: gameDetails,
      complete_match: completeMatch
    });
  };

  const requiredWins = Math.ceil(match.best_of / 2);
  const canComplete = team1Score >= requiredWins || team2Score >= requiredWins;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Update Match Score</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400">
            {match.round_name} - Match {match.match_number}
          </p>
          <p className="text-xs text-gray-500">
            Best of {match.best_of} (First to {requiredWins})
          </p>
        </div>

        {/* Team 1 Score */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {match.team1?.name || 'Team 1'} Score
          </label>
          <input
            type="number"
            min="0"
            max={match.best_of}
            value={team1Score}
            onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Team 2 Score */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {match.team2?.name || 'Team 2'} Score
          </label>
          <input
            type="number"
            min="0"
            max={match.best_of}
            value={team2Score}
            onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Complete Match Checkbox */}
        {canComplete && (
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={completeMatch}
                onChange={(e) => setCompleteMatch(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Complete match and advance winner</span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Update Score
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualBracketManager;