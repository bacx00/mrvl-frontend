import React, { useState, useEffect } from 'react';
import { X, Save, Play, Pause, SkipForward, Trophy } from 'lucide-react';
import { useAuth } from '../../hooks';
import { getHeroImageSync, getHeroRole } from '../../utils/imageUtils';
import { 
  HEROES,
  GAME_MODES
} from '../../constants/marvelRivalsData';
import { MARVEL_RIVALS_MAPS, MARVEL_RIVALS_HEROES } from '../../data/marvelRivalsComplete';

const SimplifiedLiveScoring = ({ 
  isOpen, 
  onClose, 
  match,
  onUpdate 
}) => {
  const { token } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

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
    team1Score: 0,
    team2Score: 0,
    team1Composition: [],
    team2Composition: [],
    status: 'ongoing'
  });

  const [matchTimer, setMatchTimer] = useState('00:00');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize match data
  useEffect(() => {
    if (match && isOpen) {
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
        team1Score: currentMap.team1_score || 0,
        team2Score: currentMap.team2_score || 0,
        team1Composition: currentMap.team1_composition || [],
        team2Composition: currentMap.team2_composition || [],
        status: currentMap.status || 'ongoing'
      });
    }
  }, [match, isOpen]);

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
          mapName: randomMap.name,
          mode: randomMap.mode,
          team1Score: 0,
          team2Score: 0,
          status: i === 0 ? 'upcoming' : 'not_played',
          team1Composition: [],
          team2Composition: []
        });
      }
    }
    return maps;
  };

  // Timer functions
  useEffect(() => {
    let interval;
    if (isTimerRunning && !isPaused) {
      interval = setInterval(() => {
        setMatchTimer(prev => {
          const [mins, secs] = prev.split(':').map(Number);
          const totalSecs = mins * 60 + secs + 1;
          const newMins = Math.floor(totalSecs / 60);
          const newSecs = totalSecs % 60;
          return `${String(newMins).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isPaused]);

  // Map score update
  const updateMapScore = (team, increment) => {
    const key = team === 1 ? 'team1Score' : 'team2Score';
    const newScore = Math.max(0, currentMapData[key] + (increment ? 1 : -1));
    
    setCurrentMapData(prev => ({
      ...prev,
      [key]: newScore
    }));

    // Update in main stats
    setMatchStats(prev => {
      const newMaps = [...prev.maps];
      newMaps[prev.currentMapIndex] = {
        ...newMaps[prev.currentMapIndex],
        [key]: newScore
      };
      return { ...prev, maps: newMaps };
    });
  };

  // Hero update for player
  const updatePlayerHero = (team, playerIndex, hero) => {
    const compositionKey = team === 1 ? 'team1Composition' : 'team2Composition';
    const roster = team === 1 ? match.team1?.roster : match.team2?.roster;
    const player = roster?.[playerIndex];
    
    setCurrentMapData(prev => {
      const newComposition = [...prev[compositionKey]];
      
      // Create or update the player composition
      newComposition[playerIndex] = {
        ...newComposition[playerIndex],
        player_id: player?.id || playerIndex,
        player_name: player?.username || player?.name || `Player ${playerIndex + 1}`,
        name: player?.username || player?.name || `Player ${playerIndex + 1}`,
        username: player?.username,
        hero: hero,
        role: getHeroRole(hero),
        country: player?.country || player?.nationality || 'US',
        nationality: player?.country || player?.nationality || 'US',
        country_flag: player?.country_flag || player?.flag,
        flag: player?.country_flag || player?.flag,
        avatar: player?.avatar
      };
      
      return { ...prev, [compositionKey]: newComposition };
    });
  };

  // Update player stats
  const updatePlayerStat = (team, playerIndex, stat, value) => {
    const compositionKey = team === 1 ? 'team1Composition' : 'team2Composition';
    const roster = team === 1 ? match.team1?.roster : match.team2?.roster;
    const player = roster?.[playerIndex];
    
    setCurrentMapData(prev => {
      const newComposition = [...prev[compositionKey]];
      
      // Create or update the player composition
      if (!newComposition[playerIndex]) {
        newComposition[playerIndex] = {
          player_id: player?.id || playerIndex,
          player_name: player?.username || player?.name || `Player ${playerIndex + 1}`,
          name: player?.username || player?.name || `Player ${playerIndex + 1}`,
          username: player?.username,
          hero: '',
          role: 'Duelist',
          country: player?.country || player?.nationality || 'US',
          nationality: player?.country || player?.nationality || 'US',
          country_flag: player?.country_flag || player?.flag,
          flag: player?.country_flag || player?.flag,
          avatar: player?.avatar,
          eliminations: 0,
          deaths: 0,
          assists: 0,
          damage: 0,
          healing: 0,
          damage_blocked: 0
        };
      }
      
      newComposition[playerIndex] = {
        ...newComposition[playerIndex],
        [stat]: parseInt(value) || 0
      };
      
      return { ...prev, [compositionKey]: newComposition };
    });
  };

  // Save all match data
  const handleSaveAllData = async () => {
    setIsSaving(true);
    
    try {
      // Update current map in maps array
      const updatedMaps = [...matchStats.maps];
      updatedMaps[matchStats.currentMapIndex] = {
        ...updatedMaps[matchStats.currentMapIndex],
        ...currentMapData,
        duration: matchTimer
      };

      // Calculate series scores
      let team1SeriesScore = 0;
      let team2SeriesScore = 0;
      
      updatedMaps.forEach(map => {
        if (map.status === 'completed') {
          if (map.team1Score > map.team2Score) {
            team1SeriesScore++;
          } else if (map.team2Score > map.team1Score) {
            team2SeriesScore++;
          }
        }
      });

      const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/live-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update_all',
          team1_score: team1SeriesScore,
          team2_score: team2SeriesScore,
          current_map: matchStats.currentMapIndex + 1,
          maps_data: updatedMaps,
          match_timer: matchTimer,
          status: matchStats.status
        })
      });

      if (response.ok) {
        console.log('Match data saved successfully');
        if (onUpdate) onUpdate();
      } else {
        console.error('Failed to save match data');
      }
    } catch (error) {
      console.error('Error saving match data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Match control functions
  const handlePauseMatch = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setIsPaused(true);
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error('Error pausing match:', error);
    }
  };

  const handleResumeMatch = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setIsPaused(false);
        setIsTimerRunning(true);
      }
    } catch (error) {
      console.error('Error resuming match:', error);
    }
  };

  const handleMapTransition = async () => {
    // Complete current map
    const updatedMaps = [...matchStats.maps];
    updatedMaps[matchStats.currentMapIndex] = {
      ...updatedMaps[matchStats.currentMapIndex],
      ...currentMapData,
      status: 'completed',
      winner_id: currentMapData.team1Score > currentMapData.team2Score ? match.team1.id : match.team2.id
    };

    // Check if match should end
    let team1Wins = 0;
    let team2Wins = 0;
    updatedMaps.forEach(map => {
      if (map.status === 'completed') {
        if (map.team1Score > map.team2Score) team1Wins++;
        else if (map.team2Score > map.team1Score) team2Wins++;
      }
    });

    const mapsToWin = Math.ceil(matchStats.totalMaps / 2);
    
    if (team1Wins >= mapsToWin || team2Wins >= mapsToWin) {
      // Match is complete
      await handleCompleteMatch();
    } else if (matchStats.currentMapIndex + 1 < matchStats.totalMaps) {
      // Transition to next map
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/transition-map`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setMatchStats(prev => ({
            ...prev,
            currentMapIndex: prev.currentMapIndex + 1,
            maps: updatedMaps
          }));
          
          // Reset for new map
          setCurrentMapData({
            team1Score: 0,
            team2Score: 0,
            team1Composition: [],
            team2Composition: [],
            status: 'upcoming'
          });
          setMatchTimer('00:00');
          setIsTimerRunning(false);
        }
      } catch (error) {
        console.error('Error transitioning map:', error);
      }
    }
  };

  const handleCompleteMatch = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        if (onUpdate) onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error completing match:', error);
    }
  };

  const handleResetMatch = async () => {
    if (!window.confirm('Are you sure you want to reset this match? All current progress will be lost.')) {
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Reset local state
        setMatchStats({
          ...matchStats,
          team1Score: 0,
          team2Score: 0,
          currentMapIndex: 0,
          status: 'live'
        });
        
        setCurrentMapData({
          team1Score: 0,
          team2Score: 0,
          team1Composition: [],
          team2Composition: [],
          status: 'ongoing'
        });
        
        setMatchTimer('00:00');
        setIsTimerRunning(false);
        setIsPaused(false);
        
        if (onUpdate) onUpdate();
        alert('Match has been reset successfully!');
      }
    } catch (error) {
      console.error('Error resetting match:', error);
      alert('Failed to reset match. Please try again.');
    }
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              Live Scoring - {match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Match Controls */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold text-white">
                  Map {matchStats.currentMapIndex + 1} of {matchStats.totalMaps}
                </span>
                <span className="text-2xl font-mono text-green-400">
                  {matchTimer}
                </span>
              </div>
              
              <div className="flex space-x-2">
                {!isTimerRunning ? (
                  <button
                    onClick={() => setIsTimerRunning(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Timer
                  </button>
                ) : (
                  <button
                    onClick={() => setIsTimerRunning(false)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded flex items-center"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Timer
                  </button>
                )}
                
                {isPaused ? (
                  <button
                    onClick={handleResumeMatch}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Resume Match
                  </button>
                ) : (
                  <button
                    onClick={handlePauseMatch}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                  >
                    Pause Match
                  </button>
                )}
                
                <button
                  onClick={handleResetMatch}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                  title="Reset match to initial state"
                >
                  Reset Match
                </button>
              </div>
            </div>

            {/* Series Score */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-400">Series Score</div>
                <div className="text-3xl font-bold text-white">
                  {matchStats.team1Score} - {matchStats.team2Score}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Current Map</div>
                <div className="text-lg text-white">
                  {matchStats.maps[matchStats.currentMapIndex]?.mapName || 'Unknown Map'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Game Mode</div>
                <div className="text-lg text-white">
                  {matchStats.maps[matchStats.currentMapIndex]?.mode || 'Unknown Mode'}
                </div>
              </div>
            </div>
          </div>

          {/* Map Score Controls */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">
                {match.team1?.name || 'Team 1'}
              </h3>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => updateMapScore(1, false)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  -
                </button>
                <div className="text-4xl font-bold text-white">
                  {currentMapData.team1Score}
                </div>
                <button
                  onClick={() => updateMapScore(1, true)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  +
                </button>
              </div>

              {/* Team 1 Composition */}
              <div className="space-y-2">
                {match.team1?.roster?.slice(0, 6).map((player, i) => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <div className="w-24 text-xs text-gray-300 truncate">
                      {player.username || player.name}
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center">
                      {currentMapData.team1Composition[i]?.hero && getHeroImageSync(currentMapData.team1Composition[i].hero) ? (
                        <img 
                          src={getHeroImageSync(currentMapData.team1Composition[i].hero)}
                          alt={currentMapData.team1Composition[i].hero}
                          className="w-8 h-8 object-contain"
                        />
                      ) : currentMapData.team1Composition[i]?.hero ? (
                        <span className="text-xs text-gray-400">
                          {currentMapData.team1Composition[i].hero.substring(0, 3)}
                        </span>
                      ) : null}
                    </div>
                    <select
                      value={currentMapData.team1Composition[i]?.hero || ''}
                      onChange={(e) => updatePlayerHero(1, i, e.target.value)}
                      className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      <option value="">Select Hero</option>
                      {Object.values(MARVEL_RIVALS_HEROES).map(hero => (
                        <option key={hero.id} value={hero.name}>
                          {hero.name} ({hero.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )) || [0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center space-x-2">
                    <select
                      value={currentMapData.team1Composition[i]?.hero || ''}
                      onChange={(e) => updatePlayerHero(1, i, e.target.value)}
                      className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      <option value="">Select Hero</option>
                      {Object.values(MARVEL_RIVALS_HEROES).map(hero => (
                        <option key={hero.id} value={hero.name}>
                          {hero.name} ({hero.role})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">
                {match.team2?.name || 'Team 2'}
              </h3>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => updateMapScore(2, false)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  -
                </button>
                <div className="text-4xl font-bold text-white">
                  {currentMapData.team2Score}
                </div>
                <button
                  onClick={() => updateMapScore(2, true)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  +
                </button>
              </div>

              {/* Team 2 Composition */}
              <div className="space-y-2">
                {match.team2?.roster?.slice(0, 6).map((player, i) => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <div className="w-24 text-xs text-gray-300 truncate">
                      {player.username || player.name}
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center">
                      {currentMapData.team2Composition[i]?.hero && getHeroImageSync(currentMapData.team2Composition[i].hero) ? (
                        <img 
                          src={getHeroImageSync(currentMapData.team2Composition[i].hero)}
                          alt={currentMapData.team2Composition[i].hero}
                          className="w-8 h-8 object-contain"
                        />
                      ) : currentMapData.team2Composition[i]?.hero ? (
                        <span className="text-xs text-gray-400">
                          {currentMapData.team2Composition[i].hero.substring(0, 3)}
                        </span>
                      ) : null}
                    </div>
                    <select
                      value={currentMapData.team2Composition[i]?.hero || ''}
                      onChange={(e) => updatePlayerHero(2, i, e.target.value)}
                      className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      <option value="">Select Hero</option>
                      {Object.values(MARVEL_RIVALS_HEROES).map(hero => (
                        <option key={hero.id} value={hero.name}>
                          {hero.name} ({hero.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )) || [0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center space-x-2">
                    <select
                      value={currentMapData.team2Composition[i]?.hero || ''}
                      onChange={(e) => updatePlayerHero(2, i, e.target.value)}
                      className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      <option value="">Select Hero</option>
                      {Object.values(MARVEL_RIVALS_HEROES).map(hero => (
                        <option key={hero.id} value={hero.name}>
                          {hero.name} ({hero.role})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Player Stats Section */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-4">Player Stats</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team 1 Stats */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-bold text-white mb-3">{match.team1?.name || 'Team 1'} Stats</h4>
                <div className="space-y-3">
                  {match.team1?.roster?.slice(0, 6).map((player, i) => (
                    <div key={player.id} className="border-b border-gray-600 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">{player.username || player.name}</span>
                        {currentMapData.team1Composition[i]?.hero && (
                          <span className="text-xs text-gray-400">{currentMapData.team1Composition[i].hero}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-400">E</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team1Composition[i]?.eliminations || 0}
                            onChange={(e) => updatePlayerStat(1, i, 'eliminations', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">D</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team1Composition[i]?.deaths || 0}
                            onChange={(e) => updatePlayerStat(1, i, 'deaths', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">A</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team1Composition[i]?.assists || 0}
                            onChange={(e) => updatePlayerStat(1, i, 'assists', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">DMG</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team1Composition[i]?.damage || 0}
                            onChange={(e) => updatePlayerStat(1, i, 'damage', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">HEAL</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team1Composition[i]?.healing || 0}
                            onChange={(e) => updatePlayerStat(1, i, 'healing', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">BLK</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team1Composition[i]?.damage_blocked || 0}
                            onChange={(e) => updatePlayerStat(1, i, 'damage_blocked', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        K/D: {currentMapData.team1Composition[i]?.deaths > 0 
                          ? (currentMapData.team1Composition[i]?.eliminations / currentMapData.team1Composition[i]?.deaths).toFixed(2)
                          : currentMapData.team1Composition[i]?.eliminations || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 Stats */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-bold text-white mb-3">{match.team2?.name || 'Team 2'} Stats</h4>
                <div className="space-y-3">
                  {match.team2?.roster?.slice(0, 6).map((player, i) => (
                    <div key={player.id} className="border-b border-gray-600 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">{player.username || player.name}</span>
                        {currentMapData.team2Composition[i]?.hero && (
                          <span className="text-xs text-gray-400">{currentMapData.team2Composition[i].hero}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-400">E</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team2Composition[i]?.eliminations || 0}
                            onChange={(e) => updatePlayerStat(2, i, 'eliminations', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">D</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team2Composition[i]?.deaths || 0}
                            onChange={(e) => updatePlayerStat(2, i, 'deaths', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">A</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team2Composition[i]?.assists || 0}
                            onChange={(e) => updatePlayerStat(2, i, 'assists', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">DMG</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team2Composition[i]?.damage || 0}
                            onChange={(e) => updatePlayerStat(2, i, 'damage', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">HEAL</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team2Composition[i]?.healing || 0}
                            onChange={(e) => updatePlayerStat(2, i, 'healing', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">BLK</label>
                          <input
                            type="number"
                            min="0"
                            value={currentMapData.team2Composition[i]?.damage_blocked || 0}
                            onChange={(e) => updatePlayerStat(2, i, 'damage_blocked', e.target.value)}
                            className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        K/D: {currentMapData.team2Composition[i]?.deaths > 0 
                          ? (currentMapData.team2Composition[i]?.eliminations / currentMapData.team2Composition[i]?.deaths).toFixed(2)
                          : currentMapData.team2Composition[i]?.eliminations || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleSaveAllData}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save All Data'}
            </button>

            {matchStats.currentMapIndex < matchStats.totalMaps - 1 && (
              <button
                onClick={handleMapTransition}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center"
              >
                <SkipForward className="w-5 h-5 mr-2" />
                Next Map
              </button>
            )}

            {(matchStats.currentMapIndex === matchStats.totalMaps - 1 || 
              matchStats.team1Score >= Math.ceil(matchStats.totalMaps / 2) ||
              matchStats.team2Score >= Math.ceil(matchStats.totalMaps / 2)) && (
              <button
                onClick={handleCompleteMatch}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Complete Match
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedLiveScoring;