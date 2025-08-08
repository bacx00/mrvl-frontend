import React, { useState, useEffect } from 'react';
import { X, Save, Trophy, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks';
import { MARVEL_RIVALS_HEROES } from '../../data/marvelRivalsComplete';

const SimplifiedLiveScoring = ({ 
  isOpen, 
  onClose, 
  match,
  onUpdate 
}) => {
  const { token } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

  // Simple state for match data
  const [matchData, setMatchData] = useState({
    team1Score: 0,
    team2Score: 0,
    team1MapScore: 0,
    team2MapScore: 0,
    status: 'live',
    team1Players: [],
    team2Players: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load match data on open
  useEffect(() => {
    if (match && isOpen) {
      loadMatchData();
    }
  }, [match, isOpen]);

  // 1. LOAD MATCH DATA - GET /api/matches/{id}
  const loadMatchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/matches/${match.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Initialize 6 players per team
        const team1Players = [];
        const team2Players = [];
        
        // Use roster data or create placeholder players
        for (let i = 0; i < 6; i++) {
          const team1Player = data.team1?.roster?.[i] || { id: i, username: `Player ${i + 1}` };
          const team2Player = data.team2?.roster?.[i] || { id: i, username: `Player ${i + 1}` };
          
          team1Players.push({
            ...team1Player,
            hero: '',
            kills: 0,
            deaths: 0,
            assists: 0
          });
          
          team2Players.push({
            ...team2Player,
            hero: '',
            kills: 0,
            deaths: 0,
            assists: 0
          });
        }

        setMatchData({
          team1Score: data.team1_score || 0,
          team2Score: data.team2_score || 0,
          team1MapScore: data.series_score_team1 || data.team1_series_score || 0,
          team2MapScore: data.series_score_team2 || data.team2_series_score || 0,
          status: data.status || 'live',
          team1Players,
          team2Players
        });
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update player stats locally
  const updatePlayerStat = (team, playerIndex, stat, value) => {
    setMatchData(prev => {
      const playersKey = team === 1 ? 'team1Players' : 'team2Players';
      const updatedPlayers = [...prev[playersKey]];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        [stat]: parseInt(value) || 0
      };
      
      return {
        ...prev,
        [playersKey]: updatedPlayers
      };
    });
  };

  // Update hero selection
  const updatePlayerHero = (team, playerIndex, hero) => {
    setMatchData(prev => {
      const playersKey = team === 1 ? 'team1Players' : 'team2Players';
      const updatedPlayers = [...prev[playersKey]];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        hero: hero
      };
      
      return {
        ...prev,
        [playersKey]: updatedPlayers
      };
    });
  };

  // Update map scores
  const updateMapScore = (team, increment) => {
    const scoreKey = team === 1 ? 'team1MapScore' : 'team2MapScore';
    setMatchData(prev => ({
      ...prev,
      [scoreKey]: Math.max(0, prev[scoreKey] + (increment ? 1 : -1))
    }));
  };

  // 2. SIMPLE SAVE - POST /api/matches/{id}/update-player-stats
  const savePlayerStats = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/matches/${match.id}/update-player-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team1_players: matchData.team1Players,
          team2_players: matchData.team2Players,
          team1_map_score: matchData.team1MapScore,
          team2_map_score: matchData.team2MapScore
        })
      });

      if (response.ok) {
        alert('Stats saved successfully!');
        if (onUpdate) onUpdate();
      } else {
        alert('Failed to save stats');
      }
    } catch (error) {
      console.error('Error saving stats:', error);
      alert('Error saving stats');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. QUICK ACTIONS
  const teamWinsMap = async (teamNumber) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/matches/${match.id}/team-wins-map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          winning_team: teamNumber
        })
      });

      if (response.ok) {
        // Update series score
        if (teamNumber === 1) {
          setMatchData(prev => ({ ...prev, team1Score: prev.team1Score + 1 }));
        } else {
          setMatchData(prev => ({ ...prev, team2Score: prev.team2Score + 1 }));
        }
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error updating map win:', error);
    }
  };

  // Complete match
  const completeMatch = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/matches/${match.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      if (response.ok) {
        setMatchData(prev => ({ ...prev, status: 'completed' }));
        if (onUpdate) onUpdate();
        alert('Match completed!');
      }
    } catch (error) {
      console.error('Error completing match:', error);
    }
  };

  // Reset all stats
  const resetStats = async () => {
    if (!confirm('Reset all player stats to zero?')) return;

    const resetPlayers = (players) => players.map(player => ({
      ...player,
      kills: 0,
      deaths: 0,
      assists: 0,
      hero: ''
    }));

    setMatchData(prev => ({
      ...prev,
      team1MapScore: 0,
      team2MapScore: 0,
      team1Players: resetPlayers(prev.team1Players),
      team2Players: resetPlayers(prev.team2Players)
    }));
    
    alert('Stats reset!');
  };

  if (!isOpen || !match) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="text-white text-center">Loading match data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              Simple Live Scoring - {match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Series Score Display */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6 text-center">
            <div className="text-sm text-gray-400 mb-2">Series Score</div>
            <div className="text-4xl font-bold text-white">
              {matchData.team1Score} - {matchData.team2Score}
            </div>
            <div className="text-sm text-gray-400 mt-2">Status: {matchData.status}</div>
          </div>

          {/* Map Scores */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">{match.team1?.name || 'Team 1'}</h3>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => updateMapScore(1, false)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  -
                </button>
                <div className="text-3xl font-bold text-white">{matchData.team1MapScore}</div>
                <button
                  onClick={() => updateMapScore(1, true)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => teamWinsMap(1)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Team 1 Wins Map
              </button>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">{match.team2?.name || 'Team 2'}</h3>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => updateMapScore(2, false)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  -
                </button>
                <div className="text-3xl font-bold text-white">{matchData.team2MapScore}</div>
                <button
                  onClick={() => updateMapScore(2, true)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => teamWinsMap(2)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Team 2 Wins Map
              </button>
            </div>
          </div>

          {/* Player Stats Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Team 1 Stats */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-bold text-white mb-4">{match.team1?.name || 'Team 1'} - Player Stats</h4>
              <div className="space-y-3">
                {matchData.team1Players.map((player, i) => (
                  <div key={player.id || i} className="bg-gray-600 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{player.username || `Player ${i + 1}`}</span>
                    </div>
                    
                    {/* Hero Selection */}
                    <div className="mb-2">
                      <select
                        value={player.hero}
                        onChange={(e) => updatePlayerHero(1, i, e.target.value)}
                        className="w-full bg-gray-500 text-white px-2 py-1 rounded text-sm"
                      >
                        <option value="">Select Hero</option>
                        {Object.entries(HEROES).flatMap(([role, heroes]) => {
                          if (Array.isArray(heroes)) {
                            return heroes.map(hero => (
                              <option key={hero} value={hero}>
                                {hero} ({role})
                              </option>
                            ));
                          }
                          return [];
                        })}
                      </select>
                    </div>

                    {/* K/D/A Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-300">Kills</label>
                        <input
                          type="number"
                          min="0"
                          value={player.kills}
                          onChange={(e) => updatePlayerStat(1, i, 'kills', e.target.value)}
                          className="w-full bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-300">Deaths</label>
                        <input
                          type="number"
                          min="0"
                          value={player.deaths}
                          onChange={(e) => updatePlayerStat(1, i, 'deaths', e.target.value)}
                          className="w-full bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-300">Assists</label>
                        <input
                          type="number"
                          min="0"
                          value={player.assists}
                          onChange={(e) => updatePlayerStat(1, i, 'assists', e.target.value)}
                          className="w-full bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">
                      K/D: {player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team 2 Stats */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-bold text-white mb-4">{match.team2?.name || 'Team 2'} - Player Stats</h4>
              <div className="space-y-3">
                {matchData.team2Players.map((player, i) => (
                  <div key={player.id || i} className="bg-gray-600 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{player.username || `Player ${i + 1}`}</span>
                    </div>
                    
                    {/* Hero Selection */}
                    <div className="mb-2">
                      <select
                        value={player.hero}
                        onChange={(e) => updatePlayerHero(2, i, e.target.value)}
                        className="w-full bg-gray-500 text-white px-2 py-1 rounded text-sm"
                      >
                        <option value="">Select Hero</option>
                        {Object.entries(HEROES).flatMap(([role, heroes]) => {
                          if (Array.isArray(heroes)) {
                            return heroes.map(hero => (
                              <option key={hero} value={hero}>
                                {hero} ({role})
                              </option>
                            ));
                          }
                          return [];
                        })}
                      </select>
                    </div>

                    {/* K/D/A Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-300">Kills</label>
                        <input
                          type="number"
                          min="0"
                          value={player.kills}
                          onChange={(e) => updatePlayerStat(2, i, 'kills', e.target.value)}
                          className="w-full bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-300">Deaths</label>
                        <input
                          type="number"
                          min="0"
                          value={player.deaths}
                          onChange={(e) => updatePlayerStat(2, i, 'deaths', e.target.value)}
                          className="w-full bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-300">Assists</label>
                        <input
                          type="number"
                          min="0"
                          value={player.assists}
                          onChange={(e) => updatePlayerStat(2, i, 'assists', e.target.value)}
                          className="w-full bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">
                      K/D: {player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={savePlayerStats}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save Stats'}
            </button>

            <button
              onClick={loadMatchData}
              disabled={isLoading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>

            <button
              onClick={completeMatch}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Complete Match
            </button>

            <button
              onClick={resetStats}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              Reset Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedLiveScoring;