import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trophy, Play, Pause, RotateCcw, ChevronDown, Users, Award } from 'lucide-react';
import { useAuth } from '../../hooks';
import { HEROES } from '../../constants/marvelRivalsData';
import { getHeroImageSync, getHeroRole, getTeamLogoUrl } from '../../utils/imageUtils';
import liveScoreSync from '../../utils/LiveScoreSyncSimple';

/**
 * Unified Live Scoring Panel
 * - Uses localStorage events for instant updates
 * - Polling system for server sync
 * - Immediate reflection of all changes
 * - No Pusher/WebSocket dependencies
 */
const UnifiedLiveScoring = ({ isOpen, onClose, match, onUpdate }) => {
  const { isAuthenticated, user, isAdmin, api } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
  const token = localStorage.getItem('authToken');
  const hasAdminAccess = isAuthenticated && token && user && isAdmin();

  // Get match ID from URL parameters if not provided as prop
  const getMatchIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('match_id');
  };

  const [matchFromApi, setMatchFromApi] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use provided match or fetch from API using URL parameter
  const currentMatch = match || matchFromApi;
  // Fetch match from API if match ID is provided in URL
  useEffect(() => {
    const matchIdFromUrl = getMatchIdFromUrl();
    if (matchIdFromUrl && !match) {
      setLoading(true);
      api.get(`/matches/${matchIdFromUrl}`)
        .then(response => {
          setMatchFromApi(response.data?.data || response.data);
        })
        .catch(error => {
          console.error('Error fetching match:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [match, api]);

  // State Management
  const [matchData, setMatchData] = useState(() => {
    const defaultMaps = {};
    const defaultTotalMaps = 3; // Default to BO3
    
    // Only create maps based on format
    for (let i = 1; i <= defaultTotalMaps; i++) {
      defaultMaps[i] = {
        team1Score: 0,
        team2Score: 0,
        status: i === 1 ? 'active' : 'pending',
        winner: null,
        team1Players: [],
        team2Players: []
      };
    }
    
    return {
      team1Score: 0,
      team2Score: 0,
      team1SeriesScore: 0,
      team2SeriesScore: 0,
      status: 'live',
      currentMap: 1,
      totalMaps: defaultTotalMaps,
      matchTimer: '00:00',
      team1Players: [],
      team2Players: [],
      maps: defaultMaps
    };
  });
  
  const [expandedStats, setExpandedStats] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const isUnmountedRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const matchDataRef = useRef(matchData);
  const hasLoadedInitialData = useRef(false);

  // Keep ref updated
  useEffect(() => {
    matchDataRef.current = matchData;
  }, [matchData]);

  // Initialize match data on mount
  useEffect(() => {
    if (currentMatch?.id) {
      hasLoadedInitialData.current = false; // Reset flag for new match
      loadMatchData();
      
      // Subscribe to live updates
      const unsubscribe = liveScoreSync.subscribe(currentMatch.id, handleLiveUpdate);
      
      return () => {
        isUnmountedRef.current = true;
        hasLoadedInitialData.current = false; // Reset flag on unmount
        unsubscribe();
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
      };
    }
  }, [currentMatch?.id]);

  // Load initial match data
  const loadMatchData = async () => {
    if (!currentMatch?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/matches/${currentMatch.id}`, {
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
    
    // Convert backend's current_map to number
    const backendMapNumber = parseInt(data.current_map || data.currentMap || data.current_map_number || 1);
    
    // On initial load, use backend's current map. Otherwise preserve the current view
    let currentMapNumber;
    if (!hasLoadedInitialData.current) {
      // First load - use backend's map
      currentMapNumber = backendMapNumber;
      hasLoadedInitialData.current = true;
    } else {
      // Subsequent updates - preserve current view unless it's invalid
      const existingMapNumber = matchDataRef.current?.currentMap;
      currentMapNumber = (existingMapNumber && existingMapNumber > 0) ? existingMapNumber : backendMapNumber;
    }
    const maps = data.maps_data || data.maps || [];
    const currentMapData = Array.isArray(maps) ? maps[currentMapNumber - 1] : maps[currentMapNumber];
    
    // Get player compositions from current map or fallback to match data
    // First try map-specific data, then saved player data, then team roster
    const team1Composition = currentMapData?.team1_composition || 
                           currentMapData?.team1_players || 
                           data.team1_players || 
                           (typeof data.team1_players === 'string' ? JSON.parse(data.team1_players) : data.team1_players) ||
                           data.team1?.players ||
                           [];
    const team2Composition = currentMapData?.team2_composition || 
                           currentMapData?.team2_players || 
                           data.team2_players || 
                           (typeof data.team2_players === 'string' ? JSON.parse(data.team2_players) : data.team2_players) ||
                           data.team2?.players ||
                           [];
    
    // Get team roster for fallback names
    const team1Roster = data.team1?.players || [];
    const team2Roster = data.team2?.players || [];
    
    // Process team 1 players
    for (let i = 0; i < 6; i++) {
      const playerData = team1Composition[i] || {};
      const rosterPlayer = team1Roster[i] || {};
      const kda = (playerData.eliminations || 0) + (playerData.assists || 0);
      const kdaRatio = playerData.deaths > 0 ? (kda / playerData.deaths).toFixed(2) : kda.toFixed(2);
      
      team1Players.push({
        id: playerData.player_id || playerData.id || rosterPlayer.id || `t1_p${i}`,
        name: playerData.name || playerData.username || rosterPlayer.username || rosterPlayer.name || `Player ${i + 1}`,
        hero: playerData.hero || '',
        role: playerData.role || (playerData.hero ? getHeroRole(playerData.hero) : ''),
        kills: playerData.kills || playerData.eliminations || 0,
        deaths: playerData.deaths || 0,
        assists: playerData.assists || 0,
        damage: playerData.damage || 0,
        healing: playerData.healing || 0,
        blocked: playerData.blocked || playerData.damage_blocked || 0,
        kda: playerData.kda || kdaRatio,
        isAlive: playerData.isAlive !== undefined ? playerData.isAlive : true
      });
    }
    
    // Process team 2 players
    for (let i = 0; i < 6; i++) {
      const playerData = team2Composition[i] || {};
      const rosterPlayer = team2Roster[i] || {};
      const kda = (playerData.eliminations || 0) + (playerData.assists || 0);
      const kdaRatio = playerData.deaths > 0 ? (kda / playerData.deaths).toFixed(2) : kda.toFixed(2);
      
      team2Players.push({
        id: playerData.player_id || playerData.id || rosterPlayer.id || `t2_p${i}`,
        name: playerData.name || playerData.username || rosterPlayer.username || rosterPlayer.name || `Player ${i + 1}`,
        hero: playerData.hero || '',
        role: playerData.role || (playerData.hero ? getHeroRole(playerData.hero) : ''),
        kills: playerData.kills || playerData.eliminations || 0,
        deaths: playerData.deaths || 0,
        assists: playerData.assists || 0,
        damage: playerData.damage || 0,
        healing: playerData.healing || 0,
        blocked: playerData.blocked || playerData.damage_blocked || 0,
        kda: playerData.kda || kdaRatio,
        isAlive: playerData.isAlive !== undefined ? playerData.isAlive : true
      });
    }
    
    // Process maps data with player compositions
    const mapsData = data.maps_data || data.maps || [];
    const processedMaps = {};
    // Determine total maps from format (BO3 = 3, BO5 = 5) or actual data length
    const format = data.format || data.match_format || 'BO3';
    const formatMaps = format === 'BO3' ? 3 : format === 'BO5' ? 5 : 3;
    const totalMaps = data.total_maps_played || formatMaps;
    
    if (Array.isArray(mapsData)) {
      // Handle array format (from our API)
      mapsData.forEach((map, index) => {
        const mapNumber = index + 1;
        
        // Get player data for this specific map
        const mapTeam1Players = map.team1_composition || map.team1_players || [];
        const mapTeam2Players = map.team2_composition || map.team2_players || [];
        
        processedMaps[mapNumber] = {
          team1Score: map.team1_score || 0,
          team2Score: map.team2_score || 0,
          status: map.status || 'pending',
          winner: map.winner_id || null,
          mapName: map.map_name || `Map ${mapNumber}`,
          mode: map.mode || 'Push',
          team1Players: mapNumber === currentMapNumber ? team1Players : mapTeam1Players,
          team2Players: mapNumber === currentMapNumber ? team2Players : mapTeam2Players
        };
      });
      
      // Fill remaining maps up to totalMaps if needed
      for (let i = mapsData.length + 1; i <= totalMaps; i++) {
        processedMaps[i] = {
          team1Score: 0,
          team2Score: 0,
          status: 'pending',
          winner: null,
          mapName: `Map ${i}`,
          mode: 'Push',
          team1Players: i === currentMapNumber ? team1Players : [],
          team2Players: i === currentMapNumber ? team2Players : []
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
          mode: mapsData[i]?.mode || 'Push',
          team1Players: i === currentMapNumber ? team1Players : (mapsData[i]?.team1Players || []),
          team2Players: i === currentMapNumber ? team2Players : (mapsData[i]?.team2Players || [])
        };
      }
    }
    
    setMatchData({
      team1Score: processedMaps[currentMapNumber]?.team1Score || 0,
      team2Score: processedMaps[currentMapNumber]?.team2Score || 0,
      team1SeriesScore: data.series_score_team1 || 0,
      team2SeriesScore: data.series_score_team2 || 0,
      status: data.status || 'live',
      team1Players: processedMaps[currentMapNumber]?.team1Players || team1Players,
      team2Players: processedMaps[currentMapNumber]?.team2Players || team2Players,
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
  const saveMatchData = useCallback(async (includeMapSwitch = false) => {
    if (!currentMatch?.id || !hasAdminAccess) return;
    
    // Use the ref to get the latest state
    const currentData = matchDataRef.current;
    
    // First, save current map's player data
    const updatedMaps = { ...currentData.maps };
    if (updatedMaps[currentData.currentMap]) {
      updatedMaps[currentData.currentMap].team1Players = currentData.team1Players;
      updatedMaps[currentData.currentMap].team2Players = currentData.team2Players;
    }
    
    // Convert maps object to array for compatibility
    const mapsArray = Object.keys(updatedMaps)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => ({
        ...updatedMaps[key],
        map_number: parseInt(key),
        team1_score: updatedMaps[key].team1Score,
        team2_score: updatedMaps[key].team2Score,
        team1_composition: updatedMaps[key].team1Players || [],
        team2_composition: updatedMaps[key].team2Players || []
      }));
    
    // Prepare data for save
    const saveData = {
      id: currentMatch.id,
      team1_score: currentData.maps[currentData.currentMap].team1Score,
      team2_score: currentData.maps[currentData.currentMap].team2Score,
      series_score_team1: currentData.team1SeriesScore,
      series_score_team2: currentData.team2SeriesScore,
      // Only include current_map when explicitly switching maps
      ...(includeMapSwitch && { 
        current_map: currentData.currentMap,
        isMapSwitch: true  // Flag to indicate intentional map switch
      }),
      status: currentData.status,
      maps: mapsArray,
      team1_players: currentData.team1Players,
      team2_players: currentData.team2Players,
      total_maps: currentData.totalMaps
    };
    
    // Broadcast immediately via localStorage
    liveScoreSync.broadcastUpdate(currentMatch.id, saveData);
    setSaveStatus('saving');
    
    // Debounced API save
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/matches/${currentMatch.id}/live-update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'score-update',
            data: saveData,
            timestamp: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          console.error('Failed to save to server');
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch (error) {
        console.error('Error saving match data:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 500); // Debounce API calls by 500ms
  }, [currentMatch?.id, hasAdminAccess, token]); // Removed matchData from deps since we use ref

  // Update functions with immediate save
  const updateScore = (team, delta) => {
    setMatchData(prev => {
      const newMatchData = { ...prev };
      const currentMapData = { ...newMatchData.maps[newMatchData.currentMap] };
      
      if (team === 1) {
        currentMapData.team1Score = Math.max(0, currentMapData.team1Score + delta);
      } else {
        currentMapData.team2Score = Math.max(0, currentMapData.team2Score + delta);
      }
      
      newMatchData.maps[newMatchData.currentMap] = currentMapData;
      newMatchData.team1Score = currentMapData.team1Score;
      newMatchData.team2Score = currentMapData.team2Score;
      
      // Trigger save after state update
      setTimeout(() => saveMatchData(), 100);
      
      return newMatchData;
    });
  };

  const updateSeriesScore = (team, delta) => {
    setMatchData(prev => {
      const newMatchData = { ...prev };
      
      if (team === 1) {
        newMatchData.team1SeriesScore = Math.max(0, newMatchData.team1SeriesScore + delta);
      } else {
        newMatchData.team2SeriesScore = Math.max(0, newMatchData.team2SeriesScore + delta);
      }
      
      // Trigger save after state update
      setTimeout(() => saveMatchData(), 100);
      
      return newMatchData;
    });
  };

  const updatePlayerHero = async (team, playerIndex, hero) => {
    console.log('updatePlayerHero called:', { team, playerIndex, hero });
    // Get the current player data before updating
    const currentPlayers = team === 1 ? matchData.team1Players : matchData.team2Players;
    const player = currentPlayers[playerIndex];
    console.log('Player data:', player);
    
    setMatchData(prev => {
      const newMatchData = { ...prev };
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
      
      // Also update the current map's player data
      if (newMatchData.maps[newMatchData.currentMap]) {
        newMatchData.maps[newMatchData.currentMap].team1Players = newMatchData.team1Players;
        newMatchData.maps[newMatchData.currentMap].team2Players = newMatchData.team2Players;
      }
      
      return newMatchData;
    });
    
    // Send specific hero update immediately with current data
    const playerId = player?.player_id || player?.id;
    if (player && playerId) {
      console.log('Sending hero update to backend:', {
        player_id: playerId,
        hero: hero,
        map_index: matchData.currentMap  // Keep 1-based for backend consistency
      });
      try {
        const response = await fetch(`${BACKEND_URL}/api/matches/${currentMatch.id}/live-update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'hero-update',
            data: {
              map_index: matchData.currentMap,  // Keep 1-based for backend consistency
              team: team,
              player_id: playerId,
              hero: hero,
              role: hero ? getHeroRole(hero) : '',
              player_name: player.name
            },
            timestamp: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          console.error('Failed to update hero');
        }
      } catch (error) {
        console.error('Error updating hero:', error);
      }
    }
  };

  const updatePlayerStat = async (team, playerIndex, stat, value) => {
    console.log('updatePlayerStat called:', { team, playerIndex, stat, value });
    // Get the current player data before updating
    const currentPlayers = team === 1 ? matchData.team1Players : matchData.team2Players;
    const player = currentPlayers[playerIndex];
    const numericValue = Math.max(0, parseInt(value) || 0);
    console.log('Player data:', player);
    
    setMatchData(prev => {
      const newMatchData = { ...prev };
      const players = team === 1 ? [...newMatchData.team1Players] : [...newMatchData.team2Players];
      
      players[playerIndex] = {
        ...players[playerIndex],
        [stat]: numericValue
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
      
      // Also update the current map's player data
      if (newMatchData.maps[newMatchData.currentMap]) {
        newMatchData.maps[newMatchData.currentMap].team1Players = newMatchData.team1Players;
        newMatchData.maps[newMatchData.currentMap].team2Players = newMatchData.team2Players;
      }
      
      return newMatchData;
    });
    
    // Send specific stat update immediately with current data
    const playerId = player?.player_id || player?.id;
    if (player && playerId) {
      console.log('Sending stat update to backend:', {
        player_id: playerId,
        stat_type: stat,
        value: numericValue,
        map_index: matchData.currentMap  // Keep 1-based for backend consistency
      });
      try {
        const response = await fetch(`${BACKEND_URL}/api/matches/${currentMatch.id}/live-update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'stats-update',
            data: {
              map_index: matchData.currentMap,  // Keep 1-based for backend consistency
              team: team,
              player_id: playerId,
              stat_type: stat,
              value: numericValue,
              player_name: player.name
            },
            timestamp: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          console.error('Failed to update stat');
        }
      } catch (error) {
        console.error('Error updating stat:', error);
      }
    }
  };

  const switchMap = async (mapNumber) => {
    if (!currentMatch?.id) return;
    
    console.log(`Switching to map ${mapNumber}`);
    
    // Save current map's player data before switching
    setMatchData(prev => {
      const newData = { ...prev };
      
      // Save current map's player data
      if (newData.maps[newData.currentMap]) {
        newData.maps[newData.currentMap].team1Players = [...prev.team1Players];
        newData.maps[newData.currentMap].team2Players = [...prev.team2Players];
      }
      
      // Switch to new map
      newData.currentMap = mapNumber;
      
      // Load new map's data
      if (newData.maps && newData.maps[mapNumber]) {
        newData.team1Score = newData.maps[mapNumber].team1Score || 0;
        newData.team2Score = newData.maps[mapNumber].team2Score || 0;
        
        // Load player data for the new map
        newData.team1Players = newData.maps[mapNumber].team1Players || [];
        newData.team2Players = newData.maps[mapNumber].team2Players || [];
        
        // If no players exist for this map, create empty player slots
        if (newData.team1Players.length === 0) {
          for (let i = 0; i < 6; i++) {
            newData.team1Players.push({
              id: `t1_p${i}`,
              name: `Player ${i + 1}`,
              hero: '',
              role: '',
              kills: 0,
              deaths: 0,
              assists: 0,
              damage: 0,
              healing: 0,
              blocked: 0,
              kda: '0.00',
              isAlive: true
            });
          }
        }
        
        if (newData.team2Players.length === 0) {
          for (let i = 0; i < 6; i++) {
            newData.team2Players.push({
              id: `t2_p${i}`,
              name: `Player ${i + 1}`,
              hero: '',
              role: '',
              kills: 0,
              deaths: 0,
              assists: 0,
              damage: 0,
              healing: 0,
              blocked: 0,
              kda: '0.00',
              isAlive: true
            });
          }
        }
      }
      
      return newData;
    });
    
    // Send map switch update after state changes
    setTimeout(() => saveMatchData(true), 100);
  };

  const copyLineupFromPreviousMap = () => {
    if (matchData.currentMap <= 1) return;
    
    setMatchData(prev => {
      const newMatchData = { ...prev };
      const prevMapData = newMatchData.maps[newMatchData.currentMap - 1];
      
      // Copy players with heroes but reset stats
      newMatchData.team1Players = (prevMapData.team1Players || []).map(player => ({
        ...player,
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        healing: 0,
        blocked: 0,
        kda: '0.00',
        isAlive: true
      }));
      
      newMatchData.team2Players = (prevMapData.team2Players || []).map(player => ({
        ...player,
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        healing: 0,
        blocked: 0,
        kda: '0.00',
        isAlive: true
      }));
      
      // Update current map data
      newMatchData.maps[newMatchData.currentMap].team1Players = newMatchData.team1Players;
      newMatchData.maps[newMatchData.currentMap].team2Players = newMatchData.team2Players;
      
      // Trigger save
      setTimeout(() => saveMatchData(), 100);
      
      return newMatchData;
    });
  };

  const endCurrentMap = () => {
    // Add confirmation dialog
    const currentScore = `${matchData.team1Score} - ${matchData.team2Score}`;
    const winner = matchData.team1Score > matchData.team2Score ? match?.team1?.name : 
                   matchData.team2Score > matchData.team1Score ? match?.team2?.name : 'Draw';
    
    if (!window.confirm(`End Map ${matchData.currentMap} with score ${currentScore}?\nWinner: ${winner}\n\nThis action cannot be undone.`)) {
      return;
    }
    
    setMatchData(prev => {
      const newMatchData = { ...prev };
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
      
      // Trigger save after state update (include map switch since we moved to next map)
      setTimeout(() => saveMatchData(true), 100);
      
      return newMatchData;
    });
  };

  // Allow component to render when accessed via URL (isOpen will be undefined)
  if (isOpen === false) return null;

  // Show loading state when fetching match from URL
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-white text-xl mb-4">Loading Match...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show error state if no match found
  if (!currentMatch) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-red-400 text-xl mb-4">Match Not Found</div>
          <div className="text-gray-400 mb-4">Could not load match data</div>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Live Scoring Panel</h2>
            <button onClick={onClose || (() => window.close())} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-400 flex items-center gap-4">
            <span>Last Update: {lastUpdate}</span>
            <span>Status: {matchData.status}</span>
            <span className={`flex items-center gap-1 ${
              saveStatus === 'saving' ? 'text-yellow-400' :
              saveStatus === 'saved' ? 'text-green-400' :
              saveStatus === 'error' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {saveStatus === 'saving' && '⏳ Saving...'}
              {saveStatus === 'saved' && '✓ Saved'}
              {saveStatus === 'error' && '⚠ Save Failed'}
              {saveStatus === 'idle' && ''}
            </span>
          </div>
        </div>

        {/* Map Selector */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: matchData.totalMaps }, (_, i) => i + 1).map(mapNum => {
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
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setExpandedStats(!expandedStats)}
              className="flex items-center gap-2 text-white text-lg font-bold"
            >
              <ChevronDown className={`transform transition-transform ${expandedStats ? 'rotate-180' : ''}`} />
              Player Statistics - Map {matchData.currentMap}
            </button>
            {matchData.currentMap > 1 && (
              <button
                onClick={() => copyLineupFromPreviousMap()}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Copy Lineup from Map {matchData.currentMap - 1}
              </button>
            )}
          </div>

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
                          <optgroup label="Vanguard">
                            {HEROES.Vanguard.filter(h => h !== 'TBD').map(hero => (
                              <option key={hero} value={hero}>{hero}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Duelist">
                            {HEROES.Duelist.filter(h => h !== 'TBD').map(hero => (
                              <option key={hero} value={hero}>{hero}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Strategist">
                            {HEROES.Strategist.filter(h => h !== 'TBD').map(hero => (
                              <option key={hero} value={hero}>{hero}</option>
                            ))}
                          </optgroup>
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
                              onChange={(e) => {
                                const value = Math.max(0, parseInt(e.target.value) || 0);
                                updatePlayerStat(1, idx, stat.key, value);
                              }}
                              className="w-full bg-gray-600 text-white px-1 py-1 rounded text-sm text-center"
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e') {
                                  e.preventDefault();
                                }
                              }}
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
                          <optgroup label="Vanguard">
                            {HEROES.Vanguard.filter(h => h !== 'TBD').map(hero => (
                              <option key={hero} value={hero}>{hero}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Duelist">
                            {HEROES.Duelist.filter(h => h !== 'TBD').map(hero => (
                              <option key={hero} value={hero}>{hero}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Strategist">
                            {HEROES.Strategist.filter(h => h !== 'TBD').map(hero => (
                              <option key={hero} value={hero}>{hero}</option>
                            ))}
                          </optgroup>
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
                              onChange={(e) => {
                                const value = Math.max(0, parseInt(e.target.value) || 0);
                                updatePlayerStat(2, idx, stat.key, value);
                              }}
                              className="w-full bg-gray-600 text-white px-1 py-1 rounded text-sm text-center"
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e') {
                                  e.preventDefault();
                                }
                              }}
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