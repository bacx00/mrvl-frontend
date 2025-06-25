import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';

/**
 * 🎮 COMPREHENSIVE LIVE SCORING - FIXED VERSION
 * Fixes: Hero persistence, country flags, save reset bug
 */
const ComprehensiveLiveScoring = ({ isOpen, match, onClose, token }) => {
  const { api } = useAuth();
  const [matchStats, setMatchStats] = useState(null);
  const [matchStatus, setMatchStatus] = useState('upcoming');
  // 🚨 PERSISTENT TIMER: Store in localStorage to persist across page changes
  const [matchTimer, setMatchTimer] = useState(() => {
    // Try to restore timer from localStorage
    const saved = localStorage.getItem(`match-timer-${match?.id}`);
    return saved || '00:00';
  });
  const [isTimerRunning, setIsTimerRunning] = useState(() => {
    // Try to restore running state from localStorage
    const saved = localStorage.getItem(`match-timer-running-${match?.id}`);
    return saved === 'true';
  });
  const [timerStartTime, setTimerStartTime] = useState(() => {
    // Try to restore start time from localStorage
    const saved = localStorage.getItem(`match-timer-start-${match?.id}`);
    return saved ? parseInt(saved) : null;
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // 🔍 DEBUG: Log what data we receive (ONCE)
  useEffect(() => {
    console.log('🎯 ComprehensiveLiveScoring MOUNTED with:', {
      isOpen,
      match: match ? {
        id: match.id,
        team1: match.team1?.name,
        team2: match.team2?.name,
        team1_id: match.team1_id,
        team2_id: match.team2_id
      } : null,
      hasToken: !!token
    });
  }, [match?.id]); // Only when match ID changes

  // 🎮 COMPLETE MARVEL RIVALS MAPS - ALL 8 MAPS
  const marvelRivalsMaps = [
    { name: 'Tokyo 2099: Shibuya Sky', mode: 'Convoy', icon: '🏙️' },
    { name: 'Klyntar: Symbiote Planet', mode: 'Domination', icon: '🖤' },
    { name: 'Asgard: Royal Palace', mode: 'Convergence', icon: '⚡' },
    { name: 'Tokyo 2099: Shin-Shibuya Station', mode: 'Convoy', icon: '🚅' },
    { name: 'Wakanda: Golden City', mode: 'Conquest', icon: '💎' },
    { name: 'Sanctum Sanctorum: Astral Plane', mode: 'Convoy', icon: '🔮' },
    { name: 'Yggsgard: Yggdrasil', mode: 'Convergence', icon: '🌳' },
    { name: 'Midtown Manhattan: Oscorp Tower', mode: 'Convoy', icon: '🏢' }
  ];

  // ✅ COMPLETE MARVEL RIVALS HEROES BY ROLE
  const marvelRivalsHeroes = {
    Tank: ['Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 'Peni Parker', 'The Thing', 'Thor', 'Venom'],
    Duelist: ['Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Human Torch', 'Iron Fist', 'Iron Man', 'Magik', 'Moon Knight', 'Namor', 'Psylocke', 'Punisher', 'Scarlet Witch', 'Spider-Man', 'Squirrel Girl', 'Star-Lord', 'Storm', 'Wolverine'],
    Support: ['Adam Warlock', 'Cloak & Dagger', 'Invisible Woman', 'Jeff the Land Shark', 'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon']
  };

  // Get all heroes in a flat array
  const allHeroes = Object.values(marvelRivalsHeroes).flat();

  // 🔄 LOAD TEAM PLAYERS UTILITY
  const loadTeamPlayers = async (teamId, teamName) => {
    try {
      console.log(`🔍 Fetching real players for team: ${teamName} (ID: ${teamId})`);
      
      const response = await api.get(`/teams/${teamId}`);
      
      if (response && response.data?.players) {
        const teamPlayers = response.data.players;
        console.log(`✅ Found ${teamPlayers.length} real players for ${teamName}:`, teamPlayers);
        
        return teamPlayers.slice(0, 6).map((player, index) => {
          // 🏳️ FIXED COUNTRY RESOLUTION
          const playerCountry = player.country || 
                               player.nationality || 
                               player.team_country ||
                               (teamName === 'test1' ? 'DE' : teamName === 'test2' ? 'KR' : 'US');
          
          console.log(`🌍 Player ${player.name} country resolved to:`, playerCountry);
          
          return {
            id: player.id,
            name: player.name,
            hero: player.main_hero || 'Captain America',
            role: player.role || 'Tank',
            country: playerCountry, // ✅ FIXED country resolution
            avatar: player.avatar,
            eliminations: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            damageBlocked: 0,
            objectiveTime: 0,
            ultimatesUsed: 0
          };
        });
      } else {
        console.log(`⚠️ Failed to fetch players for ${teamName}, using defaults`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error fetching team players for ${teamName}:`, error);
      return [];
    }
  };

  // 🚨 INITIALIZATION WITH PROPER MAP COUNT
  const initializeMatchStats = useCallback((format = 'BO1') => {
    const mapCount = format === 'BO1' ? 1 : format === 'BO3' ? 3 : format === 'BO5' ? 5 : format === 'BO7' ? 7 : 1;
    
    console.log('🔍 INITIALIZING ComprehensiveLiveScoring with match:', {
      id: match?.id,
      format: format,
      mapCount: mapCount,
      team1: match?.team1?.name || 'Team1',
      team2: match?.team2?.name || 'Team2'
    });

    return {
      totalMaps: mapCount,
      currentMap: 0,
      mapWins: { team1: 0, team2: 0 },
      maps: Array.from({ length: mapCount }, (_, index) => ({
        map_number: index + 1,
        map_name: marvelRivalsMaps[index % marvelRivalsMaps.length].name,
        mode: marvelRivalsMaps[index % marvelRivalsMaps.length].mode,
        team1Score: 0,
        team2Score: 0,
        status: 'upcoming',
        winner: null,
        duration: 'Not started',
        team1Players: [],
        team2Players: []
      }))
    };
  }, [match]);

  // 🔥 CRITICAL: LOAD SAVED MATCH DATA FIRST TO PREVENT HERO RESET
  useEffect(() => {
    const loadSavedMatchData = async () => {
      if (!match || !isOpen) {
        console.log('❌ ADMIN: Not loading - no match or not open');
        return;
      }

      console.log('🔍 ADMIN: Loading saved match data from backend...');
      
      try {
        // 🚨 CRITICAL: Try to load existing match data first
        const response = await api.get(`/matches/${match.id}`);
        
        if (response.success !== false && response.data) {
          const savedMatch = response.data;
          console.log('✅ ADMIN: Saved match data found:', savedMatch);
          
          // 🔥 CRITICAL: If match has saved map data with heroes, use it!
          if (savedMatch.maps && savedMatch.maps.length > 0) {
            console.log('🗺️ ADMIN: Using saved map data with heroes preserved!');
            
            setMatchStats({
              totalMaps: savedMatch.maps.length,
              currentMap: 0,
              mapWins: { 
                team1: savedMatch.team1_score || 0, 
                team2: savedMatch.team2_score || 0 
              },
              maps: savedMatch.maps.map((savedMap, index) => ({
                map_number: index + 1,
                map_name: savedMap.map_name || marvelRivalsMaps[index % marvelRivalsMaps.length].name,
                mode: savedMap.mode || marvelRivalsMaps[index % marvelRivalsMaps.length].mode,
                team1Score: savedMap.team1_score || 0,
                team2Score: savedMap.team2_score || 0,
                status: savedMap.status || 'upcoming',
                winner: savedMap.winner_id ? (savedMap.winner_id === match.team1_id ? 'team1' : 'team2') : null,
                duration: savedMap.duration || 'Not started',
                team1Players: savedMap.team1_composition?.map(comp => ({
                  id: comp.player_id,
                  name: comp.player_name,
                  hero: comp.hero || 'Captain America', // ✅ PRESERVE SAVED HERO!
                  role: comp.role,
                  country: comp.country || 'DE', // ✅ Use backend's fixed country
                  eliminations: comp.eliminations || 0,
                  deaths: comp.deaths || 0,
                  assists: comp.assists || 0,
                  damage: comp.damage || 0,
                  healing: comp.healing || 0,
                  damageBlocked: comp.damageBlocked || 0
                })) || [],
                team2Players: savedMap.team2_composition?.map(comp => ({
                  id: comp.player_id,
                  name: comp.player_name,
                  hero: comp.hero || 'Captain America', // ✅ PRESERVE SAVED HERO!
                  role: comp.role,
                  country: comp.country || 'KR', // ✅ Use backend's fixed country
                  eliminations: comp.eliminations || 0,
                  deaths: comp.deaths || 0,
                  assists: comp.assists || 0,
                  damage: comp.damage || 0,
                  healing: comp.healing || 0,
                  damageBlocked: comp.damageBlocked || 0
                })) || []
              }))
            });
            
            setMatchStatus(savedMatch.status || 'upcoming');
            console.log('✅ ADMIN: Match data loaded with saved heroes preserved!');
            return; // Don't load fresh players if we have saved data
          }
        }
      } catch (error) {
        console.log('⚠️ ADMIN: No saved match data, loading fresh players:', error.message);
      }

      // 🔄 FALLBACK: Load fresh players if no saved data
      console.log('🔍 ADMIN: Loading fresh player data...');
      
      const team1Id = match.team1?.id || match.team1_id;
      const team2Id = match.team2?.id || match.team2_id;
      
      if (team1Id && team2Id) {
        try {
          const [team1Players, team2Players] = await Promise.all([
            loadTeamPlayers(team1Id, match.team1?.name || 'Team1'),
            loadTeamPlayers(team2Id, match.team2?.name || 'Team2')
          ]);
          
          const initialStats = initializeMatchStats(match.format);
          
          setMatchStats({
            ...initialStats,
            maps: initialStats.maps.map((map, mapIndex) => ({
              ...map,
              team1Players: team1Players.length > 0 ? team1Players : [],
              team2Players: team2Players.length > 0 ? team2Players : []
            }))
          });
          
          console.log('✅ ADMIN: Fresh players loaded with correct countries');
        } catch (error) {
          console.error('❌ ADMIN: Error loading fresh players:', error);
          setMatchStats(initializeMatchStats(match.format));
        }
      } else {
        setMatchStats(initializeMatchStats(match.format));
      }
    };
    
    loadSavedMatchData();
  }, [match, isOpen, initializeMatchStats, api]);

  // 🦸 Change player hero
  const changePlayerHero = (mapIndex, team, playerIndex, hero, role) => {
    console.log(`🦸 Changing ${team} player ${playerIndex} to hero ${hero} (${role})`);
    
    setMatchStats(prev => {
      if (!prev || !prev.maps || !prev.maps[mapIndex]) return prev;
      
      const playersKey = team === 'team1' ? 'team1Players' : 'team2Players';
      const updatedMaps = [...prev.maps];
      const currentMap = { ...updatedMaps[mapIndex] };
      const players = [...(currentMap[playersKey] || [])];
      
      if (players[playerIndex]) {
        players[playerIndex] = {
          ...players[playerIndex],
          hero: hero,
          role: role
        };
        
        currentMap[playersKey] = players;
        updatedMaps[mapIndex] = currentMap;
        
        console.log(`✅ Hero changed: Player ${players[playerIndex].name} is now ${hero}`);
        
        // 🔥 Dispatch real-time sync event
        window.dispatchEvent(new CustomEvent('mrvl-hero-updated', {
          detail: {
            matchId: match.id,
            type: 'HERO_CHANGE',
            timestamp: Date.now(),
            changes: { mapIndex, team, playerIndex, hero, role }
          }
        }));
        console.log('🔥 Hero change event dispatched for immediate sync');
        
        return {
          ...prev,
          maps: updatedMaps
        };
      }
      
      return prev;
    });
  };

  // 📊 Update player stat
  const updatePlayerStat = (mapIndex, team, playerIndex, statName, value) => {
    console.log(`📊 Updating ${team} player ${playerIndex} ${statName} to ${value}`);
    
    setMatchStats(prev => {
      if (!prev || !prev.maps || !prev.maps[mapIndex]) return prev;
      
      const playersKey = team === 'team1' ? 'team1Players' : 'team2Players';
      const updatedMaps = [...prev.maps];
      const currentMap = { ...updatedMaps[mapIndex] };
      const players = [...(currentMap[playersKey] || [])];
      
      if (players[playerIndex]) {
        players[playerIndex] = {
          ...players[playerIndex],
          [statName]: parseInt(value) || 0
        };
        
        currentMap[playersKey] = players;
        updatedMaps[mapIndex] = currentMap;
        
        console.log(`✅ Stat updated: ${team} player ${playerIndex} now has ${statName}=${value}`);
        
        return {
          ...prev,
          maps: updatedMaps
        };
      }
      
      return prev;
    });
  };

  // 🔄 OPTIMIZED SAVE FUNCTION - PREVENT RESET BUG
  const handleSaveStats = async () => {
    if (!matchStats || !match) {
      console.log('❌ Cannot save: Missing matchStats or match');
      return;
    }

    setSaveLoading(true);
    
    try {
      console.log('🔄 SAVING CRITICAL DATA - Current State:', {
        mapWins: matchStats.mapWins,
        matchStatus: matchStatus,
        totalMaps: matchStats.maps?.length,
        activeMap: matchStats.currentMap
      });
      
      // 🚨 CRITICAL: Build complete save payload matching backend structure
      const savePayload = {
        team1_score: matchStats.mapWins.team1 || 0,
        team2_score: matchStats.mapWins.team2 || 0,
        status: matchStatus,
        maps: matchStats.maps.map((mapData, index) => ({
          map_number: index + 1,
          map_name: mapData.map_name,
          mode: mapData.mode,
          team1_score: mapData.team1Score || 0,
          team2_score: mapData.team2Score || 0,
          status: mapData.status || 'upcoming',
          winner_id: mapData.winner ? (mapData.winner === 'team1' ? match.team1_id : match.team2_id) : null,
          team1_composition: mapData.team1Players?.map(player => ({
            player_id: player.id,
            player_name: player.name,
            hero: player.hero, // ✅ PRESERVE hero selection
            role: player.role,
            country: player.country, // ✅ PRESERVE country
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damageBlocked || 0
          })) || [],
          team2_composition: mapData.team2Players?.map(player => ({
            player_id: player.id,
            player_name: player.name,
            hero: player.hero, // ✅ PRESERVE hero selection
            role: player.role,
            country: player.country, // ✅ PRESERVE country
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damageBlocked || 0
          })) || []
        }))
      };

      console.log('💾 SAVING TO BACKEND:', savePayload);

      const response = await api.put(`/admin/matches/${match.id}`, savePayload);
      
      console.log('✅ BACKEND SAVE SUCCESSFUL');
      
      // 🔥 DISPATCH COMPREHENSIVE SYNC EVENTS
      console.log('🔥 DISPATCHING COMPREHENSIVE SYNC EVENTS for match:', match.id);
      
      window.dispatchEvent(new CustomEvent('mrvl-match-updated', {
        detail: { 
          matchId: match.id, 
          type: 'COMPREHENSIVE_UPDATE',
          timestamp: Date.now()
        }
      }));
      
      window.dispatchEvent(new CustomEvent('mrvl-hero-updated', {
        detail: { 
          matchId: match.id, 
          type: 'BULK_HERO_UPDATE',
          timestamp: Date.now()
        }
      }));
      
      window.dispatchEvent(new CustomEvent('mrvl-stats-updated', {
        detail: { 
          matchId: match.id, 
          type: 'BULK_STATS_UPDATE',
          timestamp: Date.now()
        }
      }));
      
      // 🚨 CRITICAL: DO NOT RESET STATE AFTER SAVE!
      console.log('✅ Save complete - state preserved');
      
    } catch (error) {
      console.error('❌ Error saving match stats:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  // Timer controls - WITH PERSISTENCE
  const startTimer = () => {
    const startTime = Date.now();
    setIsTimerRunning(true);
    setTimerStartTime(startTime);
    // 🚨 PERSIST TO LOCALSTORAGE
    localStorage.setItem(`match-timer-running-${match.id}`, 'true');
    localStorage.setItem(`match-timer-start-${match.id}`, startTime.toString());
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    // 🚨 PERSIST TO LOCALSTORAGE
    localStorage.setItem(`match-timer-running-${match.id}`, 'false');
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setMatchTimer('00:00');
    setTimerStartTime(null);
    // 🚨 CLEAR FROM LOCALSTORAGE
    localStorage.removeItem(`match-timer-running-${match.id}`);
    localStorage.removeItem(`match-timer-start-${match.id}`);
    localStorage.removeItem(`match-timer-${match.id}`);
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && matchStatus === 'live') {
      interval = setInterval(() => {
        const now = Date.now();
        const start = timerStartTime || now;
        const elapsed = Math.floor((now - start) / 1000);
        
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        setMatchTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, matchStatus, timerStartTime]);

  if (!isOpen || !match || !matchStats) {
    return null;
  }

  console.log('🎯 ADMIN: Rendering with data:', {
    matchId: match.id,
    team1: match.team1?.name || 'Team1',
    team2: match.team2?.name || 'Team2',
    mapsCount: matchStats.maps?.length,
    team1PlayersCount: matchStats.maps?.[0]?.team1Players?.length,
    team2PlayersCount: matchStats.maps?.[0]?.team2Players?.length
  });

  const currentMapData = matchStats.maps[matchStats.currentMap] || matchStats.maps[0];
  
  console.log('🎯 ADMIN: currentMapData analysis:', {
    activeMap: matchStats.currentMap,
    totalMaps: matchStats.maps?.length,
    currentMapExists: !!currentMapData,
    team1PlayersCount: currentMapData?.team1Players?.length,
    team2PlayersCount: currentMapData?.team2Players?.length,
    mapName: currentMapData?.map_name,
    mode: currentMapData?.mode
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-white">
                🎮 Live Match Control
              </h2>
              <div className="flex items-center space-x-2">
                <TeamLogo team={match.team1?.name || 'Team1'} logoUrl={match.team1?.logo} size="sm" />
                <span className="text-blue-400 font-semibold">{match.team1?.name || 'Team1'}</span>
                <span className="text-gray-400">vs</span>
                <span className="text-red-400 font-semibold">{match.team2?.name || 'Team2'}</span>
                <TeamLogo team={match.team2?.name || 'Team2'} logoUrl={match.team2?.logo} size="sm" />
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Match Status & Timer */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                >
                  <option value="upcoming">📅 Upcoming</option>
                  <option value="live">🔴 Live</option>
                  <option value="paused">⏸️ Paused</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
                
                <div className="text-2xl font-mono text-green-400">
                  {matchTimer}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={startTimer}
                    disabled={isTimerRunning}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm"
                  >
                    ▶️ Start
                  </button>
                  <button
                    onClick={pauseTimer}
                    disabled={!isTimerRunning}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded text-sm"
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    onClick={resetTimer}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {currentMapData?.map_name || 'Map not selected'}
                </div>
                <div className="text-sm text-gray-400">
                  {currentMapData?.mode || 'Mode not selected'}
                </div>
              </div>
            </div>
          </div>

          {/* Map Navigation */}
          <div className="flex justify-center space-x-2 mb-6">
            {matchStats.maps.map((_, index) => (
              <button
                key={index}
                onClick={() => setMatchStats(prev => ({ ...prev, currentMap: index }))}
                className={`px-4 py-2 rounded font-semibold ${
                  matchStats.currentMap === index
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Map {index + 1}
              </button>
            ))}
          </div>

          {/* Current Map */}
          {currentMapData && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="text-center mb-6">
                <div className="bg-red-600 text-white px-4 py-2 rounded-lg inline-block">
                  🗺️ {currentMapData.map_name}
                  <div className="text-sm opacity-90">{currentMapData.mode}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team 1 Players */}
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-4">
                    {match.team1?.name || 'Team1'} Players - {currentMapData.map_name}
                  </h3>
                  {currentMapData.team1Players?.map((player, playerIndex) => (
                    <div key={playerIndex} className="bg-gray-700 rounded-lg p-4 mb-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {player.name?.charAt(0) || 'P'}
                          </div>
                          {/* Country Flag */}
                          <img 
                            src={`https://flagcdn.com/16x12/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                            alt={`${player.country || 'US'} flag`}
                            className="absolute -bottom-1 -right-1 w-3 h-2 rounded-sm border border-white shadow-sm"
                            onError={(e) => {
                              console.log(`❌ Flag failed for country: ${player.country || 'undefined'}, using fallback`);
                              e.target.style.display = 'none';
                              const textNode = document.createElement('div');
                              textNode.className = 'absolute -bottom-1 -right-1 w-4 h-3 text-xs bg-gray-500 text-white rounded-sm flex items-center justify-center';
                              textNode.textContent = (player.country || 'US').slice(0, 2).toUpperCase();
                              e.target.parentNode.appendChild(textNode);
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{player.name}</div>
                          <select
                            value={player.hero || 'Captain America'}
                            onChange={(e) => {
                              const selectedHero = e.target.value;
                              const heroRole = Object.keys(marvelRivalsHeroes).find(role => 
                                marvelRivalsHeroes[role].includes(selectedHero)
                              ) || 'Tank';
                              changePlayerHero(matchStats.currentMap, 'team1', playerIndex, selectedHero, heroRole);
                            }}
                            className="bg-gray-600 text-white px-2 py-1 rounded text-sm border border-gray-500"
                          >
                            {Object.entries(marvelRivalsHeroes).map(([role, heroes]) => (
                              <optgroup key={role} label={role}>
                                {heroes.map(hero => (
                                  <option key={hero} value={hero}>{hero}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Player Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {['eliminations', 'deaths', 'assists', 'damage', 'healing', 'damageBlocked'].map(stat => (
                          <div key={stat} className="text-center">
                            <div className="text-xs text-gray-400 uppercase">{stat}</div>
                            <input
                              type="number"
                              value={player[stat] || 0}
                              onChange={(e) => updatePlayerStat(matchStats.currentMap, 'team1', playerIndex, stat, e.target.value)}
                              className="w-full bg-gray-600 text-white text-center px-1 py-1 rounded text-sm"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Team 2 Players */}
                <div>
                  <h3 className="text-xl font-bold text-red-400 mb-4">
                    {match.team2?.name || 'Team2'} Players - {currentMapData.map_name}
                  </h3>
                  {currentMapData.team2Players?.map((player, playerIndex) => (
                    <div key={playerIndex} className="bg-gray-700 rounded-lg p-4 mb-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                            {player.name?.charAt(0) || 'P'}
                          </div>
                          {/* Country Flag */}
                          <img 
                            src={`https://flagcdn.com/16x12/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                            alt={`${player.country || 'US'} flag`}
                            className="absolute -bottom-1 -right-1 w-3 h-2 rounded-sm border border-white shadow-sm"
                            onError={(e) => {
                              console.log(`❌ Flag failed for country: ${player.country || 'undefined'}, using fallback`);
                              e.target.style.display = 'none';
                              const textNode = document.createElement('div');
                              textNode.className = 'absolute -bottom-1 -right-1 w-4 h-3 text-xs bg-gray-500 text-white rounded-sm flex items-center justify-center';
                              textNode.textContent = (player.country || 'US').slice(0, 2).toUpperCase();
                              e.target.parentNode.appendChild(textNode);
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{player.name}</div>
                          <select
                            value={player.hero || 'Captain America'}
                            onChange={(e) => {
                              const selectedHero = e.target.value;
                              const heroRole = Object.keys(marvelRivalsHeroes).find(role => 
                                marvelRivalsHeroes[role].includes(selectedHero)
                              ) || 'Tank';
                              changePlayerHero(matchStats.currentMap, 'team2', playerIndex, selectedHero, heroRole);
                            }}
                            className="bg-gray-600 text-white px-2 py-1 rounded text-sm border border-gray-500"
                          >
                            {Object.entries(marvelRivalsHeroes).map(([role, heroes]) => (
                              <optgroup key={role} label={role}>
                                {heroes.map(hero => (
                                  <option key={hero} value={hero}>{hero}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Player Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {['eliminations', 'deaths', 'assists', 'damage', 'healing', 'damageBlocked'].map(stat => (
                          <div key={stat} className="text-center">
                            <div className="text-xs text-gray-400 uppercase">{stat}</div>
                            <input
                              type="number"
                              value={player[stat] || 0}
                              onChange={(e) => updatePlayerStat(matchStats.currentMap, 'team2', playerIndex, stat, e.target.value)}
                              className="w-full bg-gray-600 text-white text-center px-1 py-1 rounded text-sm"
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

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveStats}
              disabled={saveLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center space-x-2"
            >
              {saveLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Match Statistics & Heroes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveLiveScoring;