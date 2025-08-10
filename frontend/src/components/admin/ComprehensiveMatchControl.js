import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, Save, Play, Pause, SkipForward, Trophy, 
  Shield, RefreshCw, Activity, Users, Eye,
  AlertCircle, Check, Clock, Zap, Target,
  TrendingUp, Award, BarChart3, Settings,
  MessageSquare, Wifi, WifiOff, ChevronRight,
  ChevronLeft, RotateCcw, Camera, Mic, MicOff
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { getHeroImageSync, getHeroRole, getCountryFlag, TeamLogo, PlayerAvatar, getImageUrl } from '../../utils/imageUtils';
import { MARVEL_RIVALS_MAPS, MARVEL_RIVALS_HEROES } from '../../data/marvelRivalsComplete';

/**
 * COMPREHENSIVE MATCH CONTROL CENTER
 * Complete match management system for live esports events
 * Handles all aspects: players, stats, hero selections, map scores, and live updates
 */
const ComprehensiveMatchControl = ({ 
  isOpen, 
  onClose, 
  match,
  onUpdate 
}) => {
  const { token, api } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  
  // WebSocket connection for real-time updates
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // Core match state
  const [matchData, setMatchData] = useState({
    id: match?.id,
    status: match?.status || 'upcoming',
    format: match?.format || 'BO3',
    team1_score: match?.team1_score || 0,
    team2_score: match?.team2_score || 0,
    current_map: match?.current_map || 1,
    match_timer: '00:00',
    is_paused: false,
    viewers: match?.viewers || 0,
    stream_url: match?.stream_url || '',
    vod_url: match?.vod_url || ''
  });

  // Map management
  const [maps, setMaps] = useState([]);
  const [currentMapData, setCurrentMapData] = useState({
    map_number: 1,
    map_name: '',
    mode: '',
    team1_score: 0,
    team2_score: 0,
    team1_composition: [],
    team2_composition: [],
    status: 'upcoming',
    side_selection: 'team1', // which team chose side
    team1_side: 'attack', // attack/defense
    timer: '00:00',
    round_wins: { team1: [], team2: [] } // track individual round wins
  });

  // Player statistics tracking
  const [playerStats, setPlayerStats] = useState({
    team1: {},
    team2: {}
  });

  // Match events log
  const [matchEvents, setMatchEvents] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showEventLog, setShowEventLog] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Timer state
  const [timerInterval, setTimerInterval] = useState(null);
  const [matchStartTime, setMatchStartTime] = useState(null);

  // Initialize match data
  useEffect(() => {
    if (match && isOpen) {
      initializeMatchData();
      connectWebSocket();
    }
    
    return () => {
      disconnectWebSocket();
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [match, isOpen]);

  // Initialize match data from backend
  const initializeMatchData = () => {
    const totalMaps = parseInt(match.format?.replace('BO', '') || '3');
    
    // Initialize maps
    const initialMaps = [];
    for (let i = 0; i < totalMaps; i++) {
      const existingMap = match.maps_data?.[i];
      initialMaps.push({
        map_number: i + 1,
        map_name: existingMap?.map_name || '',
        mode: existingMap?.mode || '',
        team1_score: existingMap?.team1_score || 0,
        team2_score: existingMap?.team2_score || 0,
        team1_composition: existingMap?.team1_composition || [],
        team2_composition: existingMap?.team2_composition || [],
        status: existingMap?.status || (i === 0 ? 'upcoming' : 'not_played'),
        winner: existingMap?.winner || null,
        duration: existingMap?.duration || '00:00',
        vod_timestamp: existingMap?.vod_timestamp || null
      });
    }
    setMaps(initialMaps);
    
    // Set current map data
    if (match.current_map && initialMaps[match.current_map - 1]) {
      setCurrentMapData({
        ...initialMaps[match.current_map - 1],
        timer: '00:00'
      });
    }
    
    // Initialize player stats
    const team1Stats = {};
    const team2Stats = {};
    
    match.team1?.roster?.forEach(player => {
      team1Stats[player.id] = {
        player_id: player.id,
        player_name: player.username || player.name,
        total_eliminations: 0,
        total_deaths: 0,
        total_assists: 0,
        total_damage: 0,
        total_healing: 0,
        total_damage_blocked: 0,
        heroes_played: {},
        best_performance: null
      };
    });
    
    match.team2?.roster?.forEach(player => {
      team2Stats[player.id] = {
        player_id: player.id,
        player_name: player.username || player.name,
        total_eliminations: 0,
        total_deaths: 0,
        total_assists: 0,
        total_damage: 0,
        total_healing: 0,
        total_damage_blocked: 0,
        heroes_played: {},
        best_performance: null
      };
    });
    
    setPlayerStats({ team1: team1Stats, team2: team2Stats });
    
    // Add initial event
    addMatchEvent('Match Control Initialized', 'system');
  };

  // WebSocket connection for real-time updates
  const connectWebSocket = () => {
    try {
      const wsUrl = BACKEND_URL.replace('http://', 'ws://').replace('https://', 'wss://');
      wsRef.current = new WebSocket(`${wsUrl}/ws/match/${match.id}`);
      
      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        addMatchEvent('Live connection established', 'system');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        addMatchEvent('Live connection lost', 'system');
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'score_update':
        updateMapScore(data.team, data.score, false);
        break;
      case 'hero_change':
        updatePlayerHero(data.team, data.player_index, data.hero, false);
        break;
      case 'match_status':
        setMatchData(prev => ({ ...prev, status: data.status }));
        break;
      case 'viewer_count':
        setMatchData(prev => ({ ...prev, viewers: data.count }));
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Broadcast updates via WebSocket
  const broadcastUpdate = (type, data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  };

  // Add event to match log
  const addMatchEvent = (message, type = 'info') => {
    const event = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message,
      type // system, score, hero, stat, admin
    };
    setMatchEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
  };

  // Timer management
  const startTimer = () => {
    if (!timerInterval) {
      setMatchStartTime(Date.now());
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (matchStartTime || Date.now())) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        setMatchData(prev => ({ ...prev, match_timer: formatted }));
        setCurrentMapData(prev => ({ ...prev, timer: formatted }));
      }, 1000);
      setTimerInterval(interval);
      addMatchEvent('Match timer started', 'system');
    }
  };

  const pauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
      addMatchEvent('Match timer paused', 'system');
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setMatchData(prev => ({ ...prev, match_timer: '00:00' }));
    setCurrentMapData(prev => ({ ...prev, timer: '00:00' }));
    setMatchStartTime(null);
    addMatchEvent('Match timer reset', 'system');
  };

  // Score management
  const updateMapScore = (team, newScore, broadcast = true) => {
    const key = team === 1 ? 'team1_score' : 'team2_score';
    
    setCurrentMapData(prev => {
      const updated = { ...prev, [key]: newScore };
      
      // Update in maps array
      setMaps(prevMaps => {
        const newMaps = [...prevMaps];
        newMaps[matchData.current_map - 1] = {
          ...newMaps[matchData.current_map - 1],
          [key]: newScore
        };
        return newMaps;
      });
      
      return updated;
    });
    
    addMatchEvent(
      `${team === 1 ? match.team1?.name : match.team2?.name} scored - Map score: ${newScore}`,
      'score'
    );
    
    if (broadcast) {
      broadcastUpdate('score_update', { team, score: newScore });
    }
    
    // Auto-save if enabled
    if (autoSaveEnabled) {
      handleAutoSave();
    }
  };

  // Hero selection management
  const updatePlayerHero = (team, playerIndex, hero, broadcast = true) => {
    const compositionKey = team === 1 ? 'team1_composition' : 'team2_composition';
    const roster = team === 1 ? match.team1?.roster : match.team2?.roster;
    const player = roster?.[playerIndex];
    
    if (!player) return;
    
    setCurrentMapData(prev => {
      const newComposition = [...prev[compositionKey]];
      
      newComposition[playerIndex] = {
        player_id: player.id,
        player_name: player.username || player.name,
        hero: hero,
        role: getHeroRole(hero),
        country: player.country || player.nationality,
        flag: getCountryFlag(player.country || player.nationality),
        avatar: player.avatar,
        eliminations: newComposition[playerIndex]?.eliminations || 0,
        deaths: newComposition[playerIndex]?.deaths || 0,
        assists: newComposition[playerIndex]?.assists || 0,
        damage: newComposition[playerIndex]?.damage || 0,
        healing: newComposition[playerIndex]?.healing || 0,
        damage_blocked: newComposition[playerIndex]?.damage_blocked || 0
      };
      
      return { ...prev, [compositionKey]: newComposition };
    });
    
    // Update player stats
    const statsKey = team === 1 ? 'team1' : 'team2';
    setPlayerStats(prev => ({
      ...prev,
      [statsKey]: {
        ...prev[statsKey],
        [player.id]: {
          ...prev[statsKey][player.id],
          heroes_played: {
            ...prev[statsKey][player.id]?.heroes_played,
            [hero]: (prev[statsKey][player.id]?.heroes_played?.[hero] || 0) + 1
          }
        }
      }
    }));
    
    addMatchEvent(
      `${player.username || player.name} selected ${hero}`,
      'hero'
    );
    
    if (broadcast) {
      broadcastUpdate('hero_change', { team, player_index: playerIndex, hero });
    }
  };

  // Player statistics update
  const updatePlayerStat = (team, playerIndex, stat, value) => {
    const compositionKey = team === 1 ? 'team1_composition' : 'team2_composition';
    const roster = team === 1 ? match.team1?.roster : match.team2?.roster;
    const player = roster?.[playerIndex];
    
    if (!player) return;
    
    setCurrentMapData(prev => {
      const newComposition = [...prev[compositionKey]];
      
      if (!newComposition[playerIndex]) {
        newComposition[playerIndex] = {
          player_id: player.id,
          player_name: player.username || player.name,
          hero: '',
          role: 'Duelist'
        };
      }
      
      newComposition[playerIndex] = {
        ...newComposition[playerIndex],
        [stat]: parseInt(value) || 0
      };
      
      return { ...prev, [compositionKey]: newComposition };
    });
    
    // Update cumulative stats
    const statsKey = team === 1 ? 'team1' : 'team2';
    setPlayerStats(prev => ({
      ...prev,
      [statsKey]: {
        ...prev[statsKey],
        [player.id]: {
          ...prev[statsKey][player.id],
          [`total_${stat}`]: (prev[statsKey][player.id]?.[`total_${stat}`] || 0) + (parseInt(value) || 0)
        }
      }
    }));
    
    addMatchEvent(
      `${player.username || player.name} ${stat}: ${value}`,
      'stat'
    );
  };

  // Map transitions
  const transitionToNextMap = async () => {
    // Complete current map
    const currentMap = maps[matchData.current_map - 1];
    currentMap.status = 'completed';
    currentMap.winner = currentMapData.team1_score > currentMapData.team2_score ? 'team1' : 'team2';
    currentMap.duration = currentMapData.timer;
    
    // Update series score
    let team1SeriesScore = 0;
    let team2SeriesScore = 0;
    maps.forEach(map => {
      if (map.status === 'completed') {
        if (map.winner === 'team1') team1SeriesScore++;
        else if (map.winner === 'team2') team2SeriesScore++;
      }
    });
    
    setMatchData(prev => ({
      ...prev,
      team1_score: team1SeriesScore,
      team2_score: team2SeriesScore
    }));
    
    // Check if match is complete
    const mapsToWin = Math.ceil(maps.length / 2);
    if (team1SeriesScore >= mapsToWin || team2SeriesScore >= mapsToWin) {
      await completeMatch();
      return;
    }
    
    // Move to next map
    if (matchData.current_map < maps.length) {
      const nextMapIndex = matchData.current_map;
      setMatchData(prev => ({ ...prev, current_map: nextMapIndex + 1 }));
      
      // Reset for new map
      setCurrentMapData({
        ...maps[nextMapIndex],
        timer: '00:00',
        team1_score: 0,
        team2_score: 0,
        team1_composition: [],
        team2_composition: [],
        status: 'upcoming'
      });
      
      resetTimer();
      addMatchEvent(`Transitioning to Map ${nextMapIndex + 1}`, 'system');
      
      // Save transition
      await saveMatchData();
    }
  };

  // Complete match
  const completeMatch = async () => {
    setMatchData(prev => ({ ...prev, status: 'completed' }));
    
    // Determine winner
    const winner = matchData.team1_score > matchData.team2_score ? match.team1 : match.team2;
    
    addMatchEvent(`Match completed! Winner: ${winner.name}`, 'system');
    
    try {
      await api.post(`/admin/matches/${match.id}/complete`, {
        winner_id: winner.id,
        final_score: {
          team1: matchData.team1_score,
          team2: matchData.team2_score
        }
      });
      
      if (onUpdate) onUpdate();
      
      // Generate match report
      generateMatchReport();
    } catch (error) {
      console.error('Error completing match:', error);
    }
  };

  // Save match data
  const saveMatchData = async () => {
    setIsSaving(true);
    
    try {
      // Prepare data for save
      const saveData = {
        status: matchData.status,
        team1_score: matchData.team1_score,
        team2_score: matchData.team2_score,
        current_map: matchData.current_map,
        maps_data: maps.map((map, index) => ({
          ...map,
          ...(index === matchData.current_map - 1 ? currentMapData : {})
        })),
        match_timer: matchData.match_timer,
        viewers: matchData.viewers,
        player_stats: playerStats
      };
      
      await api.post(`/admin/matches/${match.id}/live-control`, {
        action: 'update_all',
        ...saveData
      });
      
      addMatchEvent('Match data saved', 'system');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving match data:', error);
      addMatchEvent('Failed to save match data', 'system');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save functionality
  const handleAutoSave = useCallback(() => {
    if (autoSaveEnabled && !isSaving) {
      // Simple debounce implementation
      setTimeout(() => {
        if (autoSaveEnabled && !isSaving) {
          saveMatchData();
        }
      }, 5000);
    }
  }, [autoSaveEnabled, isSaving]);

  // Generate match report
  const generateMatchReport = () => {
    const report = {
      match_id: match.id,
      teams: {
        team1: match.team1.name,
        team2: match.team2.name
      },
      final_score: {
        team1: matchData.team1_score,
        team2: matchData.team2_score
      },
      duration: matchData.match_timer,
      maps_played: maps.filter(m => m.status === 'completed'),
      player_performances: playerStats,
      events: matchEvents,
      generated_at: new Date().toISOString()
    };
    
    // Download report as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_${match.id}_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render functions for different tabs
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Match Status */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Match Status</h3>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            } animate-pulse`}></span>
            <span className="text-sm text-gray-400">
              {connectionStatus === 'connected' ? 'Live Connected' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{matchData.match_timer}</div>
            <div className="text-sm text-gray-400">Match Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {matchData.team1_score} - {matchData.team2_score}
            </div>
            <div className="text-sm text-gray-400">Series Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              Map {matchData.current_map}/{maps.length}
            </div>
            <div className="text-sm text-gray-400">Current Map</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {matchData.viewers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Viewers</div>
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="flex space-x-2 mt-4">
          {matchData.status === 'upcoming' && (
            <button
              onClick={() => {
                setMatchData(prev => ({ ...prev, status: 'live' }));
                startTimer();
                addMatchEvent('Match started', 'admin');
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Match
            </button>
          )}
          
          {matchData.status === 'live' && !matchData.is_paused && (
            <button
              onClick={() => {
                setMatchData(prev => ({ ...prev, is_paused: true }));
                pauseTimer();
                addMatchEvent('Match paused', 'admin');
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </button>
          )}
          
          {matchData.is_paused && (
            <button
              onClick={() => {
                setMatchData(prev => ({ ...prev, is_paused: false }));
                startTimer();
                addMatchEvent('Match resumed', 'admin');
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </button>
          )}
          
          <button
            onClick={saveMatchData}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          
          <button
            onClick={transitionToNextMap}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Next Map
          </button>
          
          <button
            onClick={completeMatch}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
          >
            <Trophy className="w-4 h-4 mr-2" />
            End Match
          </button>
        </div>
      </div>
      
      {/* Current Map Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Current Map: {currentMapData.map_name || 'Not Selected'}
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Team 1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TeamLogo team={match.team1} size="w-12 h-12" />
                <div>
                  <h4 className="text-lg font-bold text-white">{match.team1?.name}</h4>
                  <p className="text-sm text-gray-400">{currentMapData.team1_side || 'Side not set'}</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{currentMapData.team1_score}</div>
            </div>
            
            {/* Quick composition view */}
            <div className="flex space-x-2">
              {currentMapData.team1_composition.slice(0, 6).map((player, i) => (
                <div key={i} className="relative group">
                  {player.hero && getHeroImageSync(player.hero) ? (
                    <img 
                      src={getHeroImageSync(player.hero)}
                      alt={player.hero}
                      className="w-10 h-10 rounded-full"
                      title={`${player.player_name} - ${player.hero}`}
                      onError={(e) => {
                        e.target.src = getImageUrl(null, 'player-avatar');
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                      {i + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Team 2 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{currentMapData.team2_score}</div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <h4 className="text-lg font-bold text-white">{match.team2?.name}</h4>
                  <p className="text-sm text-gray-400">{currentMapData.team2_side || 'Side not set'}</p>
                </div>
                <TeamLogo team={match.team2} size="w-12 h-12" />
              </div>
            </div>
            
            {/* Quick composition view */}
            <div className="flex space-x-2 justify-end">
              {currentMapData.team2_composition.slice(0, 6).map((player, i) => (
                <div key={i} className="relative group">
                  {player.hero && getHeroImageSync(player.hero) ? (
                    <img 
                      src={getHeroImageSync(player.hero)}
                      alt={player.hero}
                      className="w-10 h-10 rounded-full"
                      title={`${player.player_name} - ${player.hero}`}
                      onError={(e) => {
                        e.target.src = getImageUrl(null, 'player-avatar');
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                      {i + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScoreTab = () => (
    <div className="space-y-6">
      {/* Map Selection */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Map Selection</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Map</label>
            <select
              value={currentMapData.map_name}
              onChange={(e) => setCurrentMapData(prev => ({ ...prev, map_name: e.target.value }))}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
            >
              <option value="">Select Map</option>
              {Object.values(MARVEL_RIVALS_MAPS).map(map => (
                <option key={map.id} value={map.name}>
                  {map.name} ({map.mode})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mode</label>
            <select
              value={currentMapData.mode}
              onChange={(e) => setCurrentMapData(prev => ({ ...prev, mode: e.target.value }))}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
            >
              <option value="">Select Mode</option>
              <option value="Convoy">Convoy</option>
              <option value="Domination">Domination</option>
              <option value="Convergence">Convergence</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {match.team1?.name} Side
            </label>
            <select
              value={currentMapData.team1_side}
              onChange={(e) => {
                setCurrentMapData(prev => ({ 
                  ...prev, 
                  team1_side: e.target.value,
                  team2_side: e.target.value === 'attack' ? 'defense' : 'attack'
                }));
              }}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
            >
              <option value="attack">Attack</option>
              <option value="defense">Defense</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Side Selection By
            </label>
            <select
              value={currentMapData.side_selection}
              onChange={(e) => setCurrentMapData(prev => ({ ...prev, side_selection: e.target.value }))}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
            >
              <option value="team1">{match.team1?.name}</option>
              <option value="team2">{match.team2?.name}</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Score Controls */}
      <div className="grid grid-cols-2 gap-6">
        {/* Team 1 Score */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <TeamLogo team={match.team1} size="w-12 h-12" />
              <h4 className="text-lg font-bold text-white">{match.team1?.name}</h4>
            </div>
            <div className="text-sm text-gray-400">{currentMapData.team1_side}</div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => updateMapScore(1, Math.max(0, currentMapData.team1_score - 1))}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-lg font-bold"
            >
              -
            </button>
            <div className="text-5xl font-bold text-white w-20 text-center">
              {currentMapData.team1_score}
            </div>
            <button
              onClick={() => updateMapScore(1, currentMapData.team1_score + 1)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg font-bold"
            >
              +
            </button>
          </div>
          
          {/* Round wins tracker */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-300">Round Wins</h5>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                    i < (currentMapData.round_wins?.team1?.length || 0)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Team 2 Score */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <TeamLogo team={match.team2} size="w-12 h-12" />
              <h4 className="text-lg font-bold text-white">{match.team2?.name}</h4>
            </div>
            <div className="text-sm text-gray-400">{currentMapData.team2_side}</div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => updateMapScore(2, Math.max(0, currentMapData.team2_score - 1))}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-lg font-bold"
            >
              -
            </button>
            <div className="text-5xl font-bold text-white w-20 text-center">
              {currentMapData.team2_score}
            </div>
            <button
              onClick={() => updateMapScore(2, currentMapData.team2_score + 1)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg font-bold"
            >
              +
            </button>
          </div>
          
          {/* Round wins tracker */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-300">Round Wins</h5>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                    i < (currentMapData.round_wins?.team2?.length || 0)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Swap scores
              const temp = currentMapData.team1_score;
              setCurrentMapData(prev => ({
                ...prev,
                team1_score: prev.team2_score,
                team2_score: temp
              }));
              addMatchEvent('Scores swapped', 'admin');
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Swap Scores
          </button>
          
          <button
            onClick={() => {
              setCurrentMapData(prev => ({
                ...prev,
                team1_score: 0,
                team2_score: 0,
                round_wins: { team1: [], team2: [] }
              }));
              addMatchEvent('Map scores reset', 'admin');
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Scores
          </button>
          
          <button
            onClick={() => {
              const winner = currentMapData.team1_score > currentMapData.team2_score ? 'team1' : 'team2';
              addMatchEvent(`Map winner: ${winner === 'team1' ? match.team1?.name : match.team2?.name}`, 'admin');
              transitionToNextMap();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            Complete Map
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompositionsTab = () => (
    <div className="grid grid-cols-2 gap-6">
      {/* Team 1 Composition */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <TeamLogo team={match.team1} size="w-10 h-10" />
          <h3 className="text-lg font-bold text-white">{match.team1?.name} Composition</h3>
        </div>
        
        <div className="space-y-3">
          {match.team1?.roster?.slice(0, 6).map((player, i) => (
            <div key={player.id} className="flex items-center space-x-3">
              <PlayerAvatar player={player} size="w-8 h-8" />
              
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {player.username || player.name}
                </div>
                <div className="text-xs text-gray-400">
                  {getCountryFlag(player.country || player.nationality)} {player.role || 'Player'}
                </div>
              </div>
              
              <select
                value={currentMapData.team1_composition[i]?.hero || ''}
                onChange={(e) => updatePlayerHero(1, i, e.target.value)}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                <option value="">Select Hero</option>
                {Object.values(MARVEL_RIVALS_HEROES).map(hero => (
                  <option key={hero.id} value={hero.name}>
                    {hero.name} ({hero.role})
                  </option>
                ))}
              </select>
              
              {currentMapData.team1_composition[i]?.hero && (
                <div className="w-10 h-10 flex-shrink-0">
                  {getHeroImageSync(currentMapData.team1_composition[i].hero) ? (
                    <img 
                      src={getHeroImageSync(currentMapData.team1_composition[i].hero)}
                      alt={currentMapData.team1_composition[i].hero}
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center text-xs">
                      {currentMapData.team1_composition[i].hero.substring(0, 3)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Role composition summary */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Role Composition</h4>
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1 text-blue-400" />
              <span className="text-gray-300">
                {currentMapData.team1_composition.filter(p => getHeroRole(p.hero) === 'Vanguard').length} Vanguard
              </span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-1 text-red-400" />
              <span className="text-gray-300">
                {currentMapData.team1_composition.filter(p => getHeroRole(p.hero) === 'Duelist').length} Duelist
              </span>
            </div>
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-1 text-green-400" />
              <span className="text-gray-300">
                {currentMapData.team1_composition.filter(p => getHeroRole(p.hero) === 'Strategist').length} Strategist
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Team 2 Composition */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <TeamLogo team={match.team2} size="w-10 h-10" />
          <h3 className="text-lg font-bold text-white">{match.team2?.name} Composition</h3>
        </div>
        
        <div className="space-y-3">
          {match.team2?.roster?.slice(0, 6).map((player, i) => (
            <div key={player.id} className="flex items-center space-x-3">
              <PlayerAvatar player={player} size="w-8 h-8" />
              
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {player.username || player.name}
                </div>
                <div className="text-xs text-gray-400">
                  {getCountryFlag(player.country || player.nationality)} {player.role || 'Player'}
                </div>
              </div>
              
              <select
                value={currentMapData.team2_composition[i]?.hero || ''}
                onChange={(e) => updatePlayerHero(2, i, e.target.value)}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                <option value="">Select Hero</option>
                {Object.values(MARVEL_RIVALS_HEROES).map(hero => (
                  <option key={hero.id} value={hero.name}>
                    {hero.name} ({hero.role})
                  </option>
                ))}
              </select>
              
              {currentMapData.team2_composition[i]?.hero && (
                <div className="w-10 h-10 flex-shrink-0">
                  {getHeroImageSync(currentMapData.team2_composition[i].hero) ? (
                    <img 
                      src={getHeroImageSync(currentMapData.team2_composition[i].hero)}
                      alt={currentMapData.team2_composition[i].hero}
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center text-xs">
                      {currentMapData.team2_composition[i].hero.substring(0, 3)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Role composition summary */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Role Composition</h4>
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1 text-blue-400" />
              <span className="text-gray-300">
                {currentMapData.team2_composition.filter(p => getHeroRole(p.hero) === 'Vanguard').length} Vanguard
              </span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-1 text-red-400" />
              <span className="text-gray-300">
                {currentMapData.team2_composition.filter(p => getHeroRole(p.hero) === 'Duelist').length} Duelist
              </span>
            </div>
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-1 text-green-400" />
              <span className="text-gray-300">
                {currentMapData.team2_composition.filter(p => getHeroRole(p.hero) === 'Strategist').length} Strategist
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Player Statistics - Map {matchData.current_map}</h3>
        
        {/* Stats Input Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Team 1 Stats */}
          <div>
            <h4 className="text-md font-bold text-white mb-3 flex items-center">
              <TeamLogo team={match.team1} size="w-6 h-6" className="mr-2" />
              {match.team1?.name}
            </h4>
            
            <div className="space-y-3">
              {match.team1?.roster?.slice(0, 6).map((player, i) => (
                <div key={player.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <PlayerAvatar player={player} size="w-6 h-6" />
                      <span className="text-sm font-medium text-white">
                        {player.username || player.name}
                      </span>
                    </div>
                    {currentMapData.team1_composition[i]?.hero && (
                      <span className="text-xs text-gray-400">
                        {currentMapData.team1_composition[i].hero}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-6 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">E</label>
                      <input
                        type="number"
                        min="0"
                        value={currentMapData.team1_composition[i]?.eliminations || 0}
                        onChange={(e) => updatePlayerStat(1, i, 'eliminations', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">D</label>
                      <input
                        type="number"
                        min="0"
                        value={currentMapData.team1_composition[i]?.deaths || 0}
                        onChange={(e) => updatePlayerStat(1, i, 'deaths', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">A</label>
                      <input
                        type="number"
                        min="0"
                        value={currentMapData.team1_composition[i]?.assists || 0}
                        onChange={(e) => updatePlayerStat(1, i, 'assists', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">DMG</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={currentMapData.team1_composition[i]?.damage || 0}
                        onChange={(e) => updatePlayerStat(1, i, 'damage', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">HEAL</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={currentMapData.team1_composition[i]?.healing || 0}
                        onChange={(e) => updatePlayerStat(1, i, 'healing', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">BLK</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={currentMapData.team1_composition[i]?.damage_blocked || 0}
                        onChange={(e) => updatePlayerStat(1, i, 'damage_blocked', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* K/D Ratio */}
                  <div className="mt-2 text-xs text-gray-400">
                    K/D: {currentMapData.team1_composition[i]?.deaths > 0 
                      ? (currentMapData.team1_composition[i]?.eliminations / currentMapData.team1_composition[i]?.deaths).toFixed(2)
                      : currentMapData.team1_composition[i]?.eliminations || 0}
                    {currentMapData.team1_composition[i]?.eliminations >= 10 && 
                     currentMapData.team1_composition[i]?.deaths === 0 && (
                      <span className="ml-2 text-green-400">Perfect!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Team 2 Stats */}
          <div>
            <h4 className="text-md font-bold text-white mb-3 flex items-center">
              <TeamLogo team={match.team2} size="w-6 h-6" className="mr-2" />
              {match.team2?.name}
            </h4>
            
            <div className="space-y-3">
              {match.team2?.roster?.slice(0, 6).map((player, i) => (
                <div key={player.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <PlayerAvatar player={player} size="w-6 h-6" />
                      <span className="text-sm font-medium text-white">
                        {player.username || player.name}
                      </span>
                    </div>
                    {currentMapData.team2_composition[i]?.hero && (
                      <span className="text-xs text-gray-400">
                        {currentMapData.team2_composition[i].hero}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-6 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">E</label>
                      <input
                        type="number"
                        min="0"
                        value={currentMapData.team2_composition[i]?.eliminations || 0}
                        onChange={(e) => updatePlayerStat(2, i, 'eliminations', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">D</label>
                      <input
                        type="number"
                        min="0"
                        value={currentMapData.team2_composition[i]?.deaths || 0}
                        onChange={(e) => updatePlayerStat(2, i, 'deaths', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">A</label>
                      <input
                        type="number"
                        min="0"
                        value={currentMapData.team2_composition[i]?.assists || 0}
                        onChange={(e) => updatePlayerStat(2, i, 'assists', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">DMG</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={currentMapData.team2_composition[i]?.damage || 0}
                        onChange={(e) => updatePlayerStat(2, i, 'damage', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">HEAL</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={currentMapData.team2_composition[i]?.healing || 0}
                        onChange={(e) => updatePlayerStat(2, i, 'healing', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">BLK</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={currentMapData.team2_composition[i]?.damage_blocked || 0}
                        onChange={(e) => updatePlayerStat(2, i, 'damage_blocked', e.target.value)}
                        className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* K/D Ratio */}
                  <div className="mt-2 text-xs text-gray-400">
                    K/D: {currentMapData.team2_composition[i]?.deaths > 0 
                      ? (currentMapData.team2_composition[i]?.eliminations / currentMapData.team2_composition[i]?.deaths).toFixed(2)
                      : currentMapData.team2_composition[i]?.eliminations || 0}
                    {currentMapData.team2_composition[i]?.eliminations >= 10 && 
                     currentMapData.team2_composition[i]?.deaths === 0 && (
                      <span className="ml-2 text-green-400">Perfect!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Match MVP Candidates */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">MVP Candidates</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Most Eliminations */}
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <div className="text-sm text-gray-400 mb-1">Most Eliminations</div>
            {(() => {
              let topPlayer = null;
              let maxElims = 0;
              
              [...currentMapData.team1_composition, ...currentMapData.team2_composition].forEach(player => {
                if (player && player.eliminations > maxElims) {
                  maxElims = player.eliminations;
                  topPlayer = player;
                }
              });
              
              return topPlayer ? (
                <>
                  <div className="text-lg font-bold text-white">{topPlayer.player_name}</div>
                  <div className="text-2xl font-bold text-red-400">{maxElims}</div>
                </>
              ) : (
                <div className="text-gray-500">No data</div>
              );
            })()}
          </div>
          
          {/* Most Healing */}
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-sm text-gray-400 mb-1">Most Healing</div>
            {(() => {
              let topPlayer = null;
              let maxHealing = 0;
              
              [...currentMapData.team1_composition, ...currentMapData.team2_composition].forEach(player => {
                if (player && player.healing > maxHealing) {
                  maxHealing = player.healing;
                  topPlayer = player;
                }
              });
              
              return topPlayer && maxHealing > 0 ? (
                <>
                  <div className="text-lg font-bold text-white">{topPlayer.player_name}</div>
                  <div className="text-2xl font-bold text-green-400">{maxHealing.toLocaleString()}</div>
                </>
              ) : (
                <div className="text-gray-500">No data</div>
              );
            })()}
          </div>
          
          {/* Most Damage */}
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-sm text-gray-400 mb-1">Most Damage</div>
            {(() => {
              let topPlayer = null;
              let maxDamage = 0;
              
              [...currentMapData.team1_composition, ...currentMapData.team2_composition].forEach(player => {
                if (player && player.damage > maxDamage) {
                  maxDamage = player.damage;
                  topPlayer = player;
                }
              });
              
              return topPlayer && maxDamage > 0 ? (
                <>
                  <div className="text-lg font-bold text-white">{topPlayer.player_name}</div>
                  <div className="text-2xl font-bold text-purple-400">{maxDamage.toLocaleString()}</div>
                </>
              ) : (
                <div className="text-gray-500">No data</div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Stream Settings */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Stream Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stream URL</label>
            <input
              type="text"
              value={matchData.stream_url}
              onChange={(e) => setMatchData(prev => ({ ...prev, stream_url: e.target.value }))}
              placeholder="https://twitch.tv/channel"
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">VOD URL</label>
            <input
              type="text"
              value={matchData.vod_url}
              onChange={(e) => setMatchData(prev => ({ ...prev, vod_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Auto-save Changes</span>
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                autoSaveEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Show Event Log</span>
            <button
              onClick={() => setShowEventLog(!showEventLog)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                showEventLog ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  showEventLog ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Match Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Match Actions</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset this match? All data will be lost.')) {
                // Reset everything
                initializeMatchData();
                resetTimer();
                addMatchEvent('Match reset by admin', 'admin');
              }
            }}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Reset Match
          </button>
          
          <button
            onClick={generateMatchReport}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Match Report
          </button>
          
          <button
            onClick={() => {
              const csvData = generateCSVExport();
              const blob = new Blob([csvData], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `match_${match.id}_stats_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Export Stats (CSV)
          </button>
        </div>
      </div>
      
      {/* Debug Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Debug Information</h3>
        
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-400">Match ID:</span>
            <span className="text-white">{match.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">WebSocket Status:</span>
            <span className={`${
              connectionStatus === 'connected' ? 'text-green-400' : 
              connectionStatus === 'error' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {connectionStatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Backend URL:</span>
            <span className="text-white">{BACKEND_URL}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Events Logged:</span>
            <span className="text-white">{matchEvents.length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const generateCSVExport = () => {
    const headers = ['Player', 'Team', 'Hero', 'Eliminations', 'Deaths', 'Assists', 'Damage', 'Healing', 'Damage Blocked', 'K/D'];
    const rows = [];
    
    // Team 1 players
    currentMapData.team1_composition.forEach((player, i) => {
      if (player && player.player_name) {
        rows.push([
          player.player_name,
          match.team1.name,
          player.hero || 'N/A',
          player.eliminations || 0,
          player.deaths || 0,
          player.assists || 0,
          player.damage || 0,
          player.healing || 0,
          player.damage_blocked || 0,
          player.deaths > 0 ? (player.eliminations / player.deaths).toFixed(2) : player.eliminations || 0
        ]);
      }
    });
    
    // Team 2 players
    currentMapData.team2_composition.forEach((player, i) => {
      if (player && player.player_name) {
        rows.push([
          player.player_name,
          match.team2.name,
          player.hero || 'N/A',
          player.eliminations || 0,
          player.deaths || 0,
          player.assists || 0,
          player.damage || 0,
          player.healing || 0,
          player.damage_blocked || 0,
          player.deaths > 0 ? (player.eliminations / player.deaths).toFixed(2) : player.eliminations || 0
        ]);
      }
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h2 className="text-2xl font-bold text-white">
                Comprehensive Match Control Center
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-400">
                  {match.event?.name || 'No Event'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">
                  {match.team1?.name} vs {match.team2?.name}
                </span>
                <span className="text-gray-400">•</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  matchData.status === 'live' ? 'bg-red-600 text-white' :
                  matchData.status === 'upcoming' ? 'bg-blue-600 text-white' :
                  matchData.status === 'completed' ? 'bg-green-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {matchData.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'score', label: 'Score Control', icon: Target },
              { id: 'compositions', label: 'Compositions', icon: Users },
              { id: 'stats', label: 'Player Stats', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'score' && renderScoreTab()}
            {activeTab === 'compositions' && renderCompositionsTab()}
            {activeTab === 'stats' && renderStatsTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
          
          {/* Event Log Sidebar */}
          {showEventLog && (
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Event Log
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {matchEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-sm p-2 rounded ${
                        event.type === 'system' ? 'bg-gray-700 text-gray-300' :
                        event.type === 'score' ? 'bg-blue-900/30 text-blue-300' :
                        event.type === 'hero' ? 'bg-purple-900/30 text-purple-300' :
                        event.type === 'stat' ? 'bg-green-900/30 text-green-300' :
                        event.type === 'admin' ? 'bg-red-900/30 text-red-300' :
                        'bg-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      <div>{event.message}</div>
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


export default ComprehensiveMatchControl;