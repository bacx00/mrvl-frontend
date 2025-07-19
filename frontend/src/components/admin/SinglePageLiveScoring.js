import React, { useState, useEffect } from 'react';
import { X, Save, Play, Pause, Trophy, Clock, Users, ChevronLeft, ChevronRight, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks';
import { getCountryFlag } from '../../utils/imageUtils';
import HeroImage from '../shared/HeroImage';
import { 
  HEROES,
  MARVEL_RIVALS_MAPS
} from '../../constants/marvelRivalsData';

// Flatten heroes array for dropdown
const ALL_HEROES = Object.values(HEROES).flat().filter(hero => hero !== 'TBD');

const SinglePageLiveScoring = ({ 
  isOpen, 
  onClose, 
  match,
  onUpdate 
}) => {
  const { token } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';

  // Core match state
  const [matchStats, setMatchStats] = useState({
    matchId: match?.id,
    team1Score: 0,
    team2Score: 0,
    currentMapIndex: 0,
    totalMaps: 3,
    status: 'live',
    maps: []
  });

  const [currentMapData, setCurrentMapData] = useState({
    name: '',
    mode: '',
    team1Score: 0,
    team2Score: 0,
    status: 'ongoing'
  });

  const [matchTimer, setMatchTimer] = useState('00:00');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Player stats for both teams (6v6)
  const [playerStats, setPlayerStats] = useState({
    team1: Array(6).fill(null).map((_, i) => ({
      playerId: null,
      name: `Player ${i + 1}`,
      hero: '',
      country: '',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damageBlocked: 0
    })),
    team2: Array(6).fill(null).map((_, i) => ({
      playerId: null,
      name: `Player ${i + 1}`,
      hero: '',
      country: '',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damageBlocked: 0
    }))
  });

  // Initialize match data
  useEffect(() => {
    if (match && isOpen) {
      initializeMatchData();
    }
  }, [match, isOpen]);

  const initializeMatchData = () => {
    const format = match.format || 'BO3';
    const totalMaps = parseInt(format.replace('BO', ''));
    
    setMatchStats({
      matchId: match.id,
      team1Score: match.team1_score || 0,
      team2Score: match.team2_score || 0,
      currentMapIndex: (match.current_map || 1) - 1,
      totalMaps: totalMaps,
      status: match.status || 'live',
      maps: initializeMaps(match.maps_data || [], totalMaps)
    });

    // Set current map data
    const currentMap = match.maps_data?.[match.current_map - 1] || {};
    setCurrentMapData({
      name: currentMap.name || 'Map ' + (match.current_map || 1),
      mode: currentMap.mode || 'Domination',
      team1Score: currentMap.team1_score || 0,
      team2Score: currentMap.team2_score || 0,
      status: currentMap.status || 'ongoing'
    });

    // Initialize player stats from match data
    if (match.player_stats) {
      initializePlayerStats(match.player_stats);
    } else {
      initializeDefaultPlayerStats();
    }
  };

  const initializeMaps = (existingMaps, totalMaps) => {
    const maps = [];
    const defaultMaps = Object.values(MARVEL_RIVALS_MAPS);
    
    for (let i = 0; i < totalMaps; i++) {
      if (existingMaps[i]) {
        maps.push({
          ...existingMaps[i],
          mapNumber: i + 1
        });
      } else {
        const randomMap = defaultMaps[Math.floor(Math.random() * defaultMaps.length)];
        maps.push({
          mapNumber: i + 1,
          name: randomMap.name,
          mode: randomMap.mode,
          team1Score: 0,
          team2Score: 0,
          status: i === 0 ? 'ongoing' : 'upcoming'
        });
      }
    }
    return maps;
  };

  const initializePlayerStats = (statsData) => {
    const team1Players = [];
    const team2Players = [];

    // Extract players from match teams
    if (match.team1?.players) {
      match.team1.players.forEach((player, index) => {
        if (index < 6) {
          team1Players.push({
            playerId: player.id,
            name: player.name || player.username || `Player ${index + 1}`,
            hero: player.hero || '',
            country: player.country || player.nationality || '',
            eliminations: statsData[player.id]?.eliminations || 0,
            deaths: statsData[player.id]?.deaths || 0,
            assists: statsData[player.id]?.assists || 0,
            damage: statsData[player.id]?.damage || 0,
            healing: statsData[player.id]?.healing || 0,
            damageBlocked: statsData[player.id]?.damage_blocked || 0
          });
        }
      });
    }

    if (match.team2?.players) {
      match.team2.players.forEach((player, index) => {
        if (index < 6) {
          team2Players.push({
            playerId: player.id,
            name: player.name || player.username || `Player ${index + 1}`,
            hero: player.hero || '',
            country: player.country || player.nationality || '',
            eliminations: statsData[player.id]?.eliminations || 0,
            deaths: statsData[player.id]?.deaths || 0,
            assists: statsData[player.id]?.assists || 0,
            damage: statsData[player.id]?.damage || 0,
            healing: statsData[player.id]?.healing || 0,
            damageBlocked: statsData[player.id]?.damage_blocked || 0
          });
        }
      });
    }

    // Fill remaining slots with default players
    while (team1Players.length < 6) {
      team1Players.push({
        playerId: null,
        name: `Player ${team1Players.length + 1}`,
        hero: '',
        country: '',
        eliminations: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        healing: 0,
        damageBlocked: 0
      });
    }

    while (team2Players.length < 6) {
      team2Players.push({
        playerId: null,
        name: `Player ${team2Players.length + 1}`,
        hero: '',
        country: '',
        eliminations: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        healing: 0,
        damageBlocked: 0
      });
    }

    setPlayerStats({
      team1: team1Players,
      team2: team2Players
    });
  };

  const initializeDefaultPlayerStats = () => {
    // Use default player structure if no match data available
    const team1Players = Array(6).fill(null).map((_, i) => ({
      playerId: null,
      name: `${match?.team1?.name || 'Team 1'} Player ${i + 1}`,
      hero: '',
      country: '',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damageBlocked: 0
    }));

    const team2Players = Array(6).fill(null).map((_, i) => ({
      playerId: null,
      name: `${match?.team2?.name || 'Team 2'} Player ${i + 1}`,
      hero: '',
      country: '',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damageBlocked: 0
    }));

    setPlayerStats({
      team1: team1Players,
      team2: team2Players
    });
  };

  // Timer functions with auto-save
  useEffect(() => {
    let interval;
    let saveInterval;
    
    if (isTimerRunning) {
      // Update timer every second
      interval = setInterval(() => {
        setMatchTimer(prevTimer => {
          const [mins, secs] = prevTimer.split(':').map(Number);
          const totalSecs = mins * 60 + secs + 1;
          const newMins = Math.floor(totalSecs / 60);
          const newSecs = totalSecs % 60;
          return `${String(newMins).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`;
        });
      }, 1000);
      
      // Save timer to backend every 5 seconds
      saveInterval = setInterval(() => {
        saveTimerToBackend();
      }, 5000);
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(saveInterval);
    };
  }, [isTimerRunning]);
  
  // Save timer to backend
  const saveTimerToBackend = async () => {
    try {
      const payload = {
        timer: matchTimer,
        status: matchStats.status
      };
      
      await fetch(`${BACKEND_URL}/admin/matches/${match.id}/live-scoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error auto-saving timer:', error);
    }
  };

  // Update player stat
  const updatePlayerStat = (team, playerIndex, statType, value) => {
    setPlayerStats(prev => ({
      ...prev,
      [team]: prev[team].map((player, index) => 
        index === playerIndex 
          ? { ...player, [statType]: Math.max(0, parseInt(value) || 0) }
          : player
      )
    }));
  };

  // Update player hero
  const updatePlayerHero = (team, playerIndex, hero) => {
    setPlayerStats(prev => ({
      ...prev,
      [team]: prev[team].map((player, index) => 
        index === playerIndex 
          ? { ...player, hero: hero }
          : player
      )
    }));
  };

  // Update map score
  const updateMapScore = (team, increment) => {
    const teamKey = team === 1 ? 'team1Score' : 'team2Score';
    setCurrentMapData(prev => ({
      ...prev,
      [teamKey]: Math.max(0, prev[teamKey] + increment)
    }));
  };

  // Navigate between maps
  const navigateToMap = (mapIndex) => {
    if (mapIndex < 0 || mapIndex >= matchStats.totalMaps) return;
    
    // Save current map data before switching
    const updatedMaps = [...matchStats.maps];
    updatedMaps[matchStats.currentMapIndex] = {
      ...updatedMaps[matchStats.currentMapIndex],
      ...currentMapData
    };
    
    setMatchStats(prev => ({
      ...prev,
      currentMapIndex: mapIndex,
      maps: updatedMaps
    }));
    
    // Load new map data
    const newMap = updatedMaps[mapIndex];
    setCurrentMapData({
      name: newMap.name || `Map ${mapIndex + 1}`,
      mode: newMap.mode || 'Domination',
      team1Score: newMap.team1Score || 0,
      team2Score: newMap.team2Score || 0,
      status: newMap.status || 'upcoming'
    });
  };

  // Control match actions
  const controlMatch = async (action) => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/matches/${match.id}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Match ${action} successfully`);
        
        if (action === 'start' || action === 'resume') {
          setIsTimerRunning(true);
          setMatchStats(prev => ({ ...prev, status: 'live' }));
          // Immediately save the match state when starting
          setTimeout(() => saveMatchData(), 100);
        } else if (action === 'pause') {
          setIsTimerRunning(false);
          setMatchStats(prev => ({ ...prev, status: 'paused' }));
          // Save current state when pausing
          setTimeout(() => saveMatchData(), 100);
        } else if (action === 'complete') {
          setIsTimerRunning(false);
          setMatchStats(prev => ({ ...prev, status: 'completed' }));
          // Save final state
          setTimeout(() => saveMatchData(), 100);
        } else if (action === 'restart') {
          setMatchTimer('00:00');
          setIsTimerRunning(false);
          initializeMatchData();
        }
      }
    } catch (error) {
      console.error(`❌ Error ${action} match:`, error);
    }
  };

  // Save all data to backend
  const saveMatchData = async () => {
    setIsSaving(true);
    try {
      const payload = {
        matchId: matchStats.matchId,
        timer: matchTimer,
        status: matchStats.status,
        current_map: matchStats.currentMapIndex + 1,
        current_map_data: currentMapData,
        player_stats: playerStats,
        series_score: {
          team1: matchStats.team1Score,
          team2: matchStats.team2Score
        }
      };

      const response = await fetch(`${BACKEND_URL}/admin/matches/${matchStats.matchId}/live-scoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Match data saved successfully');
        if (onUpdate) {
          onUpdate(payload);
        }
      } else {
        console.error('❌ Failed to save match data:', response.status);
      }
    } catch (error) {
      console.error('❌ Error saving match data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate K/D ratio
  const getKDRatio = (eliminations, deaths) => {
    if (deaths === 0) return eliminations > 0 ? '∞' : '0.00';
    return (eliminations / deaths).toFixed(2);
  };


  // Render player row
  const renderPlayerRow = (player, team, index) => {
    const flag = getCountryFlag(player.country);
    const kdRatio = getKDRatio(player.eliminations, player.deaths);

    return (
      <tr key={`${team}-${index}`} className="border-b border-gray-200 dark:border-gray-700">
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{flag}</span>
            <span className="font-medium text-sm">{player.name}</span>
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <HeroImage 
              heroName={player.hero}
              size="sm"
              showRole={false}
            />
            <select
              value={player.hero}
              onChange={(e) => updatePlayerHero(team, index, e.target.value)}
              className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select Hero</option>
              {ALL_HEROES.map(hero => (
                <option key={hero} value={hero}>{hero}</option>
              ))}
            </select>
          </div>
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.eliminations}
            onChange={(e) => updatePlayerStat(team, index, 'eliminations', e.target.value)}
            className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.deaths}
            onChange={(e) => updatePlayerStat(team, index, 'deaths', e.target.value)}
            className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.assists}
            onChange={(e) => updatePlayerStat(team, index, 'assists', e.target.value)}
            className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2 text-xs font-medium text-center">
          {kdRatio}
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.damage}
            onChange={(e) => updatePlayerStat(team, index, 'damage', e.target.value)}
            className="w-16 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.healing}
            onChange={(e) => updatePlayerStat(team, index, 'healing', e.target.value)}
            className="w-16 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.damageBlocked}
            onChange={(e) => updatePlayerStat(team, index, 'damageBlocked', e.target.value)}
            className="w-16 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
      </tr>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Live Scoring
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{matchTimer}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-1 rounded ${
                  isTimerRunning 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                    : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={saveMatchData}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Navigation */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToMap(matchStats.currentMapIndex - 1)}
                disabled={matchStats.currentMapIndex === 0}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: matchStats.totalMaps }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => navigateToMap(i)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      i === matchStats.currentMapIndex
                        ? 'bg-blue-600 text-white'
                        : matchStats.maps[i]?.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Map {i + 1}
                    {matchStats.maps[i]?.status === 'completed' && (
                      <CheckCircle className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => navigateToMap(matchStats.currentMapIndex + 1)}
                disabled={matchStats.currentMapIndex === matchStats.totalMaps - 1}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => controlMatch('start')}
                disabled={matchStats.status === 'live'}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
              <button
                onClick={() => controlMatch('pause')}
                disabled={matchStats.status !== 'live'}
                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={() => controlMatch('complete')}
                disabled={matchStats.status === 'completed'}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </button>
              <button
                onClick={() => controlMatch('restart')}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Restart
              </button>
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {match?.team1?.name || 'Team 1'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => updateMapScore(1, -1)}
                    className="w-6 h-6 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 min-w-[2rem] text-center">
                    {currentMapData.team1Score}
                  </span>
                  <button
                    onClick={() => updateMapScore(1, 1)}
                    className="w-6 h-6 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="text-sm font-medium">{currentMapData.name}</div>
                <div className="text-xs">{currentMapData.mode}</div>
                <div className="text-xs mt-1">
                  Map {matchStats.currentMapIndex + 1} of {matchStats.totalMaps}
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {match?.team2?.name || 'Team 2'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => updateMapScore(2, -1)}
                    className="w-6 h-6 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400 min-w-[2rem] text-center">
                    {currentMapData.team2Score}
                  </span>
                  <button
                    onClick={() => updateMapScore(2, 1)}
                    className="w-6 h-6 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Series Score</div>
              <div className="text-lg font-bold">
                <span className="text-blue-600 dark:text-blue-400">{matchStats.team1Score}</span>
                {' - '}
                <span className="text-red-600 dark:text-red-400">{matchStats.team2Score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-6">
            {/* Team 1 */}
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {match?.team1?.name || 'Team 1'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Player</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Hero</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">E</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">D</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">A</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">K/D</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">DMG</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">HEAL</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">BLK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.team1.map((player, index) => 
                      renderPlayerRow(player, 'team1', index)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team 2 */}
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {match?.team2?.name || 'Team 2'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Player</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Hero</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">E</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">D</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">A</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">K/D</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">DMG</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">HEAL</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">BLK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.team2.map((player, index) => 
                      renderPlayerRow(player, 'team2', index)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePageLiveScoring;