import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trophy, Play, Pause, RotateCcw, ChevronDown, Users, Award } from 'lucide-react';
import { useAuth } from '../../hooks';
import { HEROES } from '../../constants/marvelRivalsData';
import { getHeroImageSync, getHeroRole, getTeamLogoUrl } from '../../utils/imageUtils';
import liveScoreSync from '../../utils/LiveScoreSync';

/**
 * Unified Live Scoring Panel
 * - Uses localStorage events for instant updates
 * - Polling system for server sync
 * - Immediate reflection of all changes
 * - No Pusher/WebSocket dependencies
 */
const UnifiedLiveScoring = ({ isOpen, onClose, match, onUpdate }) => {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
  const token = localStorage.getItem('authToken');
  const hasAdminAccess = isAuthenticated && token && user && isAdmin();
  
  // State Management
  const [matchData, setMatchData] = useState({
    team1Score: 0,
    team2Score: 0,
    team1SeriesScore: 0,
    team2SeriesScore: 0,
    status: 'live',
    currentMap: 1,
    totalMaps: 5,
    matchTimer: '00:00',
    team1Players: [],
    team2Players: [],
    maps: {
      1: { team1Score: 0, team2Score: 0, status: 'active', winner: null },
      2: { team1Score: 0, team2Score: 0, status: 'pending', winner: null },
      3: { team1Score: 0, team2Score: 0, status: 'pending', winner: null },
      4: { team1Score: 0, team2Score: 0, status: 'pending', winner: null },
      5: { team1Score: 0, team2Score: 0, status: 'pending', winner: null }
    }
  });
  
  const [expandedStats, setExpandedStats] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const isUnmountedRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  // Initialize match data on mount
  useEffect(() => {
    if (match?.id) {
      loadMatchData();
      
      // Subscribe to live updates
      const unsubscribe = liveScoreSync.subscribe(match.id, handleLiveUpdate);
      
      return () => {
        isUnmountedRef.current = true;
        unsubscribe();
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
      };
    }
  }, [match?.id]);

  // Load initial match data
  const loadMatchData = async () => {
    if (!match?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/matches/${match.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        updateMatchDataFromResponse(data);
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update match data from API response
  const updateMatchDataFromResponse = (data) => {
    const team1Players = [];
    const team2Players = [];
    
    // Get current map number and access the correct map data
    const currentMapNumber = data.current_map || data.currentMap || matchData.currentMap || 1;
    const maps = data.maps || [];
    const currentMapData = Array.isArray(maps) ? maps[currentMapNumber - 1] : maps[currentMapNumber];
    
    // Get player compositions from current map
    const team1Composition = currentMapData?.team1_composition || data.team1_players || [];
    const team2Composition = currentMapData?.team2_composition || data.team2_players || [];
    
    // Process team 1 players
    for (let i = 0; i < 6; i++) {
      const playerData = team1Composition[i] || {};
      const kda = (playerData.eliminations || 0) + (playerData.assists || 0);
      const kdaRatio = playerData.deaths > 0 ? (kda / playerData.deaths).toFixed(2) : kda.toFixed(2);
      
      team1Players.push({
        id: playerData.player_id || playerData.id || `t1_p${i}`,
        name: playerData.name || playerData.username || `Player ${i + 1}`,
        hero: playerData.hero || '',
        role: playerData.role || (playerData.hero ? getHeroRole(playerData.hero) : ''),
        kills: playerData.eliminations || 0,
        deaths: playerData.deaths || 0,
        assists: playerData.assists || 0,
        damage: playerData.damage || 0,
        healing: playerData.healing || 0,
        blocked: playerData.damage_blocked || 0,
        kda: kdaRatio,
        isAlive: true
      });
    }
    
    // Process team 2 players
    for (let i = 0; i < 6; i++) {
      const playerData = team2Composition[i] || {};
      const kda = (playerData.eliminations || 0) + (playerData.assists || 0);
      const kdaRatio = playerData.deaths > 0 ? (kda / playerData.deaths).toFixed(2) : kda.toFixed(2);
      
      team2Players.push({
        id: playerData.player_id || playerData.id || `t2_p${i}`,
        name: playerData.name || playerData.username || `Player ${i + 1}`,
        hero: playerData.hero || '',
        role: playerData.role || (playerData.hero ? getHeroRole(playerData.hero) : ''),
        kills: playerData.eliminations || 0,
        deaths: playerData.deaths || 0,
        assists: playerData.assists || 0,
        damage: playerData.damage || 0,
        healing: playerData.healing || 0,
        blocked: playerData.damage_blocked || 0,
        kda: kdaRatio,
        isAlive: true
      });
    }
    
    // Process maps data
    const mapsData = data.maps || [];
    const processedMaps = {};
    const totalMaps = Array.isArray(mapsData) ? mapsData.length : (data.total_maps || 5);
    
    if (Array.isArray(mapsData)) {
      // Handle array format (from our API)
      mapsData.forEach((map, index) => {
        const mapNumber = index + 1;
        processedMaps[mapNumber] = {
          team1Score: map.team1_score || 0,
          team2Score: map.team2_score || 0,
          status: map.status || 'pending',
          winner: map.winner_id || null,
          mapName: map.map_name || `Map ${mapNumber}`,
          mode: map.mode || 'Push'
        };
      });
      
      // Fill remaining maps up to 5 if needed
      for (let i = mapsData.length + 1; i <= 5; i++) {
        processedMaps[i] = {
          team1Score: 0,
          team2Score: 0,
          status: 'pending',
          winner: null,
          mapName: `Map ${i}`,
          mode: 'Push'
        };
      }
    } else {
      // Handle object format (legacy)
      for (let i = 1; i <= totalMaps; i++) {
        processedMaps[i] = {
          team1Score: mapsData[i]?.team1_score || 0,
          team2Score: mapsData[i]?.team2_score || 0,
          status: mapsData[i]?.status || (i === currentMapNumber ? 'active' : i < currentMapNumber ? 'completed' : 'pending'),
          winner: mapsData[i]?.winner || null,
          mapName: mapsData[i]?.map_name || `Map ${i}`,
          mode: mapsData[i]?.mode || 'Push'
        };
      }
    }
    
    setMatchData({
      team1Score: processedMaps[currentMapNumber]?.team1Score || 0,
      team2Score: processedMaps[currentMapNumber]?.team2Score || 0,
      team1SeriesScore: data.series_score_team1 || 0,
      team2SeriesScore: data.series_score_team2 || 0,
      status: data.status || 'live',
      team1Players,
      team2Players,
      currentMap: currentMapNumber,
      totalMaps: totalMaps,
      matchTimer: matchData.matchTimer || '00:00',
      maps: processedMaps
    });
  };

  // Handle live updates from localStorage/polling
  const handleLiveUpdate = useCallback((updateData) => {
    if (isUnmountedRef.current) return;
    
    updateMatchDataFromResponse(updateData);
    setLastUpdate(new Date().toLocaleTimeString());
    
    // Notify parent component
    if (onUpdate) {
      onUpdate(updateData);
    }
  }, [onUpdate]);

  // Save match data (broadcasts to all tabs immediately)
  const saveMatchData = useCallback(async () => {
    if (!match?.id || !hasAdminAccess) return;
    
    // Prepare data for save
    const saveData = {
      id: match.id,
      team1_score: matchData.maps[matchData.currentMap].team1Score,
      team2_score: matchData.maps[matchData.currentMap].team2Score,
      series_score_team1: matchData.team1SeriesScore,
      series_score_team2: matchData.team2SeriesScore,
      current_map: matchData.currentMap,
      status: matchData.status,
      maps: matchData.maps,
      team1_players: matchData.team1Players,
      team2_players: matchData.team2Players,
      total_maps: matchData.totalMaps
    };
    
    // Broadcast immediately via localStorage
    liveScoreSync.broadcastUpdate(match.id, saveData);
    
    // Debounced API save
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/live-update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saveData)
        });
        
        if (!response.ok) {
          console.error('Failed to save to server');
        }
      } catch (error) {
        console.error('Error saving match data:', error);
      }
    }, 500); // Debounce API calls by 500ms
  }, [match?.id, matchData, hasAdminAccess, token]);

  // Update functions with immediate save
  const updateScore = (team, delta) => {
    const newMatchData = { ...matchData };
    const currentMapData = { ...newMatchData.maps[newMatchData.currentMap] };
    
    if (team === 1) {
      currentMapData.team1Score = Math.max(0, currentMapData.team1Score + delta);
    } else {
      currentMapData.team2Score = Math.max(0, currentMapData.team2Score + delta);
    }
    
    newMatchData.maps[newMatchData.currentMap] = currentMapData;
    newMatchData.team1Score = currentMapData.team1Score;
    newMatchData.team2Score = currentMapData.team2Score;
    
    setMatchData(newMatchData);
    saveMatchData();
  };

  const updateSeriesScore = (team, delta) => {
    const newMatchData = { ...matchData };
    
    if (team === 1) {
      newMatchData.team1SeriesScore = Math.max(0, newMatchData.team1SeriesScore + delta);
    } else {
      newMatchData.team2SeriesScore = Math.max(0, newMatchData.team2SeriesScore + delta);
    }
    
    setMatchData(newMatchData);
    saveMatchData();
  };

  const updatePlayerHero = (team, playerIndex, hero) => {
    const newMatchData = { ...matchData };
    const players = team === 1 ? [...newMatchData.team1Players] : [...newMatchData.team2Players];
    
    players[playerIndex] = {
      ...players[playerIndex],
      hero: hero,
      role: hero ? getHeroRole(hero) : ''
    };
    
    if (team === 1) {
      newMatchData.team1Players = players;
    } else {
      newMatchData.team2Players = players;
    }
    
    setMatchData(newMatchData);
    saveMatchData();
  };

  const updatePlayerStat = (team, playerIndex, stat, value) => {
    const newMatchData = { ...matchData };
    const players = team === 1 ? [...newMatchData.team1Players] : [...newMatchData.team2Players];
    
    players[playerIndex] = {
      ...players[playerIndex],
      [stat]: Math.max(0, parseInt(value) || 0)
    };
    
    // Recalculate KDA
    const { kills, deaths, assists } = players[playerIndex];
    players[playerIndex].kda = deaths === 0 
      ? (kills + assists).toFixed(2) 
      : ((kills + assists) / deaths).toFixed(2);
    
    if (team === 1) {
      newMatchData.team1Players = players;
    } else {
      newMatchData.team2Players = players;
    }
    
    setMatchData(newMatchData);
    saveMatchData();
  };

  const switchMap = async (mapNumber) => {
    if (!match?.id) return;
    
    // Update UI immediately 
    setMatchData(prev => {
      const newData = { ...prev };
      newData.currentMap = mapNumber;
      
      // Update current scores to reflect the selected map
      if (newData.maps && newData.maps[mapNumber]) {
        newData.team1Score = newData.maps[mapNumber].team1Score || 0;
        newData.team2Score = newData.maps[mapNumber].team2Score || 0;
      }
      
      return newData;
    });
    
    // Reload player data for the selected map
    await loadMatchData();
  };

  const endCurrentMap = () => {
    const newMatchData = { ...matchData };
    const currentMapData = newMatchData.maps[newMatchData.currentMap];
    
    // Determine winner
    if (currentMapData.team1Score > currentMapData.team2Score) {
      currentMapData.winner = 'team1';
      newMatchData.team1SeriesScore++;
    } else if (currentMapData.team2Score > currentMapData.team1Score) {
      currentMapData.winner = 'team2';
      newMatchData.team2SeriesScore++;
    }
    
    currentMapData.status = 'completed';
    
    // Move to next map if available
    if (newMatchData.currentMap < newMatchData.totalMaps) {
      newMatchData.currentMap++;
      const nextMapData = newMatchData.maps[newMatchData.currentMap];
      nextMapData.status = 'active';
      newMatchData.team1Score = nextMapData.team1Score;
      newMatchData.team2Score = nextMapData.team2Score;
    }
    
    setMatchData(newMatchData);
    saveMatchData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Live Scoring Panel</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Last Update: {lastUpdate} | Status: {matchData.status}
          </div>
        </div>

        {/* Map Selector */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].slice(0, matchData.totalMaps).map(mapNum => {
              const mapData = matchData.maps && matchData.maps[mapNum] ? matchData.maps[mapNum] : { status: 'pending', winner: null };
              return (
                <button
                  key={mapNum}
                  onClick={() => switchMap(mapNum)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    matchData.currentMap === mapNum
                      ? 'bg-blue-600 text-white shadow-lg'
                      : mapData.status === 'completed'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {mapData.mapName || `Map ${mapNum}`}
                    {mapData.winner && (
                      <Trophy size={14} className="text-yellow-400" />
                    )}
                  </div>
                  {mapData.status === 'completed' && (
                    <div className="text-xs mt-1">
                      {mapData.team1Score}-{mapData.team2Score}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Score Controls */}
        <div className="p-4 bg-gray-750">
          <div className="grid grid-cols-3 gap-4">
            {/* Team 1 Score */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-blue-400 mb-2">
                {match?.team1?.name || 'Team 1'}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => updateScore(1, -1)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-white px-4">
                  {matchData.team1Score}
                </span>
                <button
                  onClick={() => updateScore(1, 1)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  +
                </button>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-400">Series: </span>
                <span className="text-xl font-bold text-white">
                  {matchData.team1SeriesScore}
                </span>
              </div>
            </div>

            {/* Match Controls */}
            <div className="text-center">
              <div className="mb-4">
                <span className="text-2xl font-bold text-white">
                  Map {matchData.currentMap} of {matchData.totalMaps}
                </span>
              </div>
              <button
                onClick={endCurrentMap}
                className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                End Current Map
              </button>
            </div>

            {/* Team 2 Score */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-red-400 mb-2">
                {match?.team2?.name || 'Team 2'}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => updateScore(2, -1)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-white px-4">
                  {matchData.team2Score}
                </span>
                <button
                  onClick={() => updateScore(2, 1)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  +
                </button>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-400">Series: </span>
                <span className="text-xl font-bold text-white">
                  {matchData.team2SeriesScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="p-4">
          <button
            onClick={() => setExpandedStats(!expandedStats)}
            className="flex items-center gap-2 text-white mb-4 text-lg font-bold"
          >
            <ChevronDown className={`transform transition-transform ${expandedStats ? 'rotate-180' : ''}`} />
            Player Statistics - Map {matchData.currentMap}
          </button>

          {expandedStats && (
            <div className="space-y-6">
              {/* Team 1 Players */}
              <div className="bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                  <Users size={18} />
                  {match?.team1?.name || 'Team 1'} Players
                </h4>
                <div className="space-y-3">
                  {matchData.team1Players.map((player, idx) => (
                    <div key={player.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Hero Image */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                          {player.hero && (
                            <img 
                              src={getHeroImageSync(player.hero)}
                              alt={player.hero}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          )}
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs" style={{display: player.hero ? 'none' : 'flex'}}>
                            {player.hero ? player.hero.charAt(0) : '?'}
                          </div>
                        </div>
                        
                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{player.name}</div>
                          <div className="text-sm text-gray-400">{player.role || 'No Role'}</div>
                        </div>
                        
                        {/* Hero Select */}
                        <select
                          value={player.hero}
                          onChange={(e) => updatePlayerHero(1, idx, e.target.value)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          <option value="">Select Hero</option>
                          {Object.keys(HEROES).map(hero => (
                            <option key={hero} value={hero}>{hero}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-6 gap-2">
                        {[
                          { key: 'kills', label: 'K', color: 'text-green-400' },
                          { key: 'deaths', label: 'D', color: 'text-red-400' },
                          { key: 'assists', label: 'A', color: 'text-blue-400' },
                          { key: 'damage', label: 'DMG', color: 'text-orange-400' },
                          { key: 'healing', label: 'H', color: 'text-green-300' },
                          { key: 'blocked', label: 'B', color: 'text-purple-400' }
                        ].map(stat => (
                          <div key={stat.key} className="text-center">
                            <label className={`text-xs font-medium ${stat.color}`}>{stat.label}</label>
                            <input
                              type="number"
                              value={player[stat.key]}
                              onChange={(e) => updatePlayerStat(1, idx, stat.key, e.target.value)}
                              className="w-full bg-gray-600 text-white px-1 py-1 rounded text-sm text-center"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 Players */}
              <div className="bg-red-900/20 rounded-lg p-4">
                <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                  <Users size={18} />
                  {match?.team2?.name || 'Team 2'} Players
                </h4>
                <div className="space-y-3">
                  {matchData.team2Players.map((player, idx) => (
                    <div key={player.id} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Hero Image */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
                          {player.hero && (
                            <img 
                              src={getHeroImageSync(player.hero)}
                              alt={player.hero}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          )}
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs" style={{display: player.hero ? 'none' : 'flex'}}>
                            {player.hero ? player.hero.charAt(0) : '?'}
                          </div>
                        </div>
                        
                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{player.name}</div>
                          <div className="text-sm text-gray-400">{player.role || 'No Role'}</div>
                        </div>
                        
                        {/* Hero Select */}
                        <select
                          value={player.hero}
                          onChange={(e) => updatePlayerHero(2, idx, e.target.value)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          <option value="">Select Hero</option>
                          {Object.keys(HEROES).map(hero => (
                            <option key={hero} value={hero}>{hero}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-6 gap-2">
                        {[
                          { key: 'kills', label: 'K', color: 'text-green-400' },
                          { key: 'deaths', label: 'D', color: 'text-red-400' },
                          { key: 'assists', label: 'A', color: 'text-blue-400' },
                          { key: 'damage', label: 'DMG', color: 'text-orange-400' },
                          { key: 'healing', label: 'H', color: 'text-green-300' },
                          { key: 'blocked', label: 'B', color: 'text-purple-400' }
                        ].map(stat => (
                          <div key={stat.key} className="text-center">
                            <label className={`text-xs font-medium ${stat.color}`}>{stat.label}</label>
                            <input
                              type="number"
                              value={player[stat.key]}
                              onChange={(e) => updatePlayerStat(2, idx, stat.key, e.target.value)}
                              className="w-full bg-gray-600 text-white px-1 py-1 rounded text-sm text-center"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedLiveScoring;