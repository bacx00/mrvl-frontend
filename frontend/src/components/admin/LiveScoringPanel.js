import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getHeroImageSync, getCountryFlag } from '../../utils/imageUtils';
import { HEROES, MARVEL_RIVALS_MAPS, GAME_MODES } from '../../constants/marvelRivalsData';

/**
 * LiveScoringPanel - Comprehensive Live Scoring System for Marvel Rivals
 * Real-time updates, instant sync with MatchDetailPage
 * Features: Map scores, player stats, hero selection, match score auto-calculation
 */
const LiveScoringPanel = ({ 
  isOpen, 
  match, 
  onClose, 
  onMatchUpdate // Callback to update the parent MatchDetailPage immediately
}) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  
  // Local state that mirrors the match data for instant updates
  const [localMatch, setLocalMatch] = useState(null);
  
  // Initialize local match state
  useEffect(() => {
    if (match && isOpen) {
      // Create a deep copy of the match with proper map structure
      const mapCount = getMapCount(match.format);
      const initialMaps = [];
      
      for (let i = 0; i < mapCount; i++) {
        const existingMap = match.maps?.[i];
        initialMaps.push({
          id: existingMap?.id || null,
          map_name: existingMap?.map_name || getDefaultMapName(i),
          game_mode: existingMap?.game_mode || getDefaultGameMode(i),
          team1_score: existingMap?.team1_score || 0,
          team2_score: existingMap?.team2_score || 0,
          team1_players: existingMap?.team1_players || getDefaultPlayers(match.team1),
          team2_players: existingMap?.team2_players || getDefaultPlayers(match.team2),
          status: existingMap?.status || 'upcoming'
        });
      }
      
      setLocalMatch({
        ...match,
        maps: initialMaps,
        team1_score: calculateTeamScore(initialMaps, 1),
        team2_score: calculateTeamScore(initialMaps, 2)
      });
    }
  }, [match, isOpen]);

  // Get number of maps based on format
  const getMapCount = (format) => {
    const formatMap = {
      'BO1': 1,
      'BO3': 3,
      'BO5': 5,
      'BO7': 7,
      'BO9': 9
    };
    return formatMap[format] || 3;
  };

  // Get default map name for map index
  const getDefaultMapName = (index) => {
    const competitiveMaps = MARVEL_RIVALS_MAPS.competitive;
    return competitiveMaps[index % competitiveMaps.length]?.name || 'TBD';
  };

  // Get default game mode for map index
  const getDefaultGameMode = (index) => {
    const modes = ['Domination', 'Convoy', 'Convergence'];
    return modes[index % modes.length];
  };

  // Get default players structure
  const getDefaultPlayers = (team) => {
    if (!team?.players) return [];
    return team.players.map(player => ({
      id: player.id,
      name: player.name,
      country: player.country,
      hero: 'TBD',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damage_blocked: 0
    }));
  };

  // Calculate team score based on map wins
  const calculateTeamScore = (maps, teamNumber) => {
    return maps.reduce((score, map) => {
      if (teamNumber === 1 && map.team1_score > map.team2_score) return score + 1;
      if (teamNumber === 2 && map.team2_score > map.team1_score) return score + 1;
      return score;
    }, 0);
  };

  // Update local state and immediately notify parent
  const updateLocalMatch = useCallback((updates) => {
    setLocalMatch(prev => {
      const updated = { ...prev, ...updates };
      
      // Recalculate team scores
      if (updates.maps) {
        updated.team1_score = calculateTeamScore(updates.maps, 1);
        updated.team2_score = calculateTeamScore(updates.maps, 2);
      }
      
      // Immediately update the parent component
      if (onMatchUpdate) {
        onMatchUpdate(updated);
      }
      
      return updated;
    });
  }, [onMatchUpdate]);

  // Update map score
  const updateMapScore = (mapIndex, team, score) => {
    const newMaps = [...localMatch.maps];
    newMaps[mapIndex] = {
      ...newMaps[mapIndex],
      [`team${team}_score`]: parseInt(score) || 0
    };
    updateLocalMatch({ maps: newMaps });
  };

  // Update player stat
  const updatePlayerStat = (mapIndex, team, playerIndex, stat, value) => {
    const newMaps = [...localMatch.maps];
    const players = [...newMaps[mapIndex][`team${team}_players`]];
    players[playerIndex] = {
      ...players[playerIndex],
      [stat]: stat === 'hero' ? value : (parseInt(value) || 0)
    };
    newMaps[mapIndex] = {
      ...newMaps[mapIndex],
      [`team${team}_players`]: players
    };
    updateLocalMatch({ maps: newMaps });
  };

  // Update map details
  const updateMapDetails = (mapIndex, field, value) => {
    const newMaps = [...localMatch.maps];
    newMaps[mapIndex] = {
      ...newMaps[mapIndex],
      [field]: value
    };
    updateLocalMatch({ maps: newMaps });
  };

  // Save all data to backend
  const handleSave = async () => {
    if (!localMatch) return;
    
    setSaving(true);
    try {
      const response = await api.put(`/matches/${localMatch.id}`, {
        maps: localMatch.maps,
        team1_score: localMatch.team1_score,
        team2_score: localMatch.team2_score,
        status: localMatch.status
      });
      
      if (response.data) {
        console.log('Match data saved successfully');
      }
    } catch (error) {
      console.error('Error saving match data:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get all heroes for dropdown
  const getAllHeroes = () => {
    const allHeroes = ['TBD'];
    Object.values(HEROES).forEach(roleHeroes => {
      allHeroes.push(...roleHeroes.filter(hero => hero !== 'TBD'));
    });
    return allHeroes;
  };

  if (!isOpen || !localMatch) return null;

  const currentMap = localMatch.maps[currentMapIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Live Scoring Panel
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {localMatch.team1?.name} vs {localMatch.team2?.name} • {localMatch.format}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {localMatch.team1_score} - {localMatch.team2_score}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save All'}
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Map Selection Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {localMatch.maps.map((map, index) => (
              <button
                key={index}
                onClick={() => setCurrentMapIndex(index)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                  currentMapIndex === index
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Map {index + 1}: {map.map_name}
                <span className="ml-2 text-xs">
                  ({map.team1_score}-{map.team2_score})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Map Content */}
        <div className="p-6">
          {/* Map Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Map {currentMapIndex + 1} Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Map Name
                </label>
                <select
                  value={currentMap.map_name}
                  onChange={(e) => updateMapDetails(currentMapIndex, 'map_name', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {MARVEL_RIVALS_MAPS.competitive.map(map => (
                    <option key={map.id} value={map.name}>{map.name}</option>
                  ))}
                  {MARVEL_RIVALS_MAPS.casual.map(map => (
                    <option key={map.id} value={map.name}>{map.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Game Mode
                </label>
                <select
                  value={currentMap.game_mode}
                  onChange={(e) => updateMapDetails(currentMapIndex, 'game_mode', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="Domination">Domination</option>
                  <option value="Convoy">Convoy</option>
                  <option value="Convergence">Convergence</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={currentMap.status}
                  onChange={(e) => updateMapDetails(currentMapIndex, 'status', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Map Scores */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                {localMatch.team1?.name || 'Team 1'}
              </h4>
              <input
                type="number"
                min="0"
                value={currentMap.team1_score}
                onChange={(e) => updateMapScore(currentMapIndex, 1, e.target.value)}
                className="w-24 h-16 text-3xl font-bold text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                {localMatch.team2?.name || 'Team 2'}
              </h4>
              <input
                type="number"
                min="0"
                value={currentMap.team2_score}
                onChange={(e) => updateMapScore(currentMapIndex, 2, e.target.value)}
                className="w-24 h-16 text-3xl font-bold text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Player Statistics */}
          <div className="space-y-8">
            {[1, 2].map(team => (
              <div key={team} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className={`px-6 py-3 ${team === 1 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'} rounded-t-lg`}>
                  <h4 className={`text-lg font-semibold ${team === 1 ? 'text-blue-800 dark:text-blue-200' : 'text-red-800 dark:text-red-200'}`}>
                    {team === 1 ? localMatch.team1?.name || 'Team 1' : localMatch.team2?.name || 'Team 2'}
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Player</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Hero</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">K</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">D</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">A</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">DMG</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Heal</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">BLK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {currentMap[`team${team}_players`].map((player, playerIndex) => (
                        <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{getCountryFlag(player.country || 'US')}</span>
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {player.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={player.hero || 'TBD'}
                              onChange={(e) => updatePlayerStat(currentMapIndex, team, playerIndex, 'hero', e.target.value)}
                              className="w-32 p-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              {getAllHeroes().map(hero => (
                                <option key={hero} value={hero}>{hero}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={player.eliminations || 0}
                              onChange={(e) => updatePlayerStat(currentMapIndex, team, playerIndex, 'eliminations', e.target.value)}
                              className="w-16 p-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={player.deaths || 0}
                              onChange={(e) => updatePlayerStat(currentMapIndex, team, playerIndex, 'deaths', e.target.value)}
                              className="w-16 p-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={player.assists || 0}
                              onChange={(e) => updatePlayerStat(currentMapIndex, team, playerIndex, 'assists', e.target.value)}
                              className="w-16 p-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={player.damage || 0}
                              onChange={(e) => updatePlayerStat(currentMapIndex, team, playerIndex, 'damage', e.target.value)}
                              className="w-20 p-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={player.healing || 0}
                              onChange={(e) => updatePlayerStat(currentMapIndex, team, playerIndex, 'healing', e.target.value)}
                              className="w-20 p-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={player.damage_blocked || 0}
                              onChange={(e) => updatePlayerStat(currentMapIndex, team, playerIndex, 'damage_blocked', e.target.value)}
                              className="w-20 p-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveScoringPanel;